import { useGameStore } from "@/lib/store";
import { motion, PanInfo } from "framer-motion";
import { useSound } from "@/lib/hooks/useSound";

export const Numpad = () => {
    const { setCellValue, mode, uid, currentTurn } = useGameStore();
    const isOpponentTurn = mode === 'pvp' && currentTurn !== null && uid !== currentTurn;
    const { playSound } = useSound();
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const handleDragStart = (e: any) => {
        if (isOpponentTurn) {
            e.preventDefault();
            return;
        }
    };

    // Helper to find the cell under the cursor/finger using native event
    const getCellFromEvent = (e: MouseEvent | TouchEvent | PointerEvent) => {
        let clientX = 0;
        let clientY = 0;

        if ('changedTouches' in e && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        } else {
            return null; // Fallback
        }

        const elements = document.elementsFromPoint(clientX, clientY);
        for (const element of elements) {
            const cell = element.closest('[data-cell-row]');
            if (cell) {
                const r = parseInt(cell.getAttribute('data-cell-row') || '-1');
                const c = parseInt(cell.getAttribute('data-cell-col') || '-1');
                if (r !== -1 && c !== -1) return { r, c };
            }
        }
        return null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDrag = (e: any, info: PanInfo) => {
        if (isOpponentTurn) return;

        const cell = getCellFromEvent(e);

        const currentHover = useGameStore.getState().hoveredCell;
        if (cell?.r !== currentHover?.r || cell?.c !== currentHover?.c) {
            useGameStore.getState().setHoveredCell(cell);
        }
    };

    const handleDragEnd = (e: any, info: PanInfo, num: number) => {
        if (isOpponentTurn) return;

        const cellCoords = getCellFromEvent(e);
        const state = useGameStore.getState();

        // Clear hover state
        state.setHoveredCell(null);

        if (cellCoords) {
            const { r, c } = cellCoords;
            if (!state.initialBoard[r][c]) {
                state.selectCell(r, c);
                state.setCellValue(num);
            }
        }
    };

    return (
        <div className="grid grid-cols-9 lg:grid-cols-3 gap-1 lg:gap-2 w-full touch-none">
            {numbers.map((num) => (
                <motion.div
                    key={num}
                    drag
                    dragSnapToOrigin
                    dragElastic={0.1}
                    dragMomentum={false}
                    whileDrag={{
                        scale: 1.2,
                        zIndex: 100,
                        cursor: "grabbing",
                        opacity: 0.8 // See through the number to the cell
                    }}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={(e, info) => handleDragEnd(e, info, num)}
                    onPointerDown={(e) => {
                        // Prevent default touch behaviors that might interfere
                        // e.preventDefault(); // Commented out to see if it allows better selection
                    }}
                    whileHover={{ scale: isOpponentTurn ? 1 : 1.05 }}
                    whileTap={{ scale: isOpponentTurn ? 1 : 0.90 }}
                    onClick={() => {
                        if (isOpponentTurn) return;
                        playSound('click');
                        setCellValue(num);
                    }}
                    className={`aspect-square lg:aspect-[4/3] flex items-center justify-center text-2xl lg:text-4xl font-light text-indigo-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 active:bg-indigo-100 rounded-lg lg:rounded-xl transition-all duration-300 select-none touch-none ${isOpponentTurn ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                    style={{ touchAction: 'none' }}
                >
                    {num}
                </motion.div>
            ))}
        </div>
    );
};
