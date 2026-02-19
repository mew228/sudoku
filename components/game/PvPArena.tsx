"use client";

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { subscribeToRoom, subscribeToPlayers } from '@/lib/firebase/rooms';
import { Board } from './Board';
import { GameControls } from './GameControls';
import { Numpad } from './Numpad';
import { Timer } from './Timer';
import { Users, Trophy, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PvPArena = () => {
    const {
        difficulty,
        status,
        opponentName,
        opponentProgress,
        mistakes,
        startGame,
        mode,
        opponentStatus,
        roomId,
        playerId,
        setMultiplayerState
    } = useGameStore();

    const [isConnected, setIsConnected] = useState(false);

    // Effect to handle game over states
    useEffect(() => {
        if (opponentStatus === 'won' && status !== 'lost' && status !== 'won') {
            // Opponent won, so we lost
            useGameStore.setState({ status: 'lost' });
        }
    }, [opponentStatus, status]);

    // Effect to subscribe to room updates (for opponent progress/status)
    useEffect(() => {
        if (!roomId || !playerId) return;

        // Subscribe to players (for online status/mistakes)
        const unsubPlayers = subscribeToPlayers(roomId, (players) => {
            setIsConnected(true);
            const opponent = Object.values(players || {}).find((p: any) => p.name !== playerId) as any;
            if (opponent) {
                setMultiplayerState({
                    opponentName: opponent.name,
                    opponentProgress: opponent.progress,
                    opponentStatus: opponent.status
                });
            }
        });

        // Subscribe to SHARED BOARD (Co-op)
        import('@/lib/firebase/rooms').then(({ subscribeToBoard }) => {
            subscribeToBoard(roomId, (remoteBoard) => {
                if (remoteBoard) {
                    useGameStore.getState().setRemoteBoard(remoteBoard);
                }
            });
        });

        return () => {
            unsubPlayers();
        };
    }, [roomId, playerId, setMultiplayerState]);

    return (
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 w-full max-w-7xl px-4 mt-12 lg:mt-0">

            {/* Left/Top: Header & Board */}
            <div className="flex flex-col gap-6 items-center w-full max-w-[600px]">

                {/* Header - PvP Specific */}
                <div className="flex w-full justify-between items-center text-slate-500 font-medium px-2">
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full border border-indigo-100">
                        <Users size={18} />
                        <span className="font-bold text-sm tracking-wide">PvP MATCH</span>
                        <span className="text-xs opacity-60 ml-1">({difficulty})</span>
                        <div className={`w-2 h-2 rounded-full ml-2 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} title={isConnected ? "Live Sync Active" : "Connecting..."} />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 font-mono bg-white px-4 py-1 rounded-lg border border-slate-100 shadow-sm">
                        <Timer />
                    </div>
                </div>

                {/* Game Board Container */}
                <div className="relative w-full aspect-square">
                    <Board />

                    {/* Opponent Progress Bar Overlay */}
                    <div className="absolute -top-14 left-0 right-0 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-xl px-5 py-3 border border-slate-200 shadow-lg z-10">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md shadow-rose-200">
                            {opponentName ? opponentName[0]?.toUpperCase() : '?'}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 truncate">{opponentName || 'Opponent'}</span>
                                <span className="text-[10px] font-bold text-slate-400">{opponentProgress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-rose-400 to-pink-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${opponentProgress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Controls */}
            <div className="flex flex-col gap-8 w-full max-w-sm mt-8 lg:mt-12">

                {/* Stats Row */}
                <div className="flex justify-between items-center text-slate-600 font-medium px-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Mistakes</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-light ${mistakes >= 3 ? 'text-rose-500' : 'text-slate-800'}`}>
                                {mistakes}
                            </span>
                            <span className="text-sm text-slate-300 font-bold">/3</span>
                        </div>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-100"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Status</span>
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            PLAYING
                        </span>
                    </div>
                </div>

                {/* Action Buttons (Icons) */}
                <GameControls />

                {/* Numpad */}
                <Numpad />

                {/* Surrender / Leave Button */}
                <button
                    onClick={() => {
                        // For now just restart implies leaving/resetting, but ideally we'd have a specific "Leave Match" action
                        useGameStore.getState().setMultiplayerState({ mode: 'single', status: 'idle', roomId: null });
                    }}
                    className="w-full py-4 bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-sm font-bold transition-all active:scale-95 tracking-wide flex items-center justify-center gap-2"
                >
                    <XCircle size={18} />
                    Leave Match
                </button>
            </div>

            {/* Game Over / Win Overlay */}
            <AnimatePresence>
                {(status === 'won' || status === 'lost') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-100 relative overflow-hidden"
                        >
                            {/* Background decoration */}
                            <div className={`absolute top-0 left-0 w-full h-2 ${status === 'won' ? 'bg-gradient-to-r from-indigo-400 to-cyan-400' : 'bg-gradient-to-r from-rose-500 to-orange-500'}`} />

                            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${status === 'won' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500'}`}>
                                {status === 'won' ? <Trophy size={40} /> : <XCircle size={40} />}
                            </div>

                            <h2 className={`text-4xl font-black mb-2 ${status === 'won' ? 'text-slate-800' : 'text-slate-800'}`}>
                                {status === 'won' ? 'Victory!' : 'Defeat'}
                            </h2>
                            <p className="text-slate-500 font-medium mb-8">
                                {status === 'won'
                                    ? `You crushed it! ${opponentName} didn't stand a chance.`
                                    : `${opponentName} solved it first. Better luck next time!`}
                            </p>

                            <button
                                onClick={() => useGameStore.getState().setMultiplayerState({ mode: 'pvp', status: 'idle', roomId: null })}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 ${status === 'won'
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'
                                    }`}
                            >
                                Back to Lobby
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
