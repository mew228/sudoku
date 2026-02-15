'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface DataCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'stable';
    className?: string;
}

export default function DataCard({ title, value, unit, icon: Icon, trend, className = '' }: DataCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, borderColor: 'rgba(0, 240, 255, 0.6)' }}
            className={`relative p-6 rounded-sm bg-lumina-black/40 backdrop-blur-md border border-lumina-platinum/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden group ${className}`}
        >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-lumina-blue opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-lumina-blue opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-lumina-blue opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-lumina-blue opacity-50 group-hover:opacity-100 transition-opacity" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lumina-silver font-tactical tracking-widest text-sm uppercase">{title}</h3>
                {Icon && <Icon className="w-4 h-4 text-lumina-blue opacity-70" />}
            </div>

            {/* Content */}
            <div className="flex items-baseline gap-2">
                <span className="text-4xl text-white font-mono font-bold tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                    {value}
                </span>
                {unit && <span className="text-xs text-lumina-platinum/60 font-mono">{unit}</span>}
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lumina-blue/5 to-transparent h-[200%] w-full animate-scanline pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
}
