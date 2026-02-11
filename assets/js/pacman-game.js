// Pac-Man Game - Problem 2.2: Ghosts with Difficulty
class Ghost {
    constructor(x, y, color, difficulty) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.dir = Math.floor(Math.random() * 4);
        this.moveCounter = 0;
        
        // Adjust speed by difficulty
        if (difficulty === 'easy') this.moveFrequency = 3;
        else if (difficulty === 'medium') this.moveFrequency = 2;
        else this.moveFrequency = 1;
        
        this.escapeMode = true; // Try to escape ghost house first
        this.escapeCounter = 0;
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = Math.floor(Math.random() * 4);
        this.escapeMode = true;
        this.escapeCounter = 0;
    }
}

class PacManGame {
    constructor(canvasId, difficulty = 'medium') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.difficulty = difficulty;
        
        // Game constants
        this.TILE_SIZE = 20;
        this.COLS = this.canvas.width / this.TILE_SIZE;
        this.ROWS = this.canvas.height / this.TILE_SIZE;
        
        // Game state
        this.gameRunning = true;
        this.gameOver = false;
        this.score = 0;
        this.lives = 3;
        this.pelletsRemaining = 0;
        
        // Maze (0 = empty, 1 = wall, 2 = pellet)
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,1,2,2,2,2,2,2,2,2,1,2,2,2,2,1],
            [1,1,1,1,2,1,1,1,1,0,0,1,1,1,1,2,1,1,1,1],
            [1,1,1,1,2,1,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
            [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
            [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
            [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
            [1,1,1,1,2,1,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
            [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,1],
            [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,1,2,2,2,2,2,2,2,2,1,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ];
        
        // Pac-Man
        this.pacman = {
            x: 9,
            y: 15,
            dir: 0,
            nextDir: 0
        };
        
        // Create ghosts based on difficulty
        this.ghosts = [];
        this.createGhosts();
        
        // Count pellets
        this.countPellets();
        
        // Input handling
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        
        // Game loop
        this.gameLoopId = null;
        this.frameCount = 0;
    }
    
    createGhosts() {
        const ghostConfigs = [
            { x: 9, y: 8, color: '#FF0000' },
            { x: 8, y: 9, color: '#FFB6C1' },
            { x: 9, y: 9, color: '#00FFFF' },
            { x: 10, y: 9, color: '#FFB347' }
        ];
        
        let ghostCount = 1;
        if (this.difficulty === 'medium') ghostCount = 2;
        else if (this.difficulty === 'hard') ghostCount = 4;
        
        this.ghosts = [];
        for (let i = 0; i < ghostCount; i++) {
            this.ghosts.push(new Ghost(ghostConfigs[i].x, ghostConfigs[i].y, ghostConfigs[i].color, this.difficulty));
        }
    }
    
    countPellets() {
        this.pelletsRemaining = 0;
        for (let row of this.maze) {
            for (let cell of row) {
                if (cell === 2) this.pelletsRemaining++;
            }
        }
    }
    
    handleInput() {
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.pacman.nextDir = 0;
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) this.pacman.nextDir = 1;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) this.pacman.nextDir = 2;
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) this.pacman.nextDir = 3;
    }
    
    isWall(x, y) {
        if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) return false;
        return this.maze[y][x] === 1;
    }
    
    canMove(x, y, dir) {
        let nextX = x;
        let nextY = y;
        
        if (dir === 0) nextX++;
        else if (dir === 1) nextY++;
        else if (dir === 2) nextX--;
        else if (dir === 3) nextY--;
        
        nextX = (nextX + this.COLS) % this.COLS;
        nextY = (nextY + this.ROWS) % this.ROWS;
        
        return !this.isWall(nextX, nextY);
    }
    
    movePacman() {
        if (!this.gameRunning) return;
        
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDir)) {
            this.pacman.dir = this.pacman.nextDir;
        }
        
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.dir)) {
            if (this.pacman.dir === 0) this.pacman.x++;
            else if (this.pacman.dir === 1) this.pacman.y++;
            else if (this.pacman.dir === 2) this.pacman.x--;
            else if (this.pacman.dir === 3) this.pacman.y--;
            
            this.pacman.x = (this.pacman.x + this.COLS) % this.COLS;
            this.pacman.y = (this.pacman.y + this.ROWS) % this.ROWS;
        }
    }
    
    eatPellet() {
        if (this.maze[this.pacman.y][this.pacman.x] === 2) {
            this.maze[this.pacman.y][this.pacman.x] = 0;
            this.score += 10;
            this.pelletsRemaining--;
            this.updateUI();
            
            if (this.pelletsRemaining === 0) {
                this.gameRunning = false;
                console.log('Level Complete!');
                this.updateUI();
            }
        }
    }
    
    moveGhosts() {
        for (let ghost of this.ghosts) {
            ghost.moveCounter++;
            if (ghost.moveCounter < ghost.moveFrequency) continue;
            ghost.moveCounter = 0;
            
            let possibleDirs = [];
            
            if (ghost.escapeMode) {
                // Try to escape ghost house
                ghost.escapeCounter++;
                if (ghost.escapeCounter > 10) {
                    ghost.escapeMode = false; // Start chasing after 10 moves
                }
                
                // Try up first to escape
                for (let dir = 0; dir < 4; dir++) {
                    if (this.canMove(ghost.x, ghost.y, dir)) possibleDirs.push(dir);
                }
            } else {
                // Chase Pac-Man
                const dx = this.pacman.x - ghost.x;
                const dy = this.pacman.y - ghost.y;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0 && this.canMove(ghost.x, ghost.y, 0)) possibleDirs.push(0);
                    if (dx < 0 && this.canMove(ghost.x, ghost.y, 2)) possibleDirs.push(2);
                    if (dy > 0 && this.canMove(ghost.x, ghost.y, 1)) possibleDirs.push(1);
                    if (dy < 0 && this.canMove(ghost.x, ghost.y, 3)) possibleDirs.push(3);
                } else {
                    if (dy > 0 && this.canMove(ghost.x, ghost.y, 1)) possibleDirs.push(1);
                    if (dy < 0 && this.canMove(ghost.x, ghost.y, 3)) possibleDirs.push(3);
                    if (dx > 0 && this.canMove(ghost.x, ghost.y, 0)) possibleDirs.push(0);
                    if (dx < 0 && this.canMove(ghost.x, ghost.y, 2)) possibleDirs.push(2);
                }
            }
            
            if (possibleDirs.length === 0) {
                for (let dir = 0; dir < 4; dir++) {
                    if (this.canMove(ghost.x, ghost.y, dir)) possibleDirs.push(dir);
                }
            }
            
            if (possibleDirs.length > 0) {
                ghost.dir = possibleDirs[0];
                
                if (ghost.dir === 0) ghost.x++;
                else if (ghost.dir === 1) ghost.y++;
                else if (ghost.dir === 2) ghost.x--;
                else if (ghost.dir === 3) ghost.y--;
                
                ghost.x = (ghost.x + this.COLS) % this.COLS;
                ghost.y = (ghost.y + this.ROWS) % this.ROWS;
            }
        }
    }
    
    checkCollisions() {
        for (let ghost of this.ghosts) {
            if (this.pacman.x === ghost.x && this.pacman.y === ghost.y) {
                this.lives--;
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameRunning = false;
                    this.gameOver = true;
                } else {
                    this.pacman.x = 9;
                    this.pacman.y = 15;
                    for (let g of this.ghosts) {
                        g.reset();
                    }
                }
                break;
            }
        }
    }
    
    update() {
        this.handleInput();
        this.movePacman();
        this.eatPellet();
        this.moveGhosts();
        this.checkCollisions();
    }
    
    drawMaze() {
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const cell = this.maze[y][x];
                
                if (cell === 1) {
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(x * this.TILE_SIZE, y * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
                } else if (cell === 2) {
                    this.ctx.fillStyle = '#000000';
                    const pelletSize = 3;
                    this.ctx.fillRect(
                        x * this.TILE_SIZE + this.TILE_SIZE / 2 - pelletSize / 2,
                        y * this.TILE_SIZE + this.TILE_SIZE / 2 - pelletSize / 2,
                        pelletSize,
                        pelletSize
                    );
                }
            }
        }
    }
    
    drawPacman() {
        const x = this.pacman.x * this.TILE_SIZE + this.TILE_SIZE / 2;
        const y = this.pacman.y * this.TILE_SIZE + this.TILE_SIZE / 2;
        const radius = this.TILE_SIZE / 2 - 2;
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#000000';
        const eyeX = x + radius * 0.5;
        const eyeY = y - radius * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(x + radius * 0.2, y + radius * 0.2, 2, -Math.PI / 4, Math.PI / 4);
        this.ctx.stroke();
    }
    
    drawGhosts() {
        for (let ghost of this.ghosts) {
            const x = ghost.x * this.TILE_SIZE;
            const y = ghost.y * this.TILE_SIZE;
            const size = this.TILE_SIZE - 2;
            
            this.ctx.fillStyle = ghost.color;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 2, y + size / 2);
            this.ctx.lineTo(x + 2, y + 2);
            this.ctx.quadraticCurveTo(x + 2, y + 2, x + size / 2, y + 2);
            this.ctx.quadraticCurveTo(x + size, y + 2, x + size, y + size / 2);
            this.ctx.lineTo(x + size, y + size);
            this.ctx.lineTo(x + 2, y + size);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(x + 4, y + 5, 3, 3);
            this.ctx.fillRect(x + size - 7, y + 5, 3, 3);
            
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x + 5, y + 6, 1.5, 1.5);
            this.ctx.fillRect(x + size - 6, y + 6, 1.5, 1.5);
        }
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('livesValue').textContent = this.lives;
        document.getElementById('pelletsValue').textContent = this.pelletsRemaining;
        document.getElementById('difficultyDisplay').textContent = this.difficulty.toUpperCase() + ' (' + this.ghosts.length + ' ghosts)';
        
        if (this.gameOver) {
            document.getElementById('gameStatus').textContent = 'Game Over! Refresh to play again.';
        } else if (!this.gameRunning && !this.gameOver) {
            document.getElementById('gameStatus').textContent = 'Level Complete! Refresh to play again.';
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMaze();
        this.drawGhosts();
        this.drawPacman();
    }
    
    gameLoop() {
        this.update();
        this.draw();
    }
    
    start() {
        this.updateUI();
        this.gameLoopId = setInterval(() => this.gameLoop(), 100);
    }
    
    stop() {
        if (this.gameLoopId) {
            clearInterval(this.gameLoopId);
            this.gameLoopId = null;
        }
    }
}

// Global game instance
let currentGame = null;

function startGame(difficulty) {
    if (currentGame) currentGame.stop();
    currentGame = new PacManGame('gameCanvas', difficulty);
    currentGame.start();
    window.game = currentGame;
}

document.addEventListener('DOMContentLoaded', () => {
    startGame('medium');
});
