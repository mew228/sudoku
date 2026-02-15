'use client';

import CityTwin from "@/components/CityTwin";
import CinematicEntrance from "@/components/CinematicEntrance";
import DataCard from "@/components/DataCard";
import TacticalOverlay from "@/components/TacticalOverlay";
import TypingText from "@/components/TypingText";
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="relative w-full bg-lumina-black min-h-[200vh]">
      <TacticalOverlay />

      {/* 3D Background - Fixed */}
      <div className="fixed inset-0 z-0">
        <CityTwin />
      </div>

      {/* Section 1: Cinematic Entrance */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <CinematicEntrance />
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-10 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-lumina-blue/60 font-mono">Scroll to Analyze</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-lumina-blue/60 to-transparent animate-pulse" />
        </motion.div>
      </section>

      {/* Section 2: Tactical Feed - LIVE DATA */}
      <section className="relative z-10 h-screen flex items-center justify-center pointer-events-none px-4 md:px-20">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto">
          <div className="col-span-full border-l-2 border-lumina-blue pl-6 mb-12">
            <h2 className="text-lumina-platinum font-tactical text-4xl font-bold tracking-tight">TACTICAL_STREET_FEED</h2>
            <p className="text-lumina-blue/60 font-mono text-sm tracking-widest mt-2 uppercase">Real-time AI telemetry // Node_042</p>
          </div>

          {/* Live Data Cards with Icons */}
          <DataCard
            title="Node Efficiency"
            value="98.2"
            unit="%"
            className="hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          />
          <DataCard
            title="Detection Latency"
            value="14"
            unit="MS"
          />
          <DataCard
            title="AI Confidence"
            value="99.4"
            unit="%"
          />

          <div className="col-span-full mt-12 p-8 bg-lumina-black/60 border border-lumina-platinum/10 backdrop-blur-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-4 h-4 rounded-full bg-lumina-blue animate-ping" />
              <span className="font-mono text-xs text-lumina-blue uppercase tracking-widest">Active Simulation Stream</span>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div className="space-y-1">
                <div className="text-[10px] text-lumina-silver/40 uppercase">V_STREAM_ID</div>
                <div className="text-sm font-mono text-lumina-silver">LMN-X-7729</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-lumina-silver/40 uppercase">RL_AGENT_MODE</div>
                <div className="text-sm font-mono text-lumina-silver">OPTIMIZATION_V4</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-lumina-silver/40 uppercase">GEO_ZONE</div>
                <div className="text-sm font-mono text-lumina-silver">DOWNTOWN_CORE_3</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tactical HUD Elements (Placeholder) - Fixed position */}
      <div className="fixed top-24 left-10 z-20 hidden md:block mix-blend-screen pointer-events-none">
        <div className="text-lumina-blue font-mono text-[10px] uppercase">
          <TypingText
            lines={[
              "SYSTEM_STATUS: ONLINE",
              "LATENCY: 12ms",
              "COORD: 34.0522° N, 118.2437° W",
              "SECURITY: ENCRYPTED"
            ]}
            speed={20}
          />
        </div>
      </div>

      {/* Signal Override Button */}
      <motion.button
        onClick={async () => {
          try {
            // Simple toggle for now, in a real app check current state first
            await fetch('http://localhost:8000/api/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: "RED" })
            });
            // Reset after 5 seconds
            setTimeout(async () => {
              await fetch('http://localhost:8000/api/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: "GREEN" })
              });
            }, 5000);
          } catch (e) {
            console.error("Signal functionality failed", e);
          }
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ margin: "-100px" }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(255, 0, 51, 0.4)" }} // Red glow on hover
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 px-10 py-4 bg-lumina-black/60 backdrop-blur-xl border border-lumina-blue/50 text-lumina-blue font-tactical font-bold tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-all uppercase pointer-events-auto shadow-[0_0_10px_rgba(0,240,255,0.1)] group overflow-hidden cursor-pointer"
      >
        <span className="relative z-10">TRIGGER EMERGENCY STOP</span>
        <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </motion.button>
    </main>
  );
}
