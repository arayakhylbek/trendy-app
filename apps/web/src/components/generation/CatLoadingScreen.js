import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
const MESSAGES = [
    'Sprinkling some magic...',
    'Mixing your vibe...',
    'Almost there...',
    'Adding finishing touches...',
];
const CAT_EMOJIS = ['🐱', '😺', '😸', '😹', '🐈', '🐾', '😻', '🙀', '😽'];
export function CatLoadingScreen({ visible, onComplete }) {
    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState(MESSAGES[0]);
    const intervalRef = useRef(null);
    useEffect(() => {
        if (!visible) {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
            setProgress(0);
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const cats = [];
        let currentProgress = 0;
        intervalRef.current = setInterval(() => {
            const speed = currentProgress < 70 ? Math.random() * 3 + 1 : Math.random() * 0.3;
            currentProgress = Math.min(currentProgress + speed, 85);
            setProgress(Math.round(currentProgress));
            const msgIdx = Math.floor((currentProgress / 100) * MESSAGES.length);
            setMessage(MESSAGES[Math.min(msgIdx, MESSAGES.length - 1)]);
            if (Math.random() < 0.4) {
                cats.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    emoji: CAT_EMOJIS[Math.floor(Math.random() * CAT_EMOJIS.length)],
                    size: 20 + Math.random() * 28,
                    opacity: 0,
                    born: Date.now(),
                });
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cats.forEach((c) => {
                const age = Date.now() - c.born;
                c.opacity = Math.min(1, age / 400);
                ctx.font = `${c.size}px serif`;
                ctx.globalAlpha = c.opacity * 0.85;
                ctx.fillText(c.emoji, c.x, c.y);
            });
            ctx.globalAlpha = 1;
        }, 80);
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, [visible]);
    useEffect(() => {
        if (progress >= 85 && onComplete) {
            // signal to caller that we're at 85%, waiting for API
        }
    }, [progress, onComplete]);
    if (!visible)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center", children: [_jsx("canvas", { ref: canvasRef, className: "absolute inset-0 pointer-events-none" }), _jsxs("div", { className: "relative z-10 text-center", children: [_jsx("div", { className: "text-6xl mb-6 animate-bounce", children: "\uD83D\uDC31" }), _jsx("p", { className: "text-white text-lg font-medium mb-6", children: message }), _jsxs("div", { className: "w-64 mx-auto", children: [_jsx("div", { className: "h-1.5 bg-surface2 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-accent rounded-full transition-all duration-100", style: { width: `${progress}%` } }) }), _jsxs("p", { className: "text-text-muted text-sm mt-2", children: [progress, "%"] })] })] })] }));
}
