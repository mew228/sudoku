import { useGameStore } from "@/lib/store";
import { motion, PanInfo } from "framer-motion";

export const Numpad = () => {
    const setCellValue = useGameStore(state => state.setCellValue);
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const handleDragStart = () => {
        // Prevent default touch actions if needed, though Framer Motion handles most
    };

    // Helper to find the cell under the cursor/finger
    const getCellFromPoint = (x: number, y: number) => {
        // Use elementsFromPoint to find all elements, then find the cell
        // This is more robust than elementFromPoint if the dragged item blocks the cell
        const elements = document.elementsFromPoint(x, y);
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

        // Update hover state in store to show visual feedback
        useGameStore.getState().setHoveredCell(cell);
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, num: number) => {
        const point = info.point;
        const cellCoords = getCellFromPoint(point.x, point.y);
        const state = useGameStore.getState();

        // Clear hover state
        state.setHoveredCell(null);

        if (cellCoords) {
            const { r, c } = cellCoords;
            // Check if cell is editable (not initial)
            if (!state.initialBoard[r][c]) {
                state.selectCell(r, c);
                state.setCellValue(num);
            }
        }
    };

    return (
        <div className="grid grid-cols-3 gap-2 w-full">
            {numbers.map((num) => (
                <motion.div
                    key={num}
                    drag
                    dragSnapToOrigin
                    dragElastic={0.1}
                    dragMomentum={false}
                    whileDrag={{ scale: 1.2, zIndex: 50, cursor: "grabbing" }}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={(e, info) => handleDragEnd(e, info, num)}
                    onPointerDown={() => {
                        // Prevent default touch behaviors that might interfere
                        // but DON'T stop propagation or you kill the drag
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.90 }}
                    onClick={() => setCellValue(num)} // Keep click for accessibility/speed
                    className="aspect-[4/3] flex items-center justify-center text-4xl font-light text-indigo-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 active:bg-indigo-100 rounded-xl transition-colors duration-75 cursor-grab active:cursor-grabbing touch-none select-none"
                    style={{ touchAction: 'none' }} // Hint for touch devices, though HTML5 DnD is desktop focused usually.
                >
                    {num}
                </motion.div>
            ))}
        </div>
    );
};
