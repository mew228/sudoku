import { create } from 'zustand';
import { generateSudoku, BLANK, GRID_SIZE, Difficulty } from './logic/sudoku';
import { getSmartHint, HintResult } from './logic/hints';
import { updateProgress, updateBoardCell } from './firebase/rooms';
import { updateUserStats, UserStats } from './firebase/users';

interface GameState {
    board: number[][];
    initialBoard: number[][];
    solvedBoard: number[][];
    notes: Set<string>; // stored as "row,col,num"
    difficulty: Difficulty;
    status: 'idle' | 'waiting' | 'playing' | 'won' | 'lost';
    timer: number;
    mistakes: number;
    maxMistakes: number;
    history: number[][][]; // for undo
    isNotesMode: boolean;
    selectedCell: { r: number, c: number } | null;
    hintsRemaining: number;
    lastHint: HintResult | null;
    hoveredCell: { r: number, c: number } | null;
    highlightedNumber: number | null;

    // Multiplayer
    mode: 'single' | 'pvp' | 'bot';
    roomId: string | null;
    playerId: string | null;
    uid: string | null;
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

    // Hover state for drag and drop
    setHoveredCell: (cell: { r: number, c: number } | null) => void;
    setHighlightedNumber: (num: number | null) => void;
    setRemoteBoard: (board: number[][]) => void;
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
    hoveredCell: null,
    highlightedNumber: null,

    mode: 'single',
    roomId: null,
    playerId: null,
    uid: null,
    opponentProgress: 0,
    opponentName: null,
    opponentStatus: null,

    setRemoteBoard: (board: number[][]) => set({ board }),

    startGame: (difficulty: Difficulty, mode: 'single' | 'pvp' | 'bot' = 'single') => {
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

        // Handle Bot Mode
        if (mode === 'bot') {
            const botInterval = setInterval(() => {
                const { status, board, solvedBoard, mistakes, roomId, difficulty } = useGameStore.getState();
                if (status !== 'playing') {
                    clearInterval(botInterval);
                    return;
                }

                // Bot logic: find a random empty cell and fill it
                const emptyCells = [];
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (board[r][c] === 0) emptyCells.push({ r, c });
                    }
                }

                if (emptyCells.length > 0) {
                    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                    const correctVal = solvedBoard[r][c];

                    // Simple bot: always gets it right for now, but takes time
                    // We simulate progress for the "opponent" (the bot)
                    const totalCells = 81;
                    const filledCells = totalCells - emptyCells.length + 1;
                    const progress = Math.floor((filledCells / totalCells) * 100);

                    set({
                        opponentProgress: progress,
                        opponentName: 'AI Bot'
                    });

                    if (progress >= 100) {
                        set({ status: 'lost', opponentStatus: 'won' });
                    }
                }
            }, 5000 + (Math.random() * 5000)); // Bot solves a cell every 5-10 seconds
        }
    },

    setMultiplayerState: (state: Partial<GameState>) => set(state),

    selectCell: (r: number, c: number) => set({ selectedCell: { r, c } }),

    toggleNotesMode: () => set(state => ({ isNotesMode: !state.isNotesMode })),

    setCellValue: (num: number) => {
        const { board, selectedCell, initialBoard, solvedBoard, isNotesMode, notes, mistakes, maxMistakes, history, status, mode, roomId } = get();

        if (!selectedCell || status === 'won' || status === 'lost') return;
        const { r, c } = selectedCell;

        if (initialBoard[r][c] !== BLANK) return;

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

        if (board[r][c] === num) return;

        const isCorrect = num === solvedBoard[r][c];
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = num;
        const newHistory = [...history, board.map(row => [...row])];

        if (isCorrect) {
            set({ board: newBoard, history: newHistory });

            let filled = 0;
            let allCorrect = true;
            for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                    if (newBoard[i][j] !== 0) filled++;
                    if (newBoard[i][j] !== 0 && newBoard[i][j] !== solvedBoard[i][j]) allCorrect = false;
                }
            }
            const isWon = (filled === GRID_SIZE * GRID_SIZE) && allCorrect;

            if (isWon) {
                set({ status: 'won' });
                // Persistent Stats
                const { uid, timer, difficulty } = get();
                if (uid) {
                    const diffKey = difficulty.toLowerCase() as keyof UserStats['bestTime'];
                    updateUserStats(uid, true, timer, diffKey, mistakes).catch(e => console.error("Stats Sync Failed:", e));
                }
            }

            if (mode === 'pvp' && roomId) {
                updateBoardCell(roomId, r, c, num).catch(e => console.error("Board Sync Failed:", e));

                const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);
                updateProgress(roomId, progress, mistakes, isWon ? 'won' : 'playing')
                    .catch(e => console.error("Progress Sync Failed:", e));
            }

        } else {
            const newMistakes = mistakes + 1;
            set({
                mistakes: newMistakes,
                board: newBoard,
                history: newHistory
            });

            const isLost = newMistakes >= maxMistakes;
            if (isLost) {
                set({ status: 'lost' });
                // Persistent Stats
                const { uid, timer, difficulty } = get();
                if (uid) {
                    const diffKey = difficulty.toLowerCase() as keyof UserStats['bestTime'];
                    updateUserStats(uid, false, timer, diffKey, newMistakes).catch(e => console.error("Stats Sync Failed:", e));
                }
            }

            if (mode === 'pvp' && roomId) {
                updateBoardCell(roomId, r, c, num).catch(e => console.error("Board Sync Failed:", e));

                let filled = 0;
                for (let i = 0; i < GRID_SIZE; i++) {
                    for (let j = 0; j < GRID_SIZE; j++) {
                        if (newBoard[i][j] !== 0) filled++;
                    }
                }
                const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);

                updateProgress(roomId, progress, newMistakes, isLost ? 'lost' : 'playing')
                    .catch(e => console.error("Mistake Sync Failed:", e));
            }
        }
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

        setTimeout(() => {
            if (get().lastHint === hint) {
                set({ lastHint: null });
            }
        }, 3000);
    },

    setHoveredCell: (cell: { r: number, c: number } | null) => set({ hoveredCell: cell }),
    setHighlightedNumber: (num: number | null) => set({ highlightedNumber: num })
}));
