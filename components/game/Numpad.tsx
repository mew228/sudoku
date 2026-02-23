import { useRef, memo, useCallback, useMemo } from "react";
import { useGameStore } from "@/lib/store";
import { useShallow } from 'zustand/react/shallow';
import { motion, PanInfo } from "framer-motion";
import { useSound } from "@/lib/hooks/useSound";

export const Numpad = memo(() => {
    const { setCellValue, isOpponentTurn } = useGameStore(useShallow(state => ({
        setCellValue: state.setCellValue,
        isOpponentTurn: state.mode === 'pvp' && state.currentTurn !== null && state.uid !== state.currentTurn
    })));

    const { playSound } = useSound();
    const numbers = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], []);

    const boardRectRef = useRef<DOMRect | null>(null);

    const handleDragStart = useCallback(() => {
        if (isOpponentTurn) return;
        // Cache the board rect at drag start for consistent hit-testing
        const boardEl = document.querySelector('.sudoku-board');
        boardRectRef.current = boardEl?.getBoundingClientRect() ?? null;
        useGameStore.getState().setHoveredCell(null);
    }, [isOpponentTurn]);

    const getCellFromPoint = useCallback((clientX: number, clientY: number) => {
        const rect = boardRectRef.current;
        if (!rect) return null;

        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
            return null;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const r = Math.min(8, Math.max(0, Math.floor((y / rect.height) * 9)));
        const c = Math.min(8, Math.max(0, Math.floor((x / rect.width) * 9)));

        return { r, c };
    }, []);

    const handleDrag = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isOpponentTurn) return;

        // Use Framer Motion's PanInfo.point which gives accurate page coordinates
        const cell = getCellFromPoint(info.point.x, info.point.y);
        const currentHover = useGameStore.getState().hoveredCell;

        if (!cell) {
            if (currentHover !== null) useGameStore.getState().setHoveredCell(null);
            return;
        }

        if (cell.r !== currentHover?.r || cell.c !== currentHover?.c) {
            useGameStore.getState().setHoveredCell(cell);
        }
    }, [isOpponentTurn, getCellFromPoint]);

    const handleDragEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, num: number) => {
        if (isOpponentTurn) return;

        const cellCoords = getCellFromPoint(info.point.x, info.point.y);
        const state = useGameStore.getState();

        state.setHoveredCell(null);
        boardRectRef.current = null;

        if (cellCoords) {
            const { r, c } = cellCoords;
            if (!state.initialBoard[r][c]) {
                state.selectCell(r, c);
                state.setCellValue(num);
                playSound('correct');
            }
        }
    }, [isOpponentTurn, getCellFromPoint, playSound]);

    return (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full touch-none max-w-sm mx-auto px-1">
            {numbers.map((num) => (
                <motion.div
                    key={num}
                    drag
                    dragSnapToOrigin
                    dragElastic={0.05}
                    dragMomentum={false}
                    dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
                    whileDrag={{
                        scale: 1.3,
                        zIndex: 100,
                        cursor: "grabbing",
                        opacity: 0.85,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
                    }}
                    onDragStart={handleDragStart}
                    onDrag={(e, info) => handleDrag(e, info)}
                    onDragEnd={(e, info) => handleDragEnd(e, info, num)}
                    whileHover={{ scale: isOpponentTurn ? 1 : 1.05 }}
                    whileTap={{ scale: isOpponentTurn ? 1 : 0.90 }}
                    onClick={() => {
                        if (isOpponentTurn) return;
                        playSound('click');
                        setCellValue(num);
                    }}
                    draggable={false}
                    className={`aspect-[4/3] flex items-center justify-center text-xl sm:text-2xl lg:text-4xl font-light text-indigo-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 active:bg-indigo-100 rounded-lg lg:rounded-xl transition-all duration-200 select-none touch-none ${isOpponentTurn ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                    style={{ touchAction: 'none' } as React.CSSProperties}
                >
                    {num}
                </motion.div>
            ))}
        </div>
    );
});

Numpad.displayName = 'Numpad';
