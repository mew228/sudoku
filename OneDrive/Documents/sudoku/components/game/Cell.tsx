import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

interface CellProps {
    r: number;
    c: number;
    val: number;
    initial: boolean;
}

export const Cell = memo(({ r, c, val, initial }: CellProps) => {
    const [isDragOver, setIsDragOver] = useState(false);

    // Optimizing selectors to avoid re-renders on timer tick
    const isSelected = useGameStore(useShallow(state => state.selectedCell?.r === r && state.selectedCell?.c === c));

    // Check for related cells (same row, col, or box)
    const isRelated = useGameStore(useShallow(state => {
        const s = state.selectedCell;
        if (!s) return false;
        if (s.r === r || s.c === c) return true;
        if (Math.floor(s.r / 3) === Math.floor(r / 3) && Math.floor(s.c / 3) === Math.floor(c / 3)) return true;
        return false;
    }));

    const isSameValue = useGameStore(useShallow(state => {
        const s = state.selectedCell;
        if (!s) return false;
        const sVal = state.board[s.r][s.c];
        return sVal !== 0 && sVal === val;
    }));

    const isError = useGameStore(state => !initial && val !== 0 && val !== state.solvedBoard[r][c]);

    // Hint glow — true when this cell was just revealed by a hint
    const isHinted = useGameStore(state => state.lastHint?.r === r && state.lastHint?.c === c);

    // Notes logic - purely selector based
    const cellNotes = useGameStore(useShallow(state => {
        if (val !== 0) return [];
        const notes = [];
        for (let n = 1; n <= 9; n++) {
            if (state.notes.has(`${r},${c},${n}`)) notes.push(n);
        }
        return notes;
    }));

    const selectCell = useGameStore(state => state.selectCell);

    // We need setCellValue here for drag and drop interactions
    // Since we can't easily modify the store action signature without broader refactoring,
    // we'll rely on selecting the cell first, then setting the value.
    const setCellValue = useGameStore(state => state.setCellValue);

    const handleClick = () => selectCell(r, c);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (!initial) { // Only allow drop on non-initial cells
            setIsDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (initial) return; // Cannot modify initial cells

        const numStr = e.dataTransfer.getData("text/plain");
        const num = parseInt(numStr, 10);

        if (!isNaN(num) && num >= 0 && num <= 9) { // Allow 0 for Eraser
            // Select this cell first
            useGameStore.getState().selectCell(r, c);
            // Then set the value (synchronously updates based on selected cell)
            useGameStore.getState().setCellValue(num);
        }
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative flex items-center justify-center w-full h-full cursor-pointer transition-colors duration-200",
                "text-2xl sm:text-3xl font-light select-none",
                // Base Border
                "border-[0.5px] border-slate-300",

                // Thick 3x3 Borders
                // Right border for columns 2 and 5 (0-indexed indices 2 and 5)
                (c === 2 || c === 5) && "!border-r-2 !border-r-slate-800",
                // Bottom border for rows 2 and 5
                (r === 2 || r === 5) && "!border-b-2 !border-b-slate-800",

                // Remove outer borders (handled by board container)
                c === 8 && "border-r-0",
                r === 8 && "border-b-0",

                // Backgrounds & Text Colors
                isError
                    ? (isSelected ? "bg-red-600 text-white" : "bg-red-100 text-red-600")
                    : isSelected
                        ? "bg-indigo-600 text-white"
                        : isDragOver
                            ? "bg-indigo-200 ring-2 ring-inset ring-indigo-500 z-20"
                            : isSameValue
                                ? "bg-indigo-100 text-indigo-900"
                                : isRelated
                                    ? "bg-slate-100"
                                    : "bg-white hover:bg-slate-50",

                // Hint Golden Glow (layered on top)
                isHinted && !isSelected && !isError && "ring-2 ring-amber-400 bg-amber-50 z-20",

                // Dynamic Borders (Override structural borders)
                isSelected && !isError && "!border-indigo-600 z-10",
                isSelected && isError && "!border-red-600 z-10",
                !isSelected && isError && "!border-red-200",

                // Construct Structural Borders (Thick 3x3)
                // We leave the base structural borders at the top of the class list (lower priority in cascade if we use !important elsewhere,
                // but here we rely on order or !important. The dynamic borders above use ! so they should win).

                // Text Color Overrides
                initial && !isSelected && "text-slate-900 font-medium",

            )}
        >
            {val !== 0 ? (
                <motion.span
                    // Add a nice "pop" effect when value changes via drop
                    key={val}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn("z-10", isError && "animate-shake")}
                >
                    {val}
                </motion.span>
            ) : (
                <div className="grid grid-cols-3 w-full h-full p-0.5 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <div key={n} className="flex items-center justify-center">
                            {cellNotes.includes(n) && (
                                <span className="text-[9px] text-slate-500 font-medium leading-none">
                                    {n}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

Cell.displayName = 'Cell';
