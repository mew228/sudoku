'use client';

import { useState, useEffect } from 'react';

interface TypingTextProps {
    lines: string[];
    speed?: number;
    className?: string;
    repeat?: boolean;
}

export default function TypingText({ lines, speed = 30, className = '', repeat = false }: TypingTextProps) {
    const [displayedText, setDisplayedText] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        // Reset if repeat is true and we finished (logic simplified for now to just run once)
        if (currentLineIndex >= lines.length) return;

        const interval = setInterval(() => {
            const currentLine = lines[currentLineIndex];

            if (charIndex < currentLine.length) {
                setDisplayedText(prev => {
                    const newLines = [...prev];
                    if (!newLines[currentLineIndex]) newLines[currentLineIndex] = '';
                    newLines[currentLineIndex] = currentLine.slice(0, charIndex + 1); // safe slice
                    return newLines;
                });
                setCharIndex(prev => prev + 1);
            } else {
                clearInterval(interval);
                const timeout = setTimeout(() => {
                    setCurrentLineIndex(prev => prev + 1);
                    setCharIndex(0);
                }, 300); // Pause between lines
                return () => clearTimeout(timeout);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [charIndex, currentLineIndex, lines, speed]);

    return (
        <div className={`font-mono whitespace-pre-line ${className}`}>
            {displayedText.map((line, i) => (
                <div key={i}>{line}</div>
            ))}
            {currentLineIndex < lines.length && <span className="animate-pulse inline-block w-2 bg-lumina-blue h-3 align-middle ml-1"></span>}
        </div>
    );
}
