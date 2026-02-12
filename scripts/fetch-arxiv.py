#!/usr/bin/env python3
"""
Fetch latest papers from arXiv API and save to JSON
Categories: cs.AI, cs.LG, stat.ML
Max papers: 100
"""

import json
import urllib.request
import urllib.parse
from datetime import datetime
from xml.etree import ElementTree as ET
import os

OUTPUT_FILE = 'docs/data/arxiv.json'
CATEGORIES = ['cat:cs.AI', 'cat:cs.LG', 'cat:stat.ML']
MAX_RESULTS = 100

def fetch_arxiv_papers():
    """Fetch papers from arXiv API"""
    papers = []
    
    # Build query: (cat:cs.AI OR cat:cs.LG OR cat:stat.ML)
    query = ' OR '.join(CATEGORIES)
    
    # arXiv API endpoint
    base_url = 'http://export.arxiv.org/api/query?'
    params = {
        'search_query': f'({query})',
        'start': 0,
        'max_results': MAX_RESULTS,
        'sortBy': 'submittedDate',
        'sortOrder': 'descending'
    }
    
    url = base_url + urllib.parse.urlencode(params)
    
    try:
        print(f"Fetching papers from: {url[:80]}...")
        with urllib.request.urlopen(url, timeout=30) as response:
            xml_data = response.read()
        
        # Parse XML response
        root = ET.fromstring(xml_data)
        
        # Define namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        # Extract entries
        for entry in root.findall('atom:entry', ns):
            try:
                # Extract fields
                paper_id = entry.find('atom:id', ns).text.split('/abs/')[-1]
                title = entry.find('atom:title', ns).text.strip().replace('\n', ' ')
                published = entry.find('atom:published', ns).text[:10]  # YYYY-MM-DD
                summary = entry.find('atom:summary', ns).text.strip().replace('\n', ' ')
                
                # Extract authors
                authors = []
                for author in entry.findall('atom:author', ns):
                    name = author.find('atom:name', ns).text
                    authors.append(name)
                
                # Extract primary category
                category = entry.find('atom:category', ns).get('term', 'Unknown')
                
                # Build paper object
                paper = {
                    'id': paper_id,
                    'title': title,
                    'authors': authors,
                    'published': published,
                    'summary': summary,
                    'category': category,
                    'url': f'https://arxiv.org/abs/{paper_id}'
                }
                
                papers.append(paper)
                print(f"  ✓ {paper_id}: {title[:60]}...")
                
            except Exception as e:
                print(f"  ✗ Error parsing entry: {e}")
                continue
        
        print(f"\nSuccessfully fetched {len(papers)} papers")
        return papers
        
    except Exception as e:
        print(f"Error fetching from arXiv: {e}")
        return None


def load_existing_papers():
    """Load existing papers from JSON file"""
    if not os.path.exists(OUTPUT_FILE):
        return []
    
    try:
        with open(OUTPUT_FILE, 'r') as f:
            data = json.load(f)
            return data.get('papers', [])
    except:
        return []


def merge_papers(existing, new):
    """Merge new papers with existing, avoiding duplicates"""
    existing_ids = {p['id'] for p in existing}
    merged = existing.copy()
    
    for paper in new:
        if paper['id'] not in existing_ids:
            merged.insert(0, paper)  # Insert at beginning (newest first)
    
    # Keep only last 100 papers
    return merged[:100]


def save_papers(papers):
    """Save papers to JSON file"""
    data = {
        'lastUpdated': datetime.utcnow().isoformat() + 'Z',
        'papers': papers
    }
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Saved {len(papers)} papers to {OUTPUT_FILE}")


def main():
    print("=" * 60)
    print("arXiv Paper Fetcher")
    print("=" * 60)
    
    # Fetch new papers
    new_papers = fetch_arxiv_papers()
    
    if new_papers is None:
        print("Failed to fetch papers, skipping update")
        return
    
    # Load existing papers
    existing_papers = load_existing_papers()
    print(f"\nExisting papers in database: {len(existing_papers)}")
    
    # Merge papers
    all_papers = merge_papers(existing_papers, new_papers)
    print(f"Total papers after merge: {len(all_papers)}")
    
    # Save to JSON
    save_papers(all_papers)
    print("\n✓ Update complete!")


if __name__ == '__main__':
    main()
