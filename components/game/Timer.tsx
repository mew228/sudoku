import { useGameStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export const Timer = () => {
    const timer = useGameStore(state => state.timer);
    const status = useGameStore(state => state.status);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative flex items-center gap-3">
            <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                {status === 'playing' && (
                    <motion.div
                        animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-indigo-400/20"
                    />
                )}
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                    <Clock size={14} className={status === 'playing' ? "text-indigo-600 animate-pulse" : "text-slate-400"} />
                </div>
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold leading-none mb-1">Elapsed</span>
                <motion.span
                    key={timer}
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-2xl font-black text-slate-800 tabular-nums leading-none tracking-tight"
                >
                    {formatTime(timer)}
                </motion.span>
            </div>
        </div>
    );
};
