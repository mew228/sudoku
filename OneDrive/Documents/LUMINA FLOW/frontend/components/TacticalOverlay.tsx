'use client';

import { motion } from 'framer-motion';

export default function TacticalOverlay() {
    return (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden mix-blend-screen">
            {/* Corner Brackets */}
            <svg className="absolute top-0 left-0 w-32 h-32 text-lumina-blue opacity-50" viewBox="0 0 100 100">
                <path d="M 10 10 L 40 10 M 10 10 L 10 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <svg className="absolute top-0 right-0 w-32 h-32 text-lumina-blue opacity-50" viewBox="0 0 100 100">
                <path d="M 90 10 L 60 10 M 90 10 L 90 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-32 h-32 text-lumina-blue opacity-50" viewBox="0 0 100 100">
                <path d="M 10 90 L 40 90 M 10 90 L 10 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <svg className="absolute bottom-0 right-0 w-32 h-32 text-lumina-blue opacity-50" viewBox="0 0 100 100">
                <path d="M 90 90 L 60 90 M 90 90 L 90 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Central Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-lumina-blue/5 rounded-full flex items-center justify-center opacity-30">
                <div className="w-[480px] h-[480px] border border-lumina-blue/10 rounded-full animate-spin-slow" />
                <div className="absolute w-2 h-2 bg-lumina-blue rounded-full" />
                <div className="absolute w-full h-[1px] bg-lumina-blue/20" />
                <div className="absolute h-full w-[1px] bg-lumina-blue/20" />
            </div>

            {/* Animated Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />

            {/* Footer System Lines */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-lumina-blue/50 to-transparent" />

        </div>
    );
}
