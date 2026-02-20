import { useGameStore } from '@/lib/store';
import { motion } from 'framer-motion';

export const Timer = () => {
    // Timer component is now purely for display.
    const timer = useGameStore(state => state.timer);
    const status = useGameStore(state => state.status);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            animate={status === 'playing' ? {
                scale: [1, 1.02, 1],
                opacity: [0.8, 1, 0.8]
            } : {}}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className="font-mono text-xl font-bold text-slate-700 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-100 shadow-inner"
        >
            {formatTime(timer)}
        </motion.div>
    );
};
