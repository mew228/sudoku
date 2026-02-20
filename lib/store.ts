import { create } from 'zustand';
import { generateSudoku, BLANK, GRID_SIZE, Difficulty } from './logic/sudoku';
import { getSmartHint, HintResult } from './logic/hints';
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
    opponentHoveredCells: { r: number, c: number }[];
    cellOwners: Record<string, string>;
    currentTurn: string | null;

    // Multiplayer
    mode: 'single' | 'pvp' | 'bot';
    roomId: string | null;
    playerId: string | null;
    uid: string | null;
    playerName: string | null;
    opponentProgress: number; // 0-100
    opponentName: string | null;
    opponentStatus: 'playing' | 'won' | 'lost' | 'waiting' | null;
    isFirebaseConnected: boolean;
    lastSyncError: string | null;

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
    syncAction: ((action: { type: 'CELL', r: number, c: number, val: number, progress: number, mistakes: number, status: 'playing' | 'won' | 'lost', switchTurn?: boolean }) => void) | null;
    setSyncAction: (fn: GameState['syncAction']) => void;

    // Hint
    getHint: () => void;

    // Hover state for drag and drop
    setHoveredCell: (cell: { r: number, c: number } | null) => void;
    setHighlightedNumber: (num: number | null) => void;
    setRemoteBoard: (board: number[][]) => void;
    setCellOwners: (owners: Record<string, string>) => void;
    setCurrentTurn: (uid: string | null) => void;

    // Bot Action
    playBotMove: () => void;
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
    opponentHoveredCells: [],
    cellOwners: {},
    currentTurn: null,

    mode: 'single',
    roomId: null,
    playerId: null,
    uid: null,
    playerName: null,
    opponentProgress: 0,
    opponentName: null,
    opponentStatus: null,
    isFirebaseConnected: true, // Default to true, listener will update
    lastSyncError: null,
    syncAction: null,

    setSyncAction: (fn) => set({ syncAction: fn }),
    setRemoteBoard: (board: number[][]) => set({ board }),
    setCellOwners: (owners: Record<string, string>) => set({ cellOwners: owners }),
    setCurrentTurn: (uid: string | null) => set({ currentTurn: uid }),

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
            cellOwners: {},
            mode,
            opponentName: mode === 'bot' ? 'AI Bot' : null,
            uid: mode === 'bot' ? 'local-player' : get().uid, // assign dummy uid for local bot match
            currentTurn: mode === 'bot' ? 'local-player' : null
        });
    },

    setMultiplayerState: (state: Partial<GameState>) => set(state),

    selectCell: (r: number, c: number) => set({ selectedCell: { r, c } }),

    toggleNotesMode: () => set(state => ({ isNotesMode: !state.isNotesMode })),

    setCellValue: (num: number) => {
        const { board, selectedCell, initialBoard, solvedBoard, isNotesMode, notes, mistakes, maxMistakes, history, status, mode, uid, currentTurn } = get();

        if (!selectedCell || status === 'won' || status === 'lost') return;

        // Enforce turn-based logic
        if ((mode === 'pvp' || mode === 'bot') && currentTurn && uid !== currentTurn) return;

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

            if (mode === 'pvp') {
                const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);
                const action = get().syncAction;
                if (action) {
                    action({ type: 'CELL', r, c, val: num, progress, mistakes, status: isWon ? 'won' : 'playing', switchTurn: true });
                }
            } else if (mode === 'bot') {
                set({ currentTurn: 'bot' });
                // Trigger Bot Move
                setTimeout(() => {
                    useGameStore.getState().playBotMove();
                }, 1000 + Math.random() * 2000); // 1-3s thinking time
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

            if (mode === 'pvp') {
                let filled = 0;
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        if (newBoard[i][j] !== 0) filled++;
                    }
                }
                const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);

                const action = get().syncAction;
                if (action) {
                    action({ type: 'CELL', r, c, val: num, progress, mistakes: newMistakes, status: isLost ? 'lost' : 'playing', switchTurn: true });
                }
            } else if (mode === 'bot') {
                set({ currentTurn: 'bot' });
                // Trigger Bot Move even on mistake
                setTimeout(() => {
                    useGameStore.getState().playBotMove();
                }, 1000 + Math.random() * 2000);
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
            cellOwners: {},
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

    playBotMove: () => {
        const { board, solvedBoard, status, cellOwners } = get();
        if (status !== 'playing') return;

        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) emptyCells.push({ r, c });
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const correctVal = solvedBoard[r][c];

            const newBoard = board.map(row => [...row]);
            newBoard[r][c] = correctVal;

            const newCellOwners = { ...cellOwners, [`${r},${c}`]: 'bot' };

            let filled = 0;
            let allCorrect = true;
            for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                    if (newBoard[i][j] !== 0) filled++;
                    if (newBoard[i][j] !== 0 && newBoard[i][j] !== solvedBoard[i][j]) allCorrect = false;
                }
            }

            const isWon = (filled === GRID_SIZE * GRID_SIZE) && allCorrect;
            const progress = Math.floor((filled / (GRID_SIZE * GRID_SIZE)) * 100);

            set({
                board: newBoard,
                cellOwners: newCellOwners,
                opponentProgress: progress,
                currentTurn: 'local-player' // Give turn back
            });

            if (isWon) {
                set({ status: 'lost', opponentStatus: 'won' }); // Human lost
            }
        }
    },

    setHoveredCell: (cell: { r: number, c: number } | null) => set({ hoveredCell: cell }),
    setHighlightedNumber: (num: number | null) => set({ highlightedNumber: num })
}));
