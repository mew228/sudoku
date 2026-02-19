"use client";

import { Board } from "@/components/game/Board";
import { GameControls } from "@/components/game/GameControls";
import { Numpad } from "@/components/game/Numpad";
import { Timer } from "@/components/game/Timer";
import { HintToast } from "@/components/game/HintToast";
import { Lobby } from "@/components/layout/Lobby";
import { PvPArena } from "@/components/game/PvPArena";
import { Leaderboard } from "@/components/game/Leaderboard"; // New import
import { useGameStore } from "@/lib/store";
import { useEffect, useState } from "react"; // Added useState
import { Users, User, Trophy } from 'lucide-react'; // Added Trophy
import { AnimatePresence, motion } from "framer-motion"; // New import

export default function Home() {
  const startGame = useGameStore(state => state.startGame);
  const difficulty = useGameStore(state => state.difficulty);
  const status = useGameStore(state => state.status);
  const mode = useGameStore(state => state.mode);
  const setMultiplayerState = useGameStore(state => state.setMultiplayerState);
  const mistakes = useGameStore(state => state.mistakes);
  const tickTimer = useGameStore(state => state.tickTimer);

  const [showLeaderboard, setShowLeaderboard] = useState(false); // New state

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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 font-sans transition-colors">

      {/* Hint Toast */}
      <HintToast />

      {/* Sidebar / Mode Selection */}
      <div className="absolute top-4 left-4 flex gap-2 z-50">
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
        <button
          onClick={() => setShowLeaderboard(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors border bg-white text-slate-700 border-slate-200 shadow-sm hover:text-indigo-600 hover:border-indigo-200`}
        >
          <Trophy size={18} />
          <span className="hidden sm:inline font-medium">Rankings</span>
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
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 w-full max-w-7xl px-4 mt-12 lg:mt-0">

          {/* Left/Top: Header & Board */}
          <div className="flex flex-col gap-6 items-center w-full max-w-[600px]">
            {/* Top Bar with Difficulty (Desktop) */}
            <div className="flex flex-wrap lg:flex-nowrap w-full justify-center lg:justify-between items-center text-slate-500 font-medium px-2 gap-y-4">
              <div className="flex gap-4 text-sm">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Difficulty</span>
                {(['Easy', 'Medium', 'Hard', 'Expert'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => {
                      startGame(diff, 'single');
                    }}
                    className={`hover:text-indigo-600 transition-colors ${difficulty === diff ? 'text-indigo-600 font-bold underline decoration-2 underline-offset-4' : ''}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
              <div className="hidden lg:block text-3xl font-bold text-slate-800 font-mono">
                <Timer />
              </div>
            </div>

            {/* Game Board Container */}
            <div className="relative w-full aspect-square">
              <Board />
            </div>
          </div>

          {/* Right Side: Controls */}
          <div className="flex flex-col gap-8 w-full max-w-sm mt-8 lg:mt-12">

            {/* Stats Row */}
            <div className="flex justify-between items-center text-slate-600 font-medium px-4">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Mistakes</span>
                <span className={`text-4xl font-light ${mistakes >= 3 ? 'text-red-500' : 'text-slate-800'}`}>
                  {status === 'playing' ? `${mistakes}/3` : '-/-'}
                </span>
              </div>
              <div className="flex flex-col items-end lg:hidden">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Time</span>
                <Timer />
              </div>
            </div>

            {/* Action Buttons (Icons) */}
            <GameControls />

            {/* Numpad */}
            <Numpad />

            {/* New Game Button */}
            <button
              onClick={() => startGame(difficulty, mode)}
              className="w-full py-4 bg-slate-900 text-white rounded-xl text-lg font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 tracking-wide"
            >
              New Game
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
      {/* Leaderboard Overlay */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            key="leaderboard-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={() => setShowLeaderboard(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Leaderboard />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
