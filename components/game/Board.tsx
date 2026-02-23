import { useEffect, memo } from 'react';
import { Cell } from './Cell';
import { useGameStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';

const LocalHoverHighlight = () => {
    const hoveredCell = useGameStore(state => state.hoveredCell);
    if (!hoveredCell) return null;

    return (
        <div
            style={{
                gridRow: hoveredCell.r + 1,
                gridColumn: hoveredCell.c + 1,
                pointerEvents: 'none'
            }}
            className="absolute inset-0 bg-indigo-500/20 ring-2 ring-inset ring-indigo-500 z-30 flex items-center justify-center"
        >
            <div className="w-full h-full bg-indigo-500/10 animate-pulse" />
        </div>
    );
};

const OpponentHoverHighlight = () => {
    const opponentHoveredCells = useGameStore(state => state.opponentHoveredCells);
    if (opponentHoveredCells.length === 0) return null;

    return (
        <>
            {opponentHoveredCells.map((cell, i) => (
                <div
                    key={i}
                    style={{
                        gridRow: cell.r + 1,
                        gridColumn: cell.c + 1,
                        pointerEvents: 'none'
                    }}
                    className="absolute inset-0 bg-rose-500/20 ring-2 ring-inset ring-rose-400 z-20"
                />
            ))}
        </>
    );
};

export const Board = memo(() => {
    // Simplified selectors with shallow check
    const { board, initialBoard, startGame } = useGameStore(useShallow(state => ({
        board: state.board,
        initialBoard: state.initialBoard,
        startGame: state.startGame
    })));

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
            <div className="sudoku-board relative grid grid-cols-9 grid-rows-9 h-full w-full bg-white touch-manipulation">
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

                {/* Performance Optimized Highlight Layers */}
                <LocalHoverHighlight />
                <OpponentHoverHighlight />
            </div>
        </motion.div>
    );
});
