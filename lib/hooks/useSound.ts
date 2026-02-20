"use client";

import { useCallback } from 'react';

export const useSound = () => {
    const playSound = useCallback((type: 'correct' | 'wrong' | 'click' | 'win') => {
        // Simple synthetic sounds using Web Audio API to avoid external assets for now
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.connect(gain);
            gain.connect(context.destination);

            const now = context.currentTime;

            if (type === 'correct') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, now);
                oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
            } else if (type === 'wrong') {
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(220, now);
                oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
            } else if (type === 'click') {
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
            } else if (type === 'win') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, now); // C5
                oscillator.frequency.exponentialRampToValueAtTime(1046.50, now + 0.5); // C6
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
            }
        } catch (e) {
            // Silently fail if AudioContext is not supported
        }
    }, []);

    const triggerHaptic = useCallback((type: 'success' | 'error' | 'medium') => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            if (type === 'success') window.navigator.vibrate(50);
            if (type === 'error') window.navigator.vibrate([50, 50, 50]);
            if (type === 'medium') window.navigator.vibrate(20);
        }
    }, []);

    return { playSound, triggerHaptic };
};
