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
        uid,
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
            const currentUid = useGameStore.getState().uid;

            // Find opponent by excluding current user's UID
            const opponentEntry = Object.entries(players || {}).find(([uid]) => uid !== currentUid);
            const opponent = opponentEntry ? opponentEntry[1] as any : null;

            if (opponent) {
                setMultiplayerState({
                    opponentName: opponent.name,
                    opponentProgress: opponent.progress,
                    opponentStatus: opponent.status
                });
            }
        });

        // Subscribe to PERSONAL BOARD (for persistence/racing)
        import('@/lib/firebase/rooms').then(({ subscribeToBoard }) => {
            const currentUid = useGameStore.getState().uid;
            if (roomId && currentUid) {
                subscribeToBoard(roomId, currentUid, (remoteBoard) => {
                    if (remoteBoard) {
                        useGameStore.getState().setRemoteBoard(remoteBoard);
                    }
                });
            }
        });

        return () => {
            unsubPlayers();
        };
    }, [roomId, mode, playerId, uid, setMultiplayerState]);

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-7xl h-dvh p-2 overflow-hidden select-none touch-none">

            {/* Left/Top: Header & Board - Flex Grow */}
            <div className="flex flex-col gap-2 items-center justify-center w-full md:flex-1 min-h-0 min-w-0 max-w-2xl pt-2">

                {/* Header - PvP Specific - Compact & Unified */}
                <div className="flex w-full justify-between items-center text-slate-500 font-medium px-2 z-10 shrink-0 gap-2">
                    {/* Status Pill with Opponent Info - Redesigned for clarity */}
                    <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-sm grow-0 shrink overflow-hidden max-w-[70%] transition-all hover:border-indigo-200">
                        <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 border border-indigo-100">
                            <Users size={16} />
                            {/* Connection Pulse Indicator */}
                            <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>

                        <div className="flex items-center gap-3 min-w-0 pr-1">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Versus</span>
                                <span className="text-sm font-bold text-slate-800 truncate leading-none mb-0.5">
                                    {opponentName || 'Opponent'}
                                </span>
                            </div>

                            <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Progress</span>
                                <span className={`text-sm font-mono font-black tabular-nums leading-none ${opponentProgress > 50 ? 'text-indigo-600' : 'text-slate-600'}`}>
                                    {opponentProgress}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="text-xl sm:text-2xl font-bold text-slate-800 font-mono bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm shrink-0">
                        <Timer />
                    </div>
                </div>

                {/* Game Board Container - Strict constraints */}
                <div className="relative w-full aspect-square flex-1 min-h-0 flex justify-center items-center py-2">
                    <div className="h-full w-full max-w-full aspect-square flex items-center justify-center">
                        <Board />
                    </div>
                </div>
            </div>

            {/* Right Side: Controls - Fixed width Desktop, Dynamic Mobile */}
            <div className="flex flex-col gap-2 w-full md:w-80 md:h-full md:justify-center shrink-0">

                {/* Stats Row */}
                <div className="flex justify-between items-center text-slate-600 font-medium px-4 py-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mistakes</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-light ${mistakes >= 3 ? 'text-rose-500' : 'text-slate-800'}`}>
                                {mistakes}
                            </span>
                            <span className="text-xs text-slate-300 font-bold">/3</span>
                        </div>
                    </div>
                    {/* Status Badge */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Status</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            PLAYING
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="scale-90 origin-center md:scale-100">
                    <GameControls />
                </div>

                {/* Numpad */}
                <div className="w-full">
                    <Numpad />
                </div>

                {/* Surrender / Leave Button */}
                <button
                    onClick={() => {
                        useGameStore.getState().setMultiplayerState({ mode: 'pvp', status: 'idle', roomId: null });
                    }}
                    className="w-full py-3 bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-sm font-bold transition-all active:scale-95 tracking-wide flex items-center justify-center gap-2 mt-auto md:mt-4"
                >
                    <XCircle size={18} />
                    Leave
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
