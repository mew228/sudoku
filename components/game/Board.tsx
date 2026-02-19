import { useEffect } from 'react';
import { Cell } from './Cell';
import { useGameStore } from '@/lib/store';
import { motion } from 'framer-motion';

export const Board = () => {
    // Simplified selectors
    const board = useGameStore(state => state.board);
    const initialBoard = useGameStore(state => state.initialBoard);
    const startGame = useGameStore(state => state.startGame);

    useEffect(() => {
        // Start game on mount if empty
        if (board.length === 0) {
            startGame('Medium');
        }
    }, [board.length, startGame]);

    if (board.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl aspect-square bg-slate-800 p-1 rounded-sm shadow-2xl overflow-hidden"
        >
            {/* 
                Changed from gap-based grid to border-based grid for better control over line thickness.
                Background is slate-800 to form the thick outer border.
                Cells handle their own inner borders.
            */}
            <div className="grid grid-cols-9 grid-rows-9 h-full w-full bg-white touch-manipulation">
                {board.map((row, r) => (
                    row.map((val, c) => (
                        <Cell
                            key={`${r}-${c}`}
                            r={r}
                            c={c}
                            val={val}
                            initial={initialBoard[r][c] !== 0}
                        />
                    ))
                ))}
            </div>
        </motion.div>
    );
};
