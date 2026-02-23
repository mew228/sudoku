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
            }}
            className="bg-indigo-500/20 ring-2 ring-inset ring-indigo-500 z-30 pointer-events-none flex items-center justify-center rounded-sm"
        >
            <div className="w-full h-full bg-indigo-500/10 animate-pulse rounded-sm" />
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
                    }}
                    className="bg-rose-500/20 ring-2 ring-inset ring-rose-400 z-20 pointer-events-none rounded-sm"
                />
            ))}
        </>
    );
};

export const Board = memo(() => {
    const { board, initialBoard, startGame } = useGameStore(useShallow(state => ({
        board: state.board,
        initialBoard: state.initialBoard,
        startGame: state.startGame
    })));

    useEffect(() => {
        if (board.length === 0) {
            startGame('Medium');
        }
    }, [board.length, startGame]);

    if (board.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl aspect-square bg-slate-800 p-[2px] sm:p-1 rounded-sm shadow-2xl overflow-hidden"
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

Board.displayName = 'Board';
