import { db } from "./firebase";

const getDb = () => {
    if (!db) throw new Error("Firebase database is not initialized");
    return db;
};
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

// Helper to sanitize keys for Firebase paths (no . # $ [ ])
// Helper to sanitize keys for Firebase paths (remove special chars)
const sanitizeKey = (key: string) => key.replace(/[^a-zA-Z0-9_ -]/g, '').trim();

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
        console.log("Checking Room ID:", code);
        try {
            const dbRef = ref(getDb(), `rooms/${code}`);
            const snapshot = await get(dbRef);
            if (!snapshot.exists()) break;
        } catch (e) {
            console.error("Error accessing Firebase:", e);
            throw e; // Rethrow to catch in Lobby.tsx
        }
        attempts++;
    }

    const { initial, solved } = generateSudoku(difficulty);

    await set(ref(getDb(), `rooms/${code}`), {
        id: code,
        status: 'waiting',
        difficulty,
        initialBoard: initial,
        solvedBoard: solved,
        players: {
            [sanitizeKey(playerName)]: {
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
    const roomRef = ref(getDb(), `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found. Check the code and try again.");
    }

    const room = snapshot.val();
    if (room.status !== 'waiting') {
        throw new Error("This game has already started.");
    }

    const existingPlayers = Object.keys(room.players || {});
    // Check if the sanitized name is already present
    const sanitizedName = sanitizeKey(playerName);
    if (!sanitizedName) {
        throw new Error("Name contains invalid characters. Please use letters and numbers.");
    }

    // Check if actual name or sanitized key is taken
    const nameTaken = Object.values(room.players || {}).some((p: any) => p.name === playerName);
    if (nameTaken) {
        throw new Error("That name is already taken in this room.");
    }

    // Add player
    await update(ref(getDb(), `rooms/${roomId}/players/${sanitizedName}`), {
        name: playerName,
        progress: 0,
        mistakes: 0,
        status: 'playing'
    });

    // Auto-start when 2nd player joins
    if (existingPlayers.length >= 1) {
        await update(ref(getDb(), `rooms/${roomId}`), {
            status: 'playing'
        });
    }
};

/**
 * Subscribe to real-time room updates.
 * Returns an unsubscribe function.
 */
/**
 * Subscribe to real-time room updates.
 * Returns an unsubscribe function.
 */
export const subscribeToRoom = (roomId: string, callback: (room: Room) => void) => {
    const roomRef = ref(getDb(), `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) callback(data);
    });
};

/**
 * Optimized subscription for gameplay - only listens to player changes.
 * drastic bandwidth reduction compared to full room subscription.
 */
export const subscribeToPlayers = (roomId: string, callback: (players: Room['players']) => void) => {
    const playersRef = ref(getDb(), `rooms/${roomId}/players`);
    return onValue(playersRef, (snapshot) => {
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
    // Sanitized key
    const sanitizedName = sanitizeKey(playerName);
    await update(ref(getDb(), `rooms/${roomId}/players/${sanitizedName}`), {
        progress,
        mistakes,
        status
    });

    if (status === 'won') {
        const roomRef = ref(getDb(), `rooms/${roomId}`);
        const snap = await get(roomRef);
        if (snap.val() && !snap.val().winner) {
            await update(roomRef, { winner: playerName, status: 'finished' });
        }
    }
};

const testConnection = async (setLoading: (loading: boolean) => void) => {
    setLoading(true);
    try {
        if (!db) throw new Error("Database not initialized");

        console.log("Testing connection...", db);
        // using a standard path to avoid potential .info restrictions or issues
        const testRef = ref(db, "status");

        console.log("Getting snapshot...");
        await get(testRef); // Just check if we can read
        alert(`Firebase Connected!`);
    } catch (e) {
        console.error("Connection Test Failed:", e);
        console.error("Stack:", e instanceof Error ? e.stack : "No stack");
        alert(`Connection Test Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
        setLoading(false);
    }
};
