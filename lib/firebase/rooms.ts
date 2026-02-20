import { db, auth } from "./firebase";
import { ref, set, onValue, update, get, onDisconnect, remove } from "firebase/database";
import { generateSudoku, Difficulty } from "../logic/sudoku";

const getDb = () => {
    if (!db) throw new Error("Firebase database is not initialized");
    return db;
};

const getAuth = () => {
    if (!auth) throw new Error("Firebase auth is not initialized");
    return auth;
};

export interface Room {
    id: string;
    status: 'waiting' | 'playing' | 'finished';
    difficulty: Difficulty;
    initialBoard: number[][];
    solvedBoard: number[][];
    board: number[][];
    players: {
        [uid: string]: {
            name: string;
            progress: number;
            mistakes: number;
            status: 'playing' | 'won' | 'lost' | 'offline';
        }
    };
    winner: string | null;
    createdAt: number;
}

/**
 * Generate a short 6-character alphanumeric room code.
 */
function generateShortCode(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

/**
 * Setup presence handling for a player in a room.
 */
const setupPresence = (roomId: string, uid: string) => {
    const playerStatusRef = ref(getDb(), `rooms/${roomId}/players/${uid}/status`);
    // On disconnect, mark as offline
    onDisconnect(playerStatusRef).set('offline');
};

/**
 * Create a new PvP room.
 */
export const createRoom = async (playerName: string, difficulty: Difficulty): Promise<string> => {
    let code = '';
    let attempts = 0;
    const user = getAuth().currentUser;
    if (!user) throw new Error("User must be signed in to create a room");

    while (attempts < 5) {
        code = generateShortCode();
        const dbRef = ref(getDb(), `rooms/${code}`);
        const snapshot = await get(dbRef);
        if (!snapshot.exists()) break;
        attempts++;
    }

    // Trigger cleanup occasionally when creating new rooms
    cleanupOldRooms().catch(e => console.error("Cleanup error:", e));

    const { initial, solved } = generateSudoku(difficulty);
    const currentBoard = initial.map(row => [...row]);

    await set(ref(getDb(), `rooms/${code}`), {
        id: code,
        status: 'waiting',
        difficulty,
        initialBoard: initial,
        solvedBoard: solved,
        board: currentBoard, // Shared board at root
        players: {
            [user.uid]: {
                name: playerName || user.displayName || 'Player 1',
                progress: 0,
                mistakes: 0,
                status: 'playing',
            }
        },
        winner: null,
        createdAt: Date.now()
    });

    setupPresence(code, user.uid);
    return code;
};

/**
 * Join an existing room.
 */
export const joinRoom = async (roomId: string, playerName: string) => {
    const user = getAuth().currentUser;
    if (!user) throw new Error("User must be signed in to join a room");

    const roomRef = ref(getDb(), `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found.");
    }

    const room = snapshot.val();
    if (room.status !== 'waiting' && !room.players[user.uid]) {
        throw new Error("This game has already started.");
    }

    // Add or rejoin player
    await update(ref(getDb(), `rooms/${roomId}/players/${user.uid}`), {
        name: playerName || user.displayName || 'Player 2',
        progress: room.players[user.uid]?.progress || 0,
        mistakes: room.players[user.uid]?.mistakes || 0,
        status: 'playing'
    });

    // Auto-start when 2nd player joins
    const existingPlayers = Object.keys(room.players || {});
    if (existingPlayers.length >= 1 && !room.players[user.uid]) {
        await update(roomRef, { status: 'playing' });
    }

    setupPresence(roomId, user.uid);
};

/**
 * Update player progress.
 */
export const updateProgress = async (
    roomId: string,
    progress: number,
    mistakes: number,
    status: 'playing' | 'won' | 'lost'
) => {
    const user = getAuth().currentUser;
    if (!user) return;

    await update(ref(getDb(), `rooms/${roomId}/players/${user.uid}`), {
        progress,
        mistakes,
        status
    });

    if (status === 'won') {
        const roomRef = ref(getDb(), `rooms/${roomId}`);
        const snap = await get(roomRef);
        const data = snap.val();
        if (data && !data.winner) {
            await update(roomRef, {
                winner: user.displayName || user.uid,
                status: 'finished'
            });
        }
    }
};

/**
 * Real-time subscriptions
 */
export const subscribeToRoom = (roomId: string, callback: (room: Room) => void) => {
    const roomRef = ref(getDb(), `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
};

export const subscribeToPlayers = (roomId: string, callback: (players: Room['players']) => void) => {
    const playersRef = ref(getDb(), `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
};

/**
 * Listen to the underlying Firebase connection status.
 */
export const listenToConnection = (callback: (connected: boolean) => void) => {
    const connectedRef = ref(getDb(), ".info/connected");
    return onValue(connectedRef, (snap) => {
        callback(snap.val() === true);
    });
};

export const updateBoardCell = async (roomId: string, r: number, c: number, value: number) => {
    const user = getAuth().currentUser;
    if (!user) return;
    // Write to SHARED board at room root
    await set(ref(getDb(), `rooms/${roomId}/board/${r}/${c}`), value);
};

export const subscribeToBoard = (roomId: string, callback: (board: number[][]) => void) => {
    const boardRef = ref(getDb(), `rooms/${roomId}/board`);
    return onValue(boardRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
};

/**
 * Cleanup rooms older than 24 hours.
 */
export const cleanupOldRooms = async () => {
    try {
        const roomsRef = ref(getDb(), 'rooms');
        const snapshot = await get(roomsRef);
        if (!snapshot.exists()) return;

        const now = Date.now();
        const cutoff = 24 * 60 * 60 * 1000; // 24 hours
        const updates: { [key: string]: null } = {};

        snapshot.forEach((child) => {
            const room = child.val();
            if (room.createdAt && (now - room.createdAt > cutoff)) {
                updates[child.key as string] = null;
            }
        });

        if (Object.keys(updates).length > 0) {
            await update(roomsRef, updates);
            console.log(`Cleaned up ${Object.keys(updates).length} old rooms.`);
        }
    } catch (e) {
        console.error("Cleanup failed:", e);
    }
};

