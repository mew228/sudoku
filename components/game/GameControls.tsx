import { useGameStore } from "@/lib/store";
import { Eraser, Pencil, RotateCcw, Lightbulb } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const GameControls = () => {
    const undo = useGameStore(state => state.undo);

    const toggleNotesMode = useGameStore(state => state.toggleNotesMode);
    const isNotesMode = useGameStore(state => state.isNotesMode);
    const setCellValue = useGameStore(state => state.setCellValue);
    const getHint = useGameStore(state => state.getHint);
    const hintsRemaining = useGameStore(state => state.hintsRemaining);



    return (
        <div className="flex justify-between w-full px-2">
            <ControlBtn
                icon={<RotateCcw size={22} />}
                label="Undo"
                onClick={undo}
            />
            <ControlBtn
                icon={<Eraser size={22} />}
                label="Erase"
                onClick={() => setCellValue(0)}
            />
            <ControlBtn
                icon={<Pencil size={22} />}
                label="Notes"
                isActive={isNotesMode}
                onClick={toggleNotesMode}
                badge={isNotesMode ? "ON" : "OFF"}
            />
            <ControlBtn
                icon={<Lightbulb size={22} />}
                label="Hint"
                onClick={getHint}
                badge={`${hintsRemaining}`}
                disabled={hintsRemaining <= 0}
            />
        </div>
    );
};

interface ControlBtnProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
    badge?: string;
    disabled?: boolean;
}

const ControlBtn = ({ icon, label, onClick, isActive, badge, disabled }: ControlBtnProps) => (
    <motion.button
        whileTap={disabled ? {} : { scale: 0.9 }}
        whileHover={disabled ? {} : { scale: 1.05 }}
        onClick={disabled ? undefined : onClick}
        suppressHydrationWarning
        draggable={false}
        className={cn(
            "flex flex-col items-center gap-2 group relative transition-all outline-none",
            disabled
                ? "text-slate-300 cursor-not-allowed opacity-50"
                : isActive ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
        )}
    >
        <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 shadow-sm",
            disabled
                ? "bg-slate-50 border-slate-100 text-slate-300"
                : isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 shadow-lg ring-2 ring-indigo-100 ring-offset-2"
                    : "bg-white border-slate-100 text-slate-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        )}>
            {icon}
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
        {badge && (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                    "absolute top-0 right-0 -mr-1 -mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white",
                    disabled ? "bg-slate-300 text-white" : isActive ? "bg-white text-indigo-600" : "bg-slate-800 text-white"
                )}
            >
                {badge}
            </motion.div>
        )}
    </motion.button>
);
