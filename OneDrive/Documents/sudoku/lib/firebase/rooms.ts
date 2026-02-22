import { db } from "./firebase";
import { ref, set, onValue, update, get } from "firebase/database";
import { generateSudoku, Difficulty } from "../logic/sudoku";

export interface Room {
    id: string;
    status: 'waiting' | 'playing' | 'finished';
    difficulty: Difficulty;
    initialBoard: number[][];
    solvedBoard: number[][];
    players: {
        [uid: string]: {
            name: string;
            progress: number; // cells filled correctly
            mistakes: number;
            status: 'playing' | 'won' | 'lost';
        }
    };
    winner: string | null;
    createdAt: number;
}

/**
 * Generate a short 6-character alphanumeric room code.
 * Uses uppercase letters + digits (excludes confusable chars like O/0, I/1/L).
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
 * Create a new PvP room with a short code.
 * Tries up to 5 times to avoid code collisions.
 */
export const createRoom = async (playerName: string, difficulty: Difficulty): Promise<string> => {
    let code = '';
    let attempts = 0;

    while (attempts < 5) {
        code = generateShortCode();
        const snapshot = await get(ref(db, `rooms/${code}`));
        if (!snapshot.exists()) break;
        attempts++;
    }

    const { initial, solved } = generateSudoku(difficulty);

    await set(ref(db, `rooms/${code}`), {
        id: code,
        status: 'waiting',
        difficulty,
        initialBoard: initial,
        solvedBoard: solved,
        players: {
            [playerName]: {
                name: playerName,
                progress: 0,
                mistakes: 0,
                status: 'playing'
            }
        },
        winner: null,
        createdAt: Date.now()
    });

    return code;
};

/**
 * Join an existing room by code.
 * Validates room exists and is still waiting. Auto-starts game when 2nd player joins.
 */
export const joinRoom = async (roomId: string, playerName: string) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found. Check the code and try again.");
    }

    const room = snapshot.val();
    if (room.status !== 'waiting') {
        throw new Error("This game has already started.");
    }

    const existingPlayers = Object.keys(room.players || {});
    if (existingPlayers.includes(playerName)) {
        throw new Error("That name is already taken in this room.");
    }

    // Add player
    await update(ref(db, `rooms/${roomId}/players/${playerName}`), {
        name: playerName,
        progress: 0,
        mistakes: 0,
        status: 'playing'
    });

    // Auto-start when 2nd player joins
    if (existingPlayers.length >= 1) {
        await update(ref(db, `rooms/${roomId}`), {
            status: 'playing'
        });
    }
};

/**
 * Subscribe to real-time room updates.
 * Returns an unsubscribe function.
 */
export const subscribeToRoom = (roomId: string, callback: (room: Room) => void) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
};

/**
 * Update player progress in a room.
 */
export const updateProgress = async (
    roomId: string,
    playerName: string,
    progress: number,
    mistakes: number,
    status: 'playing' | 'won' | 'lost'
) => {
    await update(ref(db, `rooms/${roomId}/players/${playerName}`), {
        progress,
        mistakes,
        status
    });

    if (status === 'won') {
        const roomRef = ref(db, `rooms/${roomId}`);
        const snap = await get(roomRef);
        if (snap.val() && !snap.val().winner) {
            await update(roomRef, { winner: playerName, status: 'finished' });
        }
    }
};
