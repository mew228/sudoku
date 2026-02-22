// lib/logic/bot.ts
import { solveSudoku, GRID_SIZE, BLANK } from './sudoku';

export class SudokuBot {
    private solvedBoard: number[][];
    private currentBoard: number[][];
    private difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
    private intervalId: NodeJS.Timeout | null = null;
    private onMove: (row: number, col: number, num: number) => void;
    private onWin: () => void;

    constructor(
        initialBoard: number[][],
        difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert',
        onMove: (row: number, col: number, num: number) => void,
        onWin: () => void
    ) {
        this.difficulty = difficulty;
        this.currentBoard = initialBoard.map(row => [...row]);
        this.solvedBoard = initialBoard.map(row => [...row]);
        solveSudoku(this.solvedBoard, false); // deterministic solve to get the target
        this.onMove = onMove;
        this.onWin = onWin;
    }

    start() {
        const speed = this.getSpeed();
        this.intervalId = setInterval(() => {
            this.makeMove();
        }, speed);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private getSpeed() {
        // Time in ms between moves
        switch (this.difficulty) {
            case 'Easy': return 2500;  // Slow
            case 'Medium': return 1500;
            case 'Hard': return 800;
            case 'Expert': return 400; // Fast
            default: return 1000;
        }
    }

    private makeMove() {
        // Find empty cells
        const emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.currentBoard[r][c] === BLANK) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length === 0) {
            this.onWin();
            this.stop();
            return;
        }

        // Pick a random empty cell
        const idx = Math.floor(Math.random() * emptyCells.length);
        const { r, c } = emptyCells[idx];

        // 5% chance to make a mistake (if not Expert)
        const isMistake = this.difficulty !== 'Expert' && Math.random() < 0.05;
        let num = this.solvedBoard[r][c];

        if (isMistake) {
            num = (num % 9) + 1; // Just pick a wrong number
            // Correction mechanism would be needed for a real bot, but for now it just "plays"
            // Actually, let's make the bot always perfect for now to simpler "race" mechanics,
            // or allow it to self-correct later. For MVP: Perfect play.
            num = this.solvedBoard[r][c];
        }

        this.currentBoard[r][c] = num;
        this.onMove(r, c, num);
    }
}
