"use client";

import { useEffect, useState } from 'react';
import { LeaderboardEntry, getLeaderboard } from '@/lib/firebase/leaderboard';
import { Difficulty } from '@/lib/logic/sudoku';
import { motion } from 'framer-motion';
import { Trophy, Clock, Calendar, Crown, Medal } from 'lucide-react';

export const Leaderboard = () => {
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);
            try {
                const data = await getLeaderboard(difficulty);
                setScores(data);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [difficulty]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white text-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-inner">
                    <Trophy size={24} className="text-yellow-300 drop-shadow-sm" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Leaderboard</h2>
                <p className="text-indigo-100 text-sm font-medium opacity-80">Top solvers worldwide</p>
            </div>

            {/* Difficulty Tabs */}
            <div className="flex p-2 gap-1 bg-slate-50 border-b border-slate-100">
                {(['Easy', 'Medium', 'Hard', 'Expert'] as Difficulty[]).map((diff) => (
                    <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`
                            flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all
                            ${difficulty === diff
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }
                        `}
                    >
                        {diff}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="p-4 min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-3 opacity-50">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
                    </div>
                ) : scores.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">No scores yet!</p>
                        <p className="text-xs opacity-60 mt-1">Be the first to solve {difficulty} mode.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {scores.map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/50 transition-all group"
                            >
                                {/* Rank */}
                                <div className={`
                                    w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm
                                    ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                        index === 1 ? 'bg-slate-100 text-slate-600' :
                                            index === 2 ? 'bg-orange-100 text-orange-600' :
                                                'bg-white text-slate-300 border border-slate-100'}
                                `}>
                                    {index === 0 ? <Crown size={14} /> :
                                        index === 1 ? <Medal size={14} /> :
                                            index === 2 ? <Medal size={14} /> :
                                                `#${index + 1}`}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">
                                        {entry.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={10} />
                                            {formatDate(entry.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="font-mono text-sm font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
                                    <Clock size={12} className="text-slate-400" />
                                    {formatTime(entry.time)}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
