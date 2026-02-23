import { useRef, memo, useCallback, useMemo, useEffect } from "react";
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

    // Refs for native drag system
    const ghostRef = useRef<HTMLDivElement | null>(null);
    const dragNumRef = useRef<number | null>(null);
    const boardRectRef = useRef<DOMRect | null>(null);
    const isDraggingRef = useRef(false);
    const startPosRef = useRef<{ x: number; y: number } | null>(null);

    const DRAG_THRESHOLD = 8; // pixels before drag activates

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

    const createGhost = useCallback((num: number, x: number, y: number) => {
        // Remove any existing ghost
        if (ghostRef.current) {
            ghostRef.current.remove();
        }
        const ghost = document.createElement('div');
        ghost.textContent = String(num);
        ghost.style.cssText = `
            position: fixed;
            left: ${x - 24}px;
            top: ${y - 24}px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 600;
            color: #4f46e5;
            background: white;
            border: 2px solid #818cf8;
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(79, 70, 229, 0.3), 0 4px 8px rgba(0,0,0,0.1);
            pointer-events: none;
            z-index: 9999;
            transition: none;
            transform: scale(1.1);
            will-change: left, top;
        `;
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
    }, []);

    const moveGhost = useCallback((x: number, y: number) => {
        if (ghostRef.current) {
            ghostRef.current.style.left = `${x - 24}px`;
            ghostRef.current.style.top = `${y - 24}px`;
        }
    }, []);

    const removeGhost = useCallback(() => {
        if (ghostRef.current) {
            ghostRef.current.remove();
            ghostRef.current = null;
        }
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent, num: number) => {
        if (isOpponentTurn) return;
        e.preventDefault();
        e.stopPropagation();

        // Save start position for threshold detection
        startPosRef.current = { x: e.clientX, y: e.clientY };
        dragNumRef.current = num;
        isDraggingRef.current = false;

        // Cache board rect
        const boardEl = document.querySelector('.sudoku-board');
        boardRectRef.current = boardEl?.getBoundingClientRect() ?? null;

        // Capture pointer on the target
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [isOpponentTurn]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (dragNumRef.current === null || isOpponentTurn) return;
        e.preventDefault();

        const clientX = e.clientX;
        const clientY = e.clientY;

        // Check if we've exceeded the drag threshold
        if (!isDraggingRef.current && startPosRef.current) {
            const dx = clientX - startPosRef.current.x;
            const dy = clientY - startPosRef.current.y;
            if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
            // Threshold exceeded — activate drag
            isDraggingRef.current = true;
            createGhost(dragNumRef.current, clientX, clientY);
        }

        if (!isDraggingRef.current) return;

        moveGhost(clientX, clientY);

        // Update hovered cell
        const cell = getCellFromPoint(clientX, clientY);
        const currentHover = useGameStore.getState().hoveredCell;

        if (!cell) {
            if (currentHover !== null) useGameStore.getState().setHoveredCell(null);
        } else if (cell.r !== currentHover?.r || cell.c !== currentHover?.c) {
            useGameStore.getState().setHoveredCell(cell);
        }
    }, [isOpponentTurn, createGhost, moveGhost, getCellFromPoint]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (dragNumRef.current === null || isOpponentTurn) return;
        e.preventDefault();

        const num = dragNumRef.current;
        const wasDragging = isDraggingRef.current;

        // Clean up
        removeGhost();
        useGameStore.getState().setHoveredCell(null);
        boardRectRef.current = null;
        dragNumRef.current = null;
        isDraggingRef.current = false;
        startPosRef.current = null;

        if (wasDragging) {
            // Drop on cell
            const cellCoords = getCellFromPoint(e.clientX, e.clientY);
            if (cellCoords) {
                const state = useGameStore.getState();
                const { r, c } = cellCoords;
                if (!state.initialBoard[r][c]) {
                    state.selectCell(r, c);
                    state.setCellValue(num);
                }
            }
        } else {
            // Simple tap — place number in selected cell
            playSound('click');
            setCellValue(num);
        }
    }, [isOpponentTurn, removeGhost, getCellFromPoint, playSound, setCellValue]);

    const handlePointerCancel = useCallback(() => {
        removeGhost();
        useGameStore.getState().setHoveredCell(null);
        boardRectRef.current = null;
        dragNumRef.current = null;
        isDraggingRef.current = false;
        startPosRef.current = null;
    }, [removeGhost]);

    // Cleanup ghost on unmount
    useEffect(() => {
        return () => {
            if (ghostRef.current) {
                ghostRef.current.remove();
            }
        };
    }, []);

    return (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full touch-none max-w-sm mx-auto px-1">
            {numbers.map((num) => (
                <motion.div
                    key={num}
                    whileHover={{ scale: isOpponentTurn ? 1 : 1.05 }}
                    whileTap={{ scale: isOpponentTurn ? 1 : 0.95 }}
                    onPointerDown={(e) => handlePointerDown(e, num)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    draggable={false}
                    className={`aspect-[4/3] flex items-center justify-center text-xl sm:text-2xl lg:text-4xl font-semibold text-indigo-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 active:bg-indigo-100 rounded-lg lg:rounded-xl transition-colors duration-150 select-none touch-none ${isOpponentTurn ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                    style={{ touchAction: 'none' } as React.CSSProperties}
                >
                    {num}
                </motion.div>
            ))}
        </div>
    );
});

Numpad.displayName = 'Numpad';
