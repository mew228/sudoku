import { useGameStore } from "@/lib/store";
import { motion, PanInfo } from "framer-motion";
import { useSound } from "@/lib/hooks/useSound";

export const Numpad = () => {
    const setCellValue = useGameStore(state => state.setCellValue);
    const { playSound } = useSound();
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const handleDragStart = () => {
        // Prevent default touch actions if needed
    };

    // Helper to find the cell under the cursor/finger
    const getCellFromPoint = (x: number, y: number) => {
        // IMPORTANT: document.elementsFromPoint expects VIEWPORT coordinates (clientX/Y)
        // info.point from Framer Motion is often absolute (pageX/Y)
        // We ensure we're using viewport coordinates by subtracting scroll
        const clientX = x - window.scrollX;
        const clientY = y - window.scrollY;

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
    const handleDrag = (_: any, info: PanInfo) => {
        const point = info.point;
        const cell = getCellFromPoint(point.x, point.y);

        const currentHover = useGameStore.getState().hoveredCell;
        if (cell?.r !== currentHover?.r || cell?.c !== currentHover?.c) {
            useGameStore.getState().setHoveredCell(cell);
        }
    };

    const handleDragEnd = (_event: any, info: PanInfo, num: number) => {
        const point = info.point;
        const cellCoords = getCellFromPoint(point.x, point.y);
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.90 }}
                    onClick={() => {
                        playSound('click');
                        setCellValue(num);
                    }}
                    className="aspect-square lg:aspect-[4/3] flex items-center justify-center text-2xl lg:text-4xl font-light text-indigo-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 active:bg-indigo-100 rounded-lg lg:rounded-xl transition-colors duration-75 cursor-grab active:cursor-grabbing touch-none select-none"
                    style={{ touchAction: 'none' }}
                >
                    {num}
                </motion.div>
            ))}
        </div>
    );
};
