"use client";

import { Board } from "@/components/game/Board";
import { GameControls } from "@/components/game/GameControls";
import { Numpad } from "@/components/game/Numpad";
import { Timer } from "@/components/game/Timer";
import { HintToast } from "@/components/game/HintToast";
import { Lobby } from "@/components/layout/Lobby";
import { PvPArena } from "@/components/game/PvPArena";
import { useGameStore } from "@/lib/store";
import { useEffect } from "react";
import { Users, User, Trophy, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listenToAuth } from "@/lib/firebase/auth";
import { useShallow } from 'zustand/react/shallow';

export default function Home() {
  const { startGame, difficulty, status, mode, setMultiplayerState, mistakes, tickTimer } = useGameStore(useShallow(state => ({
    startGame: state.startGame,
    difficulty: state.difficulty,
    status: state.status,
    mode: state.mode,
    setMultiplayerState: state.setMultiplayerState,
    mistakes: state.mistakes,
    tickTimer: state.tickTimer
  })));

  useEffect(() => {
    if (status === 'idle' && mode === 'single') {
      startGame(difficulty);
    }
  }, [status, mode, startGame, difficulty]);

  useEffect(() => {
    const unsubAuth = listenToAuth((user) => {
      if (user) {
        useGameStore.setState({
          uid: user.uid,
          playerName: user.displayName || 'Guest'
        });
      }
    });
    return () => { unsubAuth(); };
  }, []);

  // Centralized Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'playing') {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, tickTimer]);

  return (
    <main className="flex h-dvh flex-col items-center justify-start p-2 sm:p-4 bg-slate-50 font-sans select-none touch-manipulation safe-area-top safe-area-bottom overflow-y-auto overflow-x-hidden">

      {/* Hint Toast */}
      <HintToast />

      {/* Mode Selection - Compact on Mobile */}
      <div className="flex gap-1.5 sm:gap-2 z-50 w-full justify-start mb-1 sm:mb-2 shrink-0">
        <button
          onClick={() => startGame('Medium', 'single')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all border text-xs sm:text-sm ${mode === 'single' ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' : 'bg-white/80 backdrop-blur text-slate-700 border-slate-200 shadow-sm hover:border-slate-300'}`}
        >
          <User size={14} />
          <span className="font-bold uppercase tracking-wider">Solo</span>
        </button>
        <button
          onClick={() => setMultiplayerState({ mode: 'pvp', status: 'idle' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all border text-xs sm:text-sm ${mode === 'pvp' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white/80 backdrop-blur text-slate-700 border-slate-200 shadow-sm hover:border-indigo-200 hover:text-indigo-600'}`}
        >
          <Users size={14} />
          <span className="font-bold uppercase tracking-wider">PvP</span>
        </button>
      </div>

      {(mode === 'pvp' || mode === 'bot') ? (
        (status === 'idle' || status === 'waiting') ? (
          <Lobby />
        ) : (
          <PvPArena />
        )
      ) : (
        // Single Player Mode - Mobile-first vertical layout
        <div className="flex flex-col items-center w-full max-w-2xl flex-1 min-h-0 gap-1 sm:gap-2">

          {/* Difficulty & Timer Row */}
          <div className="flex w-full justify-between items-center text-slate-500 font-medium px-1 shrink-0">
            <div className="flex gap-0.5 sm:gap-1.5 text-[11px] sm:text-sm">
              {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => startGame(diff, 'single')}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-colors ${difficulty === diff ? 'text-indigo-600 font-bold bg-indigo-50' : 'hover:text-indigo-600'}`}
                >
                  {diff}
                </button>
              ))}
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 font-mono">
              <Timer />
            </div>
          </div>

          {/* Game Board - Constrained to available space */}
          <div className="w-full flex-1 min-h-0 flex justify-center items-center">
            <div className="w-full max-h-full aspect-square flex items-center justify-center p-0.5 sm:p-1 bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-slate-200/50 border border-white">
              <Board />
            </div>
          </div>

          {/* Bottom Controls - Fixed to bottom on mobile */}
          <div className="flex flex-col gap-1 sm:gap-2 w-full shrink-0 pb-1">

            {/* Stats Row */}
            <div className="flex justify-between items-center text-slate-600 font-medium px-2 py-0.5">
              <div className="flex flex-col items-start">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mistakes</span>
                <span className={`text-lg sm:text-2xl font-light ${mistakes >= 3 ? 'text-red-500' : 'text-slate-800'}`}>
                  {status === 'playing' ? `${mistakes}/3` : '-/-'}
                </span>
              </div>
            </div>

            {/* Action Buttons - Scaled for mobile */}
            <div className="scale-[0.85] sm:scale-100 origin-center">
              <GameControls />
            </div>

            {/* Numpad */}
            <Numpad />

            <button
              onClick={() => startGame(difficulty, mode)}
              className="w-full py-3 sm:py-4 bg-slate-900 text-white rounded-xl text-base sm:text-lg font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 tracking-wide"
            >
              {status === 'playing' ? 'Restart' : 'New Game'}
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Win Overlay */}
      <AnimatePresence>
        {(status === 'won' || status === 'lost') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white p-8 sm:p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-100 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${status === 'won' ? 'bg-gradient-to-r from-indigo-400 to-cyan-400' : 'bg-gradient-to-r from-rose-500 to-orange-500'}`} />

              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center ${status === 'won' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500'}`}>
                {status === 'won' ? <Trophy size={36} /> : <XCircle size={36} />}
              </div>

              <h2 className="text-3xl sm:text-4xl font-black mb-2 text-slate-800">
                {status === 'won' ? 'Victory!' : 'Failed'}
              </h2>
              <p className="text-slate-500 font-medium mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                {status === 'won'
                  ? `Impressive! You've mastered the ${difficulty} board.`
                  : "The numbers got the better of you this time. Ready to try again?"}
              </p>

              <button
                onClick={() => startGame(difficulty, mode)}
                className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg active:scale-95 ${status === 'won'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'
                  }`}
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
