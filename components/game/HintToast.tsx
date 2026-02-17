'use client';

import { useGameStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const HintToast = () => {
    const lastHint = useGameStore(state => state.lastHint);

    return (
        <AnimatePresence>
            {lastHint && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90vw]"
                >
                    <div className="bg-white border border-amber-200 rounded-2xl shadow-lg shadow-amber-100/50 px-5 py-3.5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">
                                {lastHint.strategy === 'naked_single' ? 'Naked Single' : lastHint.strategy === 'hidden_single' ? 'Hidden Single' : 'Hint'}
                            </p>
                            <p className="text-sm text-slate-700 leading-snug">
                                {lastHint.reason}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
