import { create } from 'zustand';
import { generateSudoku, solveSudoku, isValid, BLANK, GRID_SIZE, Difficulty } from './logic/sudoku';
import { getSmartHint, HintResult } from './logic/hints';

interface GameState {
    board: number[][];
    initialBoard: number[][];
    solvedBoard: number[][];
    notes: Set<string>; // stored as "row,col,num"
    difficulty: Difficulty;
    status: 'idle' | 'playing' | 'won' | 'lost';
    timer: number;
    mistakes: number;
    maxMistakes: number;
    history: number[][][]; // for undo
    isNotesMode: boolean;
    selectedCell: { r: number, c: number } | null;
    hintsRemaining: number;
    lastHint: HintResult | null;

    // Multiplayer
    mode: 'single' | 'pvp' | 'bot';
    roomId: string | null;
    playerId: string | null;
    opponentProgress: number; // 0-100
    opponentName: string | null;
    opponentStatus: 'playing' | 'won' | 'lost' | 'waiting' | null;

    // Actions
    startGame: (difficulty: Difficulty, mode?: 'single' | 'pvp' | 'bot') => void;
    selectCell: (r: number, c: number) => void;
    setCellValue: (num: number) => void;
    toggleNotesMode: () => void;
    undo: () => void;
    resetGame: () => void;
    tickTimer: () => void;

    // PvP Actions
    setMultiplayerState: (state: Partial<GameState>) => void;

    // Hint
    getHint: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    board: [],
    initialBoard: [],
    solvedBoard: [],
    notes: new Set(),
    difficulty: 'Medium',
    status: 'idle',
    timer: 0,
    mistakes: 0,
    maxMistakes: 3,
    history: [],
    isNotesMode: false,
    selectedCell: null,
    hintsRemaining: 3,
    lastHint: null,

    mode: 'single',
    roomId: null,
    playerId: null,
    opponentProgress: 0,
    opponentName: null,
    opponentStatus: null,

    startGame: (difficulty, mode = 'single') => {
        const { initial, solved } = generateSudoku(difficulty);
        set({
            board: initial.map(row => [...row]),
            initialBoard: initial.map(row => [...row]),
            solvedBoard: solved,
            difficulty,
            status: 'playing',
            timer: 0,
            mistakes: 0,
            history: [],
            notes: new Set(),
            selectedCell: null,
            hintsRemaining: 3,
            lastHint: null,
            mode
        });
    },

    setMultiplayerState: (state) => set(state),

    selectCell: (r, c) => set({ selectedCell: { r, c } }),

    toggleNotesMode: () => { }, // Disabled for now as per user request (empty function)

    setCellValue: (num) => {
        const { board, selectedCell, initialBoard, solvedBoard, isNotesMode, notes, mistakes, maxMistakes, history, status, mode, roomId, playerId } = get();

        if (!selectedCell || status === 'won' || status === 'lost') return;
        const { r, c } = selectedCell;

        // Cannot edit initial cells
        if (initialBoard[r][c] !== BLANK) return;

        // Notes logic (Disabled effectively since isNotesMode can't be toggled true, but keeping code structure or removing it?)
        // If isNotesMode is somehow true, we keep the logic, but since we disabled the toggle, this block is unreachable unless default is true.
        if (isNotesMode) {
            const noteKey = `${r},${c},${num}`;
            const newNotes = new Set(notes);
            if (newNotes.has(noteKey)) {
                newNotes.delete(noteKey);
            } else {
                newNotes.add(noteKey);
            }
            set({ notes: newNotes });
            return;
        }

        // Normal move
        if (board[r][c] === num) return; // No change

        // Save history
        const newHistory = [...history, board.map(row => [...row])];

        // Check correctness (instant feedback style)
        const isCorrect = solvedBoard[r][c] === num;

        // Calculate mistakes
        const currentMistakes = isCorrect ? mistakes : mistakes + 1;

        if (!isCorrect) {
            set({ mistakes: currentMistakes });
            if (currentMistakes >= maxMistakes) {
                set({ status: 'lost' });
            }
            // Depending on design, we might NOT fill the cell if wrong, or highlight red.
            // Standard app behavior: fill it, show red, count mistake.
        }

        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = num;

        // Check win condition
        let isWon = true;
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (newBoard[i][j] !== solvedBoard[i][j]) {
                    isWon = false;
                    break;
                }
            }
        }

        if (mode === 'pvp' && roomId && playerId) {
            // ... pvp logic ...
            // Calculate progress (cells filled / total cells)
            let filled = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (newBoard[r][c] !== 0) filled++;
                }
            }
            const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);

            import('./firebase/rooms').then(({ updateProgress }) => {
                updateProgress(roomId, playerId, progress, currentMistakes, isWon ? 'won' : (currentMistakes >= maxMistakes ? 'lost' : 'playing'));
            });
        }

        set({
            board: newBoard,
            history: newHistory,
            status: isWon ? 'won' : get().status
        });
    },

    undo: () => {
        const { history } = get();
        if (history.length === 0) return;
        const previousBoard = history[history.length - 1];
        set({
            board: previousBoard,
            history: history.slice(0, -1)
        });
    },

    resetGame: () => {
        // restart with same board? or new? usually "Restart" means same board cleared.
        const { initialBoard } = get();
        set({
            board: initialBoard.map(row => [...row]),
            timer: 0,
            mistakes: 0,
            notes: new Set(),
            history: [],
            hintsRemaining: 3,
            lastHint: null,
            status: 'playing'
        });
    },

    tickTimer: () => {
        if (get().status === 'playing') {
            set(state => ({ timer: state.timer + 1 }));
        }
    },

    getHint: () => {
        const { board, solvedBoard, status, hintsRemaining } = get();
        if (status !== 'playing' || hintsRemaining <= 0) return;

        const hint = getSmartHint(board, solvedBoard);
        if (!hint) return;

        const newBoard = board.map(row => [...row]);
        newBoard[hint.r][hint.c] = hint.value;

        // Check win condition after hint
        let isWon = true;
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (newBoard[i][j] !== solvedBoard[i][j]) {
                    isWon = false;
                    break;
                }
            }
            if (!isWon) break;
        }

        set({
            board: newBoard,
            selectedCell: { r: hint.r, c: hint.c },
            hintsRemaining: hintsRemaining - 1,
            lastHint: hint,
            status: isWon ? 'won' : status,
        });

        // Auto-clear the toast after 3 seconds
        setTimeout(() => {
            if (get().lastHint === hint) {
                set({ lastHint: null });
            }
        }, 3000);
    }
}));
