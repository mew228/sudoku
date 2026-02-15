'use client';

import { motion } from 'framer-motion';

const glitchAnimation = {
    hidden: { opacity: 0, x: 0 },
    visible: {
        opacity: [0, 1, 1, 1, 1],
        x: [0, -2, 2, -1, 0],
        textShadow: [
            "0px 0px 0px rgba(0,240,255,0)",
            "-2px 0px 0px rgba(255,0,0,0.5), 2px 0px 0px rgba(0,0,255,0.5)",
            "0px 0px 0px rgba(0,240,255,0)",
            "-1px 0px 0px rgba(255,0,0,0.5), 1px 0px 0px rgba(0,0,255,0.5)",
            "0px 0px 0px rgba(0,240,255,0)"
        ]
    }
};

export default function CinematicEntrance() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center justify-center h-screen text-center pointer-events-none select-none"
        >
            <div className="relative group">
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={glitchAnimation}
                    transition={{
                        duration: 0.2,
                        repeat: 0,
                        repeatDelay: 3,
                        repeatType: "reverse"
                    }}
                    className="text-6xl md:text-9xl font-tactical font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-lumina-platinum to-lumina-silver drop-shadow-[0_0_25px_rgba(0,240,255,0.3)]"
                >
                    LUMINA FLOW
                </motion.h1>
                <div className="absolute inset-0 bg-lumina-blue/10 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="w-64 h-[1px] bg-lumina-blue shadow-[0_0_15px_#00F0FF] my-6"
            />

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-lumina-blue font-mono text-xs md:text-sm tracking-[0.5em] uppercase drop-shadow-md"
            >
                Urban Traffic Digital Twin // v1.0
            </motion.p>
        </motion.div>
    );
}
