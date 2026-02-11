// Pac-Man Game - Problem 2.3: Roses and Heart Projectiles
class Ghost {
    constructor(x, y, color, difficulty) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.dir = Math.floor(Math.random() * 4);
        this.moveCounter = 0;
        this.alive = true;
        
        // Adjust speed by difficulty
        if (difficulty === 'easy') this.moveFrequency = 3;
        else if (difficulty === 'medium') this.moveFrequency = 2;
        else this.moveFrequency = 1;
        
        this.escapeMode = true;
        this.escapeCounter = 0;
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = Math.floor(Math.random() * 4);
        this.alive = true;
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
        this.gameRunning = false;
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.lives = 3;
        this.pelletsRemaining = 0;
        
        // Power-up system
        this.poweredUp = false;
        this.powerUpTimer = 0;
        this.powerUpDuration = this.getPowerUpDuration();
        this.rose = null;
        this.roseSpawnCounter = 0;
        this.roseRespawnTime = 0;
        
        // Heart projectiles
        this.hearts = [];
        
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
            { x: 6, y: 10, color: '#FF0000' },      // Red - left
            { x: 13, y: 10, color: '#FFB6C1' },     // Pink - right
            { x: 9, y: 12, color: '#00FFFF' }       // Cyan - bottom center
        ];
        
        let ghostCount = 1;
        if (this.difficulty === 'medium') ghostCount = 2;
        else if (this.difficulty === 'hard') ghostCount = 3;
        
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
    
    getPowerUpDuration() {
        if (this.difficulty === 'easy') return 5000; // 5 seconds
        else if (this.difficulty === 'medium') return 4000; // 4 seconds
        else return 3000; // 3 seconds
    }
    
    spawnRose() {
        if (this.rose) return; // Rose already exists
        
        let x, y, valid;
        do {
            x = Math.floor(Math.random() * this.COLS);
            y = Math.floor(Math.random() * this.ROWS);
            valid = this.maze[y][x] === 0 || this.maze[y][x] === 2; // Empty or pellet space
            
            // Avoid unreachable ghost house interior (roughly center area)
            if (valid && x >= 8 && x <= 11 && y >= 9 && y <= 12) {
                valid = false;
            }
        } while (!valid);
        
        this.rose = { x, y };
    }
    
    handleInput() {
        // Start game on first key press
        if (!this.gameStarted && Object.keys(this.keys).some(k => this.keys[k])) {
            this.gameStarted = true;
            this.gameRunning = true;
        }
        
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.pacman.nextDir = 0;
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) this.pacman.nextDir = 1;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) this.pacman.nextDir = 2;
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) this.pacman.nextDir = 3;
        
        // Shoot hearts when powered up and B is pressed
        if (this.poweredUp && (this.keys['b'] || this.keys['B'])) {
            this.shootHeart();
        }
    }
    
    shootHeart() {
        const dx = [1, 0, -1, 0];
        const dy = [0, 1, 0, -1];
        
        const heart = {
            x: this.pacman.x + dx[this.pacman.dir],
            y: this.pacman.y + dy[this.pacman.dir],
            dir: this.pacman.dir
        };
        
        this.hearts.push(heart);
    }
    
    moveHearts() {
        const dx = [1, 0, -1, 0];
        const dy = [0, 1, 0, -1];
        
        for (let i = this.hearts.length - 1; i >= 0; i--) {
            const heart = this.hearts[i];
            
            // Move heart
            heart.x += dx[heart.dir];
            heart.y += dy[heart.dir];
            
            // Remove if hits wall or goes out of bounds
            if (heart.x < 0 || heart.x >= this.COLS || heart.y < 0 || heart.y >= this.ROWS ||
                this.isWall(heart.x, heart.y)) {
                this.hearts.splice(i, 1);
                continue;
            }
            
            // Check collision with ghosts
            for (let ghost of this.ghosts) {
                if (ghost.alive && heart.x === ghost.x && heart.y === ghost.y) {
                    ghost.alive = false;
                    this.hearts.splice(i, 1);
                    this.score += 50;
                    break;
                }
            }
        }
    }
    
    updatePowerUp() {
        if (!this.poweredUp) {
            // Try to spawn rose
            this.roseSpawnCounter++;
            if (!this.rose && this.roseSpawnCounter > this.roseRespawnTime) {
                this.spawnRose();
                this.roseRespawnTime = Math.floor(Math.random() * 100) + 50; // 0.5-1 seconds
                this.roseSpawnCounter = 0;
            }
        } else {
            // Decrease power-up timer
            this.powerUpTimer -= 100;
            if (this.powerUpTimer <= 0) {
                this.poweredUp = false;
                this.powerUpTimer = 0;
                // Respawn dead ghosts
                for (let ghost of this.ghosts) {
                    if (!ghost.alive) {
                        ghost.reset();
                    }
                }
            }
        }
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
    
    eatRose() {
        if (this.rose && this.pacman.x === this.rose.x && this.pacman.y === this.rose.y) {
            this.poweredUp = true;
            this.powerUpTimer = this.getPowerUpDuration();
            this.rose = null;
            this.score += 100;
            this.updateUI();
        }
    }
    
    moveGhosts() {
        if (!this.gameRunning) return;
        
        for (let ghost of this.ghosts) {
            if (!ghost.alive) continue; // Skip dead ghosts
            
            ghost.moveCounter++;
            if (ghost.moveCounter < ghost.moveFrequency) continue;
            ghost.moveCounter = 0;
            
            let possibleDirs = [];
            
            if (ghost.escapeMode) {
                // Try to escape ghost house - prefer up then left/right
                ghost.escapeCounter++;
                if (ghost.escapeCounter > 15) {
                    ghost.escapeMode = false; // Start chasing after 15 moves
                }
                
                // Priority: up (3), then sideways (0, 2), then down (1)
                if (this.canMove(ghost.x, ghost.y, 3)) possibleDirs.push(3);
                if (this.canMove(ghost.x, ghost.y, 0)) possibleDirs.push(0);
                if (this.canMove(ghost.x, ghost.y, 2)) possibleDirs.push(2);
                if (this.canMove(ghost.x, ghost.y, 1)) possibleDirs.push(1);
            } else {
                // Chase Pac-Man using A* style scoring
                const dx = this.pacman.x - ghost.x;
                const dy = this.pacman.y - ghost.y;
                
                let dirScores = [];
                for (let dir = 0; dir < 4; dir++) {
                    if (!this.canMove(ghost.x, ghost.y, dir)) continue;
                    
                    let nextX = ghost.x, nextY = ghost.y;
                    if (dir === 0) nextX++;
                    else if (dir === 1) nextY++;
                    else if (dir === 2) nextX--;
                    else if (dir === 3) nextY--;
                    
                    // Check bounds WITHOUT wrapping for pathfinding
                    if (nextX < 0 || nextX >= this.COLS || nextY < 0 || nextY >= this.ROWS) continue;
                    
                    const newDx = this.pacman.x - nextX;
                    const newDy = this.pacman.y - nextY;
                    const distance = Math.abs(newDx) + Math.abs(newDy);
                    
                    dirScores.push({ dir, distance });
                }
                
                if (dirScores.length > 0) {
                    dirScores.sort((a, b) => a.distance - b.distance);
                    possibleDirs.push(dirScores[0].dir);
                }
            }
            
            // Fallback: any valid direction
            if (possibleDirs.length === 0) {
                for (let dir = 0; dir < 4; dir++) {
                    if (this.canMove(ghost.x, ghost.y, dir)) possibleDirs.push(dir);
                }
            }
            
            if (possibleDirs.length > 0) {
                ghost.dir = possibleDirs[0];
                
                let nextX = ghost.x, nextY = ghost.y;
                if (ghost.dir === 0) nextX++;
                else if (ghost.dir === 1) nextY++;
                else if (ghost.dir === 2) nextX--;
                else if (ghost.dir === 3) nextY--;
                
                // Don't allow overlap with other ghosts
                let occupiedByGhost = false;
                for (let other of this.ghosts) {
                    if (other !== ghost && other.alive && other.x === nextX && other.y === nextY) {
                        occupiedByGhost = true;
                        break;
                    }
                }
                
                if (!occupiedByGhost) {
                    ghost.x = nextX;
                    ghost.y = nextY;
                }
            }
        }
    }
    
    checkCollisions() {
        if (this.lives <= 0) return;  // Don't check collisions if already dead
        
        for (let ghost of this.ghosts) {
            if (!ghost.alive) continue; // Can't collide with dead ghosts
            
            if (this.pacman.x === ghost.x && this.pacman.y === ghost.y) {
                this.lives--;
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameRunning = false;
                    this.gameOver = true;
                    document.getElementById('gameStatus').textContent = 'Game Over! Refresh to play again.';
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
        this.eatRose();
        this.moveGhosts();
        this.moveHearts();
        this.checkCollisions();
        this.updatePowerUp();
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
        
        // Change color if powered up
        this.ctx.fillStyle = this.poweredUp ? '#FFD700' : '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow effect if powered
        if (this.poweredUp) {
            this.ctx.strokeStyle = '#FF69B4';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
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
            if (!ghost.alive) continue; // Don't draw dead ghosts
            
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
        
        // Show difficulty only after game starts
        const diffDisplay = document.getElementById('difficultyDisplay');
        if (this.gameStarted) {
            diffDisplay.textContent = this.difficulty.toUpperCase() + ' (' + this.ghosts.length + ' ghosts)';
            diffDisplay.style.display = 'inline';
        } else {
            diffDisplay.style.display = 'none';
        }
        
        // Update power-up display
        const powerUpDisplay = document.getElementById('powerUpDisplay');
        if (this.poweredUp) {
            const remaining = Math.ceil(this.powerUpTimer / 1000);
            powerUpDisplay.textContent = remaining + 's';
            powerUpDisplay.style.display = 'inline';
        } else {
            powerUpDisplay.style.display = 'none';
        }
        
        if (this.gameOver) {
            document.getElementById('gameStatus').textContent = 'Game Over! Refresh to play again.';
        } else if (!this.gameRunning && this.gameStarted && !this.gameOver) {
            document.getElementById('gameStatus').textContent = 'Level Complete! Refresh to play again.';
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMaze();
        
        // Draw rose
        if (this.rose) {
            const x = this.rose.x * this.TILE_SIZE + this.TILE_SIZE / 2;
            const y = this.rose.y * this.TILE_SIZE + this.TILE_SIZE / 2;
            this.ctx.fillStyle = '#FF1493';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🌹', x, y);
        }
        
        // Draw hearts
        for (let heart of this.hearts) {
            const x = heart.x * this.TILE_SIZE + this.TILE_SIZE / 2;
            const y = heart.y * this.TILE_SIZE + this.TILE_SIZE / 2;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('❤️', x, y);
        }
        
        this.drawGhosts();
        this.drawPacman();
        
        // Draw "Game Over" overlay if game is over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 32px Calibri';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '16px Calibri';
            this.ctx.fillText('Refresh page to play again', this.canvas.width / 2, this.canvas.height / 2 + 20);
        } else if (!this.gameRunning && this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 28px Calibri';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '16px Calibri';
            this.ctx.fillText('Refresh page to play again', this.canvas.width / 2, this.canvas.height / 2 + 20);
        } else if (!this.gameRunning && !this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 20px Calibri';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Press any key to start', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
    }
    
    start() {
        this.updateUI();
        document.getElementById('gameStatus').textContent = 'Press any key to start';
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
    console.log('Starting game with difficulty:', difficulty);
    if (currentGame) currentGame.stop();
    try {
        currentGame = new PacManGame('gameCanvas', difficulty);
        console.log('Game created');
        currentGame.start();
        console.log('Game started');
        window.game = currentGame;
    } catch (e) {
        console.error('Error starting game:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Don't auto-start - wait for user to select difficulty
});
