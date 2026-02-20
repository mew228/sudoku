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
import { Users, User } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const startGame = useGameStore(state => state.startGame);
  const difficulty = useGameStore(state => state.difficulty);
  const status = useGameStore(state => state.status);
  const mode = useGameStore(state => state.mode);
  const setMultiplayerState = useGameStore(state => state.setMultiplayerState);
  const mistakes = useGameStore(state => state.mistakes);
  const tickTimer = useGameStore(state => state.tickTimer);

  useEffect(() => {
    // Start single player by default only if not already set
    if (status === 'idle' && mode === 'single') {
      startGame(difficulty);
    }
  }, [status, mode, startGame, difficulty]);

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
    <main className="flex h-dvh flex-col items-center justify-center p-2 lg:p-4 bg-slate-50 font-sans transition-colors overflow-hidden select-none touch-none">

      {/* Hint Toast */}
      <HintToast />

      {/* Sidebar / Mode Selection - Compact on Mobile */}
      <div className="absolute top-2 left-2 lg:top-4 lg:left-4 flex gap-2 z-50 scale-75 lg:scale-100 origin-top-left">
        <button
          onClick={() => startGame('Medium', 'single')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors border ${mode === 'single' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 shadow-sm'}`}
        >
          <User size={18} />
          <span className="hidden sm:inline font-medium">Single</span>
        </button>
        <button
          onClick={() => setMultiplayerState({ mode: 'pvp', status: 'idle' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors border ${mode === 'pvp' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 shadow-sm'}`}
        >
          <Users size={18} />
          <span className="hidden sm:inline font-medium">PvP</span>
        </button>
      </div>

      {mode === 'pvp' ? (
        // PvP Mode: Show Lobby or Arena
        (status === 'idle' || status === 'waiting') ? (
          <Lobby />
        ) : (
          <PvPArena />
        )
      ) : (
        // Single Player Mode
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-7xl h-full p-2 overflow-hidden">

          {/* Left/Top: Header & Board - Flex Grow to take available space */}
          <div className="flex flex-col gap-2 items-center justify-center w-full md:flex-1 min-h-0 min-w-0 max-w-2xl">
            {/* Top Bar with Difficulty */}
            <div className="flex w-full justify-between items-center text-slate-500 font-medium px-2 shrink-0">
              <div className="flex gap-1 sm:gap-2 text-xs sm:text-sm">
                {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => startGame(diff, 'single')}
                    className={`px-2 py-1 rounded-md transition-colors ${difficulty === diff ? 'text-indigo-600 font-bold bg-indigo-50' : 'hover:text-indigo-600'}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-800 font-mono">
                <Timer />
              </div>
            </div>

            {/* Game Board Container - Strict constraints to prevent overflow */}
            <div className="relative w-full aspect-square flex-1 min-h-0 flex justify-center items-center py-2">
              {/* Board Wrapper - Ensure it doesn't exceed parent height OR width */}
              <div className="h-full w-full max-w-full aspect-square flex items-center justify-center">
                <Board />
              </div>
            </div>
          </div>

          {/* Right Side: Controls - Fixed width on Desktop, Bottom on Mobile */}
          <div className="flex flex-col gap-2 w-full md:w-80 md:h-full md:justify-center shrink-0">

            {/* Stats Row */}
            <div className="flex justify-between items-center text-slate-600 font-medium px-4 py-1">
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mistakes</span>
                <span className={`text-2xl font-light ${mistakes >= 3 ? 'text-red-500' : 'text-slate-800'}`}>
                  {status === 'playing' ? `${mistakes}/3` : '-/-'}
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

            {/* New Game Button */}
            <button
              onClick={() => startGame(difficulty, mode)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm sm:text-lg font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 tracking-wide mt-auto md:mt-4"
            >
              {status === 'playing' ? 'Restart' : 'New Game'}
            </button>
          </div>

          {/* Game Over / Win Overlay */}
          {(status === 'won' || status === 'lost') && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-100">
                <h2 className={`text-5xl font-black mb-6 ${status === 'won' ? 'text-indigo-600' : 'text-rose-500'}`}>
                  {status === 'won' ? 'Solved!' : 'Failed'}
                </h2>
                <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                  {status === 'won'
                    ? `Congratulations! You've mastered the ${difficulty} board.`
                    : "Don't give up. The numbers are waiting for you."}
                </p>
                <button
                  onClick={() => startGame(difficulty, mode)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-200"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
