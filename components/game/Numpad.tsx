import { useRef, memo, useCallback, useMemo } from "react";
import { useGameStore } from "@/lib/store";
import { useShallow } from 'zustand/react/shallow';
import { motion } from "framer-motion";
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
        boardRectRef.current = document.querySelector('.sudoku-board')?.getBoundingClientRect() || null;
        useGameStore.getState().setHoveredCell(null);
    }, [isOpponentTurn]);

    const getCellFromCoords = useCallback((clientX: number, clientY: number) => {
        const rect = boardRectRef.current;
        if (!rect) return null;

        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const r = Math.floor((y / rect.height) * 9);
        const c = Math.floor((x / rect.width) * 9);

        if (r >= 0 && r < 9 && c >= 0 && c < 9) return { r, c };
        return null;
    }, []);

    const handleDrag = useCallback((e: MouseEvent | TouchEvent | PointerEvent) => {
        if (isOpponentTurn) return;

        let clientX = 0;
        let clientY = 0;

        if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('changedTouches' in e && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            return;
        }

        const cell = getCellFromCoords(clientX, clientY);
        const currentHover = useGameStore.getState().hoveredCell;

        if (!cell) {
            if (currentHover !== null) useGameStore.getState().setHoveredCell(null);
            return;
        }

        if (cell.r !== currentHover?.r || cell.c !== currentHover?.c) {
            useGameStore.getState().setHoveredCell(cell);
        }
    }, [isOpponentTurn, getCellFromCoords]);

    const handleDragEnd = useCallback((e: MouseEvent | TouchEvent | PointerEvent, num: number) => {
        if (isOpponentTurn) return;

        let clientX = 0;
        let clientY = 0;

        if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if ('changedTouches' in e && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        const cellCoords = getCellFromCoords(clientX, clientY);
        const state = useGameStore.getState();

        state.setHoveredCell(null);
        boardRectRef.current = null;

        if (cellCoords) {
            const { r, c } = cellCoords;
            if (!state.initialBoard[r][c]) {
                state.selectCell(r, c);
                state.setCellValue(num);
            }
        }
    }, [isOpponentTurn, getCellFromCoords]);

    return (
        <div className="grid grid-cols-3 gap-2 w-full touch-none max-w-sm mx-auto">
            {numbers.map((num) => (
                <motion.div
                    key={num}
                    drag
                    dragSnapToOrigin
                    dragElastic={0.05}
                    dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
                    whileDrag={{
                        scale: 1.3,
                        zIndex: 100,
                        cursor: "grabbing",
                        opacity: 0.7,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                    }}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={(e) => handleDragEnd(e, num)}
                    onPointerDown={(e) => {
                        // Ensure we capture the pointer for smooth dragging
                        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    }}
                    whileHover={{ scale: isOpponentTurn ? 1 : 1.05 }}
                    whileTap={{ scale: isOpponentTurn ? 1 : 0.90 }}
                    onClick={() => {
                        if (isOpponentTurn) return;
                        playSound('click');
                        setCellValue(num);
                    }}
                    draggable={false} // Prevent native HTML5 drag ghost image
                    className={`aspect-[4/3] flex items-center justify-center text-2xl lg:text-4xl font-light text-indigo-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 active:bg-indigo-100 rounded-lg lg:rounded-xl transition-all duration-300 select-none touch-none ${isOpponentTurn ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                    style={{ touchAction: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
                >
                    {num}
                </motion.div>
            ))}
        </div>
    );
});
