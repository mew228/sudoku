import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { useSound } from '@/lib/hooks/useSound';

interface CellProps {
    r: number;
    c: number;
    val: number;
    initial: boolean;
}

export const Cell = memo(({ r, c, val, initial }: CellProps) => {


    // Consolidate selectors to avoid multiple selector calls per cell
    const cellState = useGameStore(useShallow(state => {
        const s = state.selectedCell;
        const sVal = s ? state.board[s.r][s.c] : 0;

        const isSelected = s?.r === r && s?.c === c;
        const isRelated = s ? (s.r === r || s.c === c || (Math.floor(s.r / 3) === Math.floor(r / 3) && Math.floor(s.c / 3) === Math.floor(c / 3))) : false;
        const isSameValue = sVal !== 0 && sVal === val;

        const isError = !initial && val !== 0 && val !== state.solvedBoard[r][c];
        const isConflict = state.conflicts.has(`${r},${c}`);

        const isHinted = state.lastHint?.r === r && state.lastHint?.c === c;
        const isHovered = state.hoveredCell?.r === r && state.hoveredCell?.c === c;

        const isOpponentHovered = state.opponentHoveredCells.some(cell => cell.r === r && cell.c === c);
        const cellOwnerUid = state.cellOwners[`${r},${c}`];
        const isOpponentCell = cellOwnerUid && state.uid && cellOwnerUid !== state.uid;

        // Notes logic
        const notes = [];
        if (val === 0) {
            for (let n = 1; n <= 9; n++) {
                if (state.notes.has(`${r},${c},${n}`)) notes.push(n);
            }
        }

        return {
            isSelected,
            isRelated,
            isSameValue,
            isError,
            isConflict,
            isHinted,
            isOpponentCell,
            cellNotes: notes
        };
    }));

    const {
        isSelected,
        isRelated,
        isSameValue,
        isError,
        isConflict,
        isHinted,
        isOpponentCell,
        cellNotes
    } = cellState;

    const selectCell = useGameStore(state => state.selectCell);
    const { playSound } = useSound();

    const handleClick = () => {
        playSound('click');
        selectCell(r, c);
    };

    // Subscribing to board value changes for sound feedback
    useEffect(() => {
        if (val === 0 || initial) return;

        const solvedVal = useGameStore.getState().solvedBoard[r][c];
        if (val === solvedVal) {
            playSound('correct');
        } else {
            playSound('wrong');
            if (typeof window !== 'undefined' && window.navigator.vibrate) {
                window.navigator.vibrate([50, 50, 50]);
            }
        }
    }, [val, r, c, initial, playSound]);

    // HTML5 DnD handlers removed in favor of Framer Motion gesture handling in Numpad.tsx





    return (
        <div
            onClick={handleClick}
            data-cell-row={r}
            data-cell-col={c}
            // onDragOver={handleDragOver} // Removed
            // onDragLeave={handleDragLeave} // Removed
            // onDrop={handleDrop} // Removed
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
                        : isConflict
                            ? "bg-orange-100 text-orange-600 font-bold"
                            : isSameValue
                                ? "bg-indigo-100/80 text-indigo-900 font-medium"
                                : isRelated
                                    ? "bg-slate-100/50"
                                    : "bg-white hover:bg-slate-50",

                // Hint Golden Glow (layered on top)
                isHinted && !isSelected && !isError && "ring-2 ring-amber-400 bg-amber-50 z-20",

                // Dynamic Borders (Override structural borders)
                isSelected && !isError && "!border-indigo-600 z-10",
                isSelected && isError && "!border-red-600 z-10",
                !isSelected && isError && "!border-red-200",


                // Text Color Overrides
                initial && !isSelected && "text-slate-900 font-medium",

            )}
        >
            {/* Biometric Scan Animation for Hints */}
            {isHinted && (
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-sm ring-2 ring-amber-400">
                    <motion.div
                        initial={{ top: "-10%" }}
                        animate={{ top: "110%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]"
                    />
                    <motion.div
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="absolute inset-0 bg-amber-400"
                    />
                </div>
            )}
            {val !== 0 ? (
                <motion.span
                    // Add a nice "pop" effect when value changes via drop
                    key={val}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                        "z-10",
                        isError && "animate-shake",
                        !initial && !isError && (isOpponentCell ? "text-rose-500" : "text-indigo-600"),
                        initial && "text-slate-900 font-medium",
                    )}
                >
                    {val}
                </motion.span>
            ) : (
                <div className="grid grid-cols-3 w-full h-full p-0.5 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <div key={n} className="flex items-center justify-center">
                            {cellNotes.includes(n) && (
                                <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-none">
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
