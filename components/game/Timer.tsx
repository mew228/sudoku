import { useGameStore } from '@/lib/store';

export const Timer = () => {
    // Timer component is now purely for display.
    // The actual interval logic is handled in the main page to avoid duplication.
    const timer = useGameStore(state => state.timer);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="font-mono text-xl font-medium text-slate-700 dark:text-slate-300">
            {formatTime(timer)}
        </div>
    );
};
