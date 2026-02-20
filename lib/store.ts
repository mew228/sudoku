import { create } from 'zustand';
import { generateSudoku, BLANK, GRID_SIZE, Difficulty } from './logic/sudoku';
import { getSmartHint, HintResult } from './logic/hints';
import { updateProgress, updateBoardCell } from './firebase/rooms';

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
    highlightedNumber: null, // Added this based on the provided snippet

    mode: 'single',
    roomId: null,
    playerId: null,
    opponentProgress: 0,
    opponentName: null,
    opponentStatus: null,

    setRemoteBoard: (board) => set({ board }),

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

        if (initialBoard[r][c] !== BLANK) return;

        // Notes Mode
        if (isNotesMode) {
            const noteKey = r + "," + c + "," + num;
            const newNotes = new Set(notes);
            if (newNotes.has(noteKey)) {
                newNotes.delete(noteKey);
            } else {
                newNotes.add(noteKey);
            }
            set({ notes: newNotes });
            return;
        }

        // Check if value actually changed
        if (board[r][c] === num) return;

        // CO-OP LOGIC:
        const isCorrect = num === solvedBoard[r][c];

        // ALWAYS update the board first (Visual Feedback)
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = num;
        const newHistory = [...history, board.map(row => [...row])];

        if (isCorrect) {
            // --- CORRECT MOVE ---
            set({ board: newBoard, history: newHistory });

            // Check Win (Full AND Correct)
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
            }

            // Sync to Firebase (Board + Progress)
            if (mode === 'pvp' && roomId) {
                updateBoardCell(roomId, r, c, num).catch(e => console.error("Board Sync Failed:", e));

                const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);
                updateProgress(roomId, playerId || "Guest", progress, mistakes, isWon ? 'won' : 'playing')
                    .catch(e => console.error("Progress Sync Failed:", e));
            }

        } else {
            // --- WRONG MOVE ---
            const newMistakes = mistakes + 1;

            // Update board ANYWAY to show the red number, and increment mistakes
            set({
                mistakes: newMistakes,
                board: newBoard,
                history: newHistory
            });

            if (newMistakes >= maxMistakes) {
                set({ status: 'lost' });
            }

            // Sync to Firebase (Mistakes + Board update)
            if (mode === 'pvp' && roomId) {
                // Sync the wrong move so partner sees it
                updateBoardCell(roomId, r, c, num).catch(e => console.error("Board Sync Failed:", e));

                // Calculate existing progress
                let filled = 0;
                for (let i = 0; i < GRID_SIZE; i++) {
                    for (let j = 0; j < GRID_SIZE; j++) {
                        if (newBoard[i][j] !== 0) filled++;
                    }
                }
                const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);

                updateProgress(roomId, playerId || "Guest", progress, newMistakes, newMistakes >= maxMistakes ? 'lost' : 'playing')
                    .catch(e => console.error("Mistake Sync Failed:", e));
            }
        }

        // Removed Leaderboard logic as per user request
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
    },

    setHoveredCell: (cell) => set({ hoveredCell: cell }),
    setHighlightedNumber: (num) => set({ highlightedNumber: num })
}));
