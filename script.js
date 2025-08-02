/**
 * Main script for Rubik's Cube Solver with AI Next Move
 */

class RubiksCubeApp {
    constructor() {
        this.solver = new KociembaSolver();
        this.currentColor = 'white';
        this.cube = {};
        this.solutionMoves = [];
        this.currentMoveIndex = 0;
        this.autoPlayInterval = null;
        this.isAutoPlaying = false;
        
        this.initializeCube();
        this.setupEventListeners();
        this.initializeUI();
    }

    initializeCube() {
        // Initialize with solved cube
        const faces = ['U', 'F', 'R', 'B', 'L', 'D'];
        const colors = ['white', 'red', 'blue', 'orange', 'green', 'yellow'];
        
        faces.forEach((face, faceIndex) => {
            for (let i = 1; i <= 9; i++) {
                this.cube[face + i] = colors[faceIndex];
            }
        });
        
        this.updateCubeDisplay();
    }

    setupEventListeners() {
        // Color palette selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });

        // Cube square clicking
        document.querySelectorAll('.square:not(.center)').forEach(square => {
            square.addEventListener('click', (e) => {
                this.paintSquare(e.target.dataset.pos);
            });
        });

        // Control buttons
        document.getElementById('solve-btn').addEventListener('click', () => {
            this.solveCube();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetCube();
        });

        document.getElementById('scramble-btn').addEventListener('click', () => {
            this.scrambleCube();
        });

        document.getElementById('set-solved-btn').addEventListener('click', () => {
            this.setSolvedState();
        });

        // Solution navigation
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousMove();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextMove();
        });

        document.getElementById('auto-play-btn').addEventListener('click', () => {
            this.toggleAutoPlay();
        });
    }

    initializeUI() {
        this.selectColor('white');
        this.updateStatus('Configure your cube colors and click "Start Solving" to get the next move.');
    }

    selectColor(color) {
        this.currentColor = color;
        
        // Update UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.querySelector(`.color-option.${color}`).classList.add('selected');
        document.querySelector('.current-color').className = `current-color ${color}`;
        document.getElementById('color-name').textContent = color.charAt(0).toUpperCase() + color.slice(1);
    }

    paintSquare(position) {
        // Don't allow painting center squares
        if (position.endsWith('5')) return;
        
        this.cube[position] = this.currentColor;
        this.updateSquareDisplay(position);
        this.hideError();
    }

    updateSquareDisplay(position) {
        const square = document.querySelector(`[data-pos="${position}"]`);
        if (square) {
            square.className = `square ${this.cube[position]}`;
        }
    }

    updateCubeDisplay() {
        Object.keys(this.cube).forEach(position => {
            this.updateSquareDisplay(position);
        });
    }

    solveCube() {
        this.showLoading('Analyzing cube configuration...');
        
        // Small delay to show loading animation
        setTimeout(() => {
            const result = this.solver.solve(this.cube);
            
            this.hideLoading();
            
            if (result.success) {
                this.solutionMoves = result.moves;
                this.currentMoveIndex = 0;
                this.showSolution();
                this.updateStatus(result.message);
                
                if (result.moves.length === 0) {
                    this.updateStatus('Cube is already solved! 🎉');
                } else {
                    this.displayCurrentMove();
                }
            } else {
                this.showError(result.message);
                this.updateStatus('Failed to solve cube. Please check your configuration.');
            }
        }, 500);
    }

    showSolution() {
        const solutionSection = document.getElementById('solution-section');
        solutionSection.style.display = 'block';
        solutionSection.classList.add('fade-in');
        
        document.getElementById('total-moves').textContent = this.solutionMoves.length;
        
        this.updateNavigationButtons();
        this.updateProgressBar();
    }

    hideSolution() {
        document.getElementById('solution-section').style.display = 'none';
        this.stopAutoPlay();
    }

    displayCurrentMove() {
        if (this.solutionMoves.length === 0) return;
        
        const move = this.solutionMoves[this.currentMoveIndex];
        const moveNotation = document.getElementById('move-notation');
        const moveDescription = document.getElementById('move-description');
        const currentMoveSpan = document.getElementById('current-move');
        
        moveNotation.textContent = move;
        moveDescription.textContent = this.solver.getMoveDescription(move);
        currentMoveSpan.textContent = this.currentMoveIndex + 1;
        
        // Add animation
        moveNotation.classList.add('fade-in');
        setTimeout(() => moveNotation.classList.remove('fade-in'), 500);
        
        this.updateNavigationButtons();
        this.updateProgressBar();
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        prevBtn.disabled = this.currentMoveIndex === 0;
        nextBtn.disabled = this.currentMoveIndex >= this.solutionMoves.length - 1;
        
        if (this.currentMoveIndex >= this.solutionMoves.length - 1) {
            this.updateStatus('🎉 Congratulations! You have completed all moves to solve the cube!');
            this.stopAutoPlay();
        }
    }

    updateProgressBar() {
        const progressFill = document.getElementById('progress-fill');
        const progress = this.solutionMoves.length > 0 
            ? ((this.currentMoveIndex + 1) / this.solutionMoves.length) * 100 
            : 0;
        progressFill.style.width = `${progress}%`;
    }

    nextMove() {
        if (this.currentMoveIndex < this.solutionMoves.length - 1) {
            this.currentMoveIndex++;
            this.displayCurrentMove();
        }
    }

    previousMove() {
        if (this.currentMoveIndex > 0) {
            this.currentMoveIndex--;
            this.displayCurrentMove();
        }
    }

    toggleAutoPlay() {
        if (this.isAutoPlaying) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        this.isAutoPlaying = true;
        const autoPlayBtn = document.getElementById('auto-play-btn');
        autoPlayBtn.textContent = '⏸️ Pause';
        autoPlayBtn.classList.remove('success');
        autoPlayBtn.classList.add('danger');
        
        this.autoPlayInterval = setInterval(() => {
            if (this.currentMoveIndex < this.solutionMoves.length - 1) {
                this.nextMove();
            } else {
                this.stopAutoPlay();
            }
        }, 2000); // Show each move for 2 seconds
    }

    stopAutoPlay() {
        this.isAutoPlaying = false;
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        
        const autoPlayBtn = document.getElementById('auto-play-btn');
        autoPlayBtn.textContent = '⏯️ Auto Play';
        autoPlayBtn.classList.remove('danger');
        autoPlayBtn.classList.add('success');
    }

    resetCube() {
        this.initializeCube();
        this.hideSolution();
        this.updateStatus('Cube reset to solved state. Configure colors and solve again.');
        this.hideError();
    }

    scrambleCube() {
        this.showLoading('Scrambling cube...');
        
        setTimeout(() => {
            this.cube = this.solver.scrambleCube();
            this.updateCubeDisplay();
            this.hideSolution();
            this.hideLoading();
            this.updateStatus('Cube scrambled! Configure any additional changes and click "Start Solving".');
            this.hideError();
        }, 1000);
    }

    setSolvedState() {
        // Set to standard solved colors
        const solvedColors = {
            'U': 'white', 'F': 'red', 'R': 'blue',
            'B': 'orange', 'L': 'green', 'D': 'yellow'
        };
        
        Object.keys(solvedColors).forEach(face => {
            for (let i = 1; i <= 9; i++) {
                this.cube[face + i] = solvedColors[face];
            }
        });
        
        this.updateCubeDisplay();
        this.hideSolution();
        this.updateStatus('Cube set to solved state. You can now scramble or modify colors.');
        this.hideError();
    }

    // Utility methods for UI feedback
    showLoading(message) {
        const solveBtn = document.getElementById('solve-btn');
        solveBtn.textContent = '⏳ ' + message;
        solveBtn.disabled = true;
        solveBtn.classList.add('loading');
    }

    hideLoading() {
        const solveBtn = document.getElementById('solve-btn');
        solveBtn.textContent = '🚀 Start Solving';
        solveBtn.disabled = false;
        solveBtn.classList.remove('loading');
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.style.display = 'block';
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Add shake animation
        errorElement.classList.add('shake');
        setTimeout(() => errorElement.classList.remove('shake'), 500);
    }

    hideError() {
        const errorElement = document.getElementById('error-message');
        errorElement.style.display = 'none';
    }

    // Advanced cube validation
    validateCubeConfiguration() {
        const colorCounts = {};
        const requiredColors = ['white', 'red', 'blue', 'orange', 'green', 'yellow'];
        
        // Initialize color counts
        requiredColors.forEach(color => colorCounts[color] = 0);
        
        // Count colors in current cube configuration
        Object.values(this.cube).forEach(color => {
            if (colorCounts[color] !== undefined) {
                colorCounts[color]++;
            }
        });
        
        // Check if each color appears exactly 9 times
        const errors = [];
        requiredColors.forEach(color => {
            if (colorCounts[color] !== 9) {
                errors.push(`${color}: ${colorCounts[color]} squares (expected 9)`);
            }
        });
        
        if (errors.length > 0) {
            return {
                valid: false,
                message: 'Invalid cube configuration:\n' + errors.join('\n')
            };
        }
        
        return { valid: true };
    }

    // Export cube configuration (for debugging)
    exportCubeState() {
        const cubeString = JSON.stringify(this.cube, null, 2);
        console.log('Current cube state:', cubeString);
        return cubeString;
    }

    // Import cube configuration
    importCubeState(cubeData) {
        try {
            if (typeof cubeData === 'string') {
                cubeData = JSON.parse(cubeData);
            }
            
            this.cube = { ...cubeData };
            this.updateCubeDisplay();
            this.updateStatus('Cube configuration imported successfully.');
            return true;
        } catch (error) {
            this.showError('Failed to import cube configuration: ' + error.message);
            return false;
        }
    }

    // Get cube statistics
    getCubeStats() {
        const validation = this.validateCubeConfiguration();
        const isSolved = this.solver.isSolved(this.solver.cubeToState(this.cube));
        
        return {
            isValid: validation.valid,
            isSolved: isSolved,
            colorDistribution: this.getColorDistribution(),
            validationMessage: validation.message || 'Cube configuration is valid'
        };
    }

    getColorDistribution() {
        const distribution = {};
        Object.values(this.cube).forEach(color => {
            distribution[color] = (distribution[color] || 0) + 1;
        });
        return distribution;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cubeApp = new RubiksCubeApp();
    
    // Add some developer utilities to window for debugging
    window.debugCube = {
        exportState: () => window.cubeApp.exportCubeState(),
        importState: (data) => window.cubeApp.importCubeState(data),
        getStats: () => window.cubeApp.getCubeStats(),
        validateCube: () => window.cubeApp.validateCubeConfiguration()
    };
    
    console.log('🧩 Rubik\'s Cube Solver initialized!');
    console.log('Debug utilities available at window.debugCube');
});