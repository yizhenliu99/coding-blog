// Pac-Man Game - Problem 2.1: Classic Mechanics
class PacManGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game constants
        this.TILE_SIZE = 20;
        this.COLS = this.canvas.width / this.TILE_SIZE;
        this.ROWS = this.canvas.height / this.TILE_SIZE;
        
        // Game state
        this.gameRunning = true;
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
            dir: 0, // 0=right, 1=down, 2=left, 3=up
            nextDir: 0,
            speed: 1
        };
        
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
        
        // Wrap around edges
        nextX = (nextX + this.COLS) % this.COLS;
        nextY = (nextY + this.ROWS) % this.ROWS;
        
        return !this.isWall(nextX, nextY);
    }
    
    movePacman() {
        // Try next direction first
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDir)) {
            this.pacman.dir = this.pacman.nextDir;
        }
        
        // Move in current direction if possible
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.dir)) {
            if (this.pacman.dir === 0) this.pacman.x++;
            else if (this.pacman.dir === 1) this.pacman.y++;
            else if (this.pacman.dir === 2) this.pacman.x--;
            else if (this.pacman.dir === 3) this.pacman.y--;
            
            // Wrap around edges
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
    
    update() {
        if (!this.gameRunning) return;
        
        this.handleInput();
        this.movePacman();
        this.eatPellet();
    }
    
    drawMaze() {
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const cell = this.maze[y][x];
                
                if (cell === 1) {
                    // Wall
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(x * this.TILE_SIZE, y * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
                } else if (cell === 2) {
                    // Pellet - BLACK
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
        
        // Yellow circle head
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Eye
        this.ctx.fillStyle = '#000000';
        const eyeX = x + radius * 0.5;
        const eyeY = y - radius * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mouth (based on direction)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        
        if (this.pacman.dir === 0) { // Right
            this.ctx.arc(x + radius * 0.2, y + radius * 0.2, 2, -Math.PI / 4, Math.PI / 4);
        } else if (this.pacman.dir === 1) { // Down
            this.ctx.arc(x + radius * 0.2, y + radius * 0.2, 2, -Math.PI / 4, Math.PI / 4);
        } else if (this.pacman.dir === 2) { // Left
            this.ctx.arc(x - radius * 0.2, y + radius * 0.2, 2, Math.PI - Math.PI / 4, Math.PI + Math.PI / 4);
        } else if (this.pacman.dir === 3) { // Up
            this.ctx.arc(x + radius * 0.2, y - radius * 0.2, 2, -Math.PI / 4, Math.PI / 4);
        }
        
        this.ctx.stroke();
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('livesValue').textContent = this.lives;
        document.getElementById('pelletsValue').textContent = this.pelletsRemaining;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game
        this.drawMaze();
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

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new PacManGame('gameCanvas');
    game.start();
    
    // Store game instance globally for debugging
    window.game = game;
});
