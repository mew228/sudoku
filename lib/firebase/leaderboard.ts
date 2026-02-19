import { db } from "./firebase";
import { ref, push, query, orderByChild, limitToFirst, get, set } from "firebase/database";
import { Difficulty } from "@/lib/logic/sudoku";

export interface LeaderboardEntry {
    id: string;
    name: string;
    time: number; // Time in seconds
    difficulty: Difficulty;
    createdAt: number;
}

/**
 * Add a new score to the leaderboard.
 */
export const addScore = async (name: string, time: number, difficulty: Difficulty) => {
    if (!db) return;
    const scoresRef = ref(db, `leaderboard/${difficulty}`);
    const newScoreRef = push(scoresRef);
    await set(newScoreRef, {
        name,
        time,
        difficulty,
        createdAt: Date.now()
    });
};

/**
 * Get top 10 scores for a specific difficulty.
 */
export const getLeaderboard = async (difficulty: Difficulty): Promise<LeaderboardEntry[]> => {
    if (!db) return [];

    // In Firebase RDB, sorting is ascending. For time, lower is better, so this works perfectly.
    const scoresRef = ref(db, `leaderboard/${difficulty}`);
    const topScoresQuery = query(scoresRef, orderByChild("time"), limitToFirst(10));

    const snapshot = await get(topScoresQuery);

    if (!snapshot.exists()) return [];

    const scores: LeaderboardEntry[] = [];
    snapshot.forEach((child) => {
        scores.push({
            id: child.key as string,
            ...child.val()
        });
    });

    return scores;
};
