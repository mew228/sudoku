'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { createRoom, joinRoom, subscribeToRoom } from '@/lib/firebase/rooms';
import { signInUser } from '@/lib/firebase/auth';
import { getUserProfile } from '@/lib/firebase/users';
import { db } from '@/lib/firebase/firebase';
import { ref, get } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, ArrowLeft, Loader2, Swords } from 'lucide-react';

export const Lobby = () => {
    const { setMultiplayerState } = useGameStore();
    const [name, setName] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError("Enter your name to continue");
            return;
        }
        setError('');
        setLoading(true);
        try {
            // 1. Sign in the user
            const user = await signInUser(name.trim());
            // 2. Setup user profile
            await getUserProfile(user.uid, name.trim());

            const id = await createRoom(name.trim(), 'Medium');
            setCreatedRoomId(id);
            setMultiplayerState({
                roomId: id,
                playerId: name.trim(),
                uid: user.uid,
                mode: 'pvp',
                status: 'waiting'
            });

            // Listen for opponent joining
            const unsubscribe = subscribeToRoom(id, (room) => {
                if (room.status === 'playing') {
                    setMultiplayerState({
                        status: 'playing',
                        board: room.board || room.initialBoard,
                        initialBoard: room.initialBoard,
                        solvedBoard: room.solvedBoard,
                        difficulty: room.difficulty
                    });
                    const currentUid = useGameStore.getState().uid;
                    const opponent = Object.entries(room.players || {}).find(([id]) => id !== currentUid)?.[1];
                    if (opponent) {
                        setMultiplayerState({ opponentName: (opponent as any).name });
                    }
                    unsubscribe();
                }
            });
        } catch (error: unknown) {
            console.error("Lobby Create Error:", error);
            const msg = error instanceof Error ? error.message : "Failed to create room";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!name.trim() || !roomIdInput.trim()) {
            setError("Enter your name and room code");
            return;
        }
        setError('');
        setLoading(true);
        try {
            const code = roomIdInput.trim().toUpperCase();

            // 1. Sign in the user
            const user = await signInUser(name.trim());
            // 2. Setup user profile
            await getUserProfile(user.uid, name.trim());

            await joinRoom(code, name.trim());
            setMultiplayerState({
                roomId: code,
                playerId: name.trim(),
                uid: user.uid,
                mode: 'pvp'
            });

            const unsubscribe = subscribeToRoom(code, (room) => {
                if (room.status === 'playing') {
                    setMultiplayerState({
                        status: 'playing',
                        board: room.board || room.initialBoard,
                        initialBoard: room.initialBoard,
                        solvedBoard: room.solvedBoard,
                        difficulty: room.difficulty
                    });
                    const currentUid = useGameStore.getState().uid;
                    const opponent = Object.entries(room.players || {}).find(([id]) => id !== currentUid)?.[1];
                    if (opponent) {
                        setMultiplayerState({ opponentName: (opponent as any).name });
                    }
                    unsubscribe();
                }
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed to join room";
            setError(msg);
            alert(msg); // Force visible error for debugging
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!createdRoomId) return;
        navigator.clipboard.writeText(createdRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };



    const testConnection = async () => {
        setLoading(true);
        try {
            if (!db) throw new Error("Database not initialized");

            console.log("Testing connection...", db);
            const testRef = ref(db, "status");

            console.log("Getting snapshot...");
            await get(testRef);
            alert(`Firebase Connected!`);
        } catch (e) {
            console.error("Connection Test Failed:", e);
            alert(`Connection Test Failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setLoading(false);
        }
    };

    // --- "Waiting for Opponent" Screen ---
    if (createdRoomId) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-8"
            >
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 w-full text-center">
                    {/* Header */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200">
                        <Swords size={28} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Room Created!</h2>
                    <p className="text-sm text-slate-400 mb-6">Share this code with your opponent</p>

                    {/* Room Code */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Room Code</p>
                        <div className="flex items-center justify-center gap-3">
                            <p className="text-4xl font-mono font-black tracking-[0.3em] text-slate-800 select-all">{createdRoomId}</p>
                            <button
                                onClick={handleCopy}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                            >
                                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Waiting indicator */}
                    <div className="flex items-center justify-center gap-3 text-indigo-500">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-medium">Waiting for opponent...</span>
                    </div>

                    {/* Back button */}
                    <button
                        onClick={() => setCreatedRoomId(null)}
                        className="mt-6 flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                    </button>
                </div>
            </motion.div>
        );
    }

    // --- Main Lobby Screen ---
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4"
        >
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                        <Users size={24} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">PvP Arena</h2>
                    <p className="text-sm text-slate-400 mt-1">Challenge a friend in real-time</p>
                </div>

                {/* Name Input */}
                <div className="mb-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block">Your Name</label>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={e => { setName(e.target.value); setError(''); }}
                        maxLength={16}
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-800 placeholder-slate-300 font-medium focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    />
                </div>

                {/* Create Room Button */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-300/30"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Creating...
                        </span>
                    ) : 'Create Room'}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="h-[1px] bg-slate-100 flex-1" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">or join</span>
                    <div className="h-[1px] bg-slate-100 flex-1" />
                </div>

                {/* Join Room */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="ROOM CODE"
                        value={roomIdInput}
                        onChange={e => { setRoomIdInput(e.target.value.toUpperCase()); setError(''); }}
                        maxLength={6}
                        className="flex-1 px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-800 placeholder-slate-300 font-mono font-bold text-center tracking-[0.2em] uppercase focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    />
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleJoin}
                        disabled={loading}
                        className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200/50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
                    </motion.button>
                </div>

                {/* Practice against AI */}
                <div className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 text-center mb-3">No one online?</p>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            const { startGame, difficulty } = useGameStore.getState();
                            startGame(difficulty, 'bot');
                        }}
                        className="w-full py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-bold text-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Swords size={16} />
                        Practice vs AI Bot
                    </motion.button>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 text-sm text-center text-rose-500 font-medium bg-rose-50 py-2.5 rounded-xl border border-rose-100"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Debug Tool removed - connection verified */}
            </div>
        </motion.div>
    );
};
