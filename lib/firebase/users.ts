import { db } from "./firebase";
import { ref, get, set, update } from "firebase/database";

export interface UserStats {
    gamesPlayed: number;
    gamesWon: number;
    bestTime: {
        easy: number | null;
        medium: number | null;
        hard: number | null;
        expert: number | null;
    };
    totalMistakes: number;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    stats: UserStats;
    lastActive: number;
}

const DEFAULT_STATS: UserStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    bestTime: {
        easy: null,
        medium: null,
        hard: null,
        expert: null
    },
    totalMistakes: 0
};

/**
 * Get or create user profile from Realtime Database.
 */
export const getUserProfile = async (uid: string, displayName: string = "Player"): Promise<UserProfile> => {
    if (!db) throw new Error("DB not initialized");

    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        return snapshot.val() as UserProfile;
    } else {
        const newProfile: UserProfile = {
            uid,
            displayName,
            stats: DEFAULT_STATS,
            lastActive: Date.now()
        };
        await set(userRef, newProfile);
        return newProfile;
    }
};

/**
 * Update user statistics after a game.
 */
export const updateUserStats = async (
    uid: string,
    won: boolean,
    time: number | null,
    difficulty: keyof UserStats['bestTime'],
    mistakes: number
) => {
    if (!db) return;

    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) return;

    const profile = snapshot.val() as UserProfile;
    const stats = profile.stats || { ...DEFAULT_STATS };

    stats.gamesPlayed += 1;
    if (won) stats.gamesWon += 1;
    stats.totalMistakes += mistakes;

    if (won && time !== null) {
        const currentBest = stats.bestTime[difficulty];
        if (currentBest === null || time < currentBest) {
            stats.bestTime[difficulty] = time;
        }
    }

    await update(userRef, {
        stats,
        lastActive: Date.now()
    });
};
