import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { compressImage } from '../../lib/compressImage';
const EMPTY_SLOT = { previewSrc: undefined, compressedBase64: undefined, ready: false };
export function TemplateModal({ template, onClose, onGenerate }) {
    const [slot1, setSlot1] = useState(EMPTY_SLOT);
    const [slot2, setSlot2] = useState(EMPTY_SLOT);
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    if (!template)
        return null;
    const isCouple = template.isCouple === true;
    const canGenerate = isCouple ? slot1.ready && slot2.ready : slot1.ready;
    async function handleFile(e, slot) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const src = ev.target?.result;
            const compressed = await compressImage(src, 1024, 0.85);
            const base64 = compressed.split(',')[1];
            const update = { previewSrc: src, compressedBase64: base64, ready: true };
            if (slot === 1)
                setSlot1(update);
            else
                setSlot2(update);
        };
        reader.readAsDataURL(file);
    }
    function handleGenerate() {
        if (!canGenerate)
            return;
        onGenerate(template, slot1.compressedBase64, isCouple ? slot2.compressedBase64 : undefined);
        onClose();
    }
    return (_jsx("div", { className: "fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4", onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "w-full max-w-sm bg-surface rounded-2xl border border-surface-border p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-white font-display text-lg", children: template.label }), _jsx("p", { className: "text-text-muted text-sm", children: isCouple ? '💑 Couple · upload 2 photos' : template.style })] }), _jsx("button", { onClick: onClose, className: "text-text-muted hover:text-white transition-colors text-xl", children: "\u2715" })] }), isCouple ? (
                /* Couple mode: two side-by-side slots */
                _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }, children: [_jsx(PhotoUploadSlot, { slot: slot1, label: "Her photo", emoji: "\uD83D\uDC67", onClick: () => ref1.current?.click() }), _jsx(PhotoUploadSlot, { slot: slot2, label: "His photo", emoji: "\uD83D\uDC66", onClick: () => ref2.current?.click() })] })) : (
                /* Solo mode: single large slot */
                _jsx("div", { className: `
              relative rounded-xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors mb-4
              ${slot1.ready ? 'border-accent' : 'border-surface-border hover:border-white/20'}
            `, style: { aspectRatio: '3/4' }, onClick: () => ref1.current?.click(), children: slot1.previewSrc ? (_jsx("img", { src: slot1.previewSrc, alt: "Your photo", className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-text-muted gap-2", children: [_jsx("span", { className: "text-4xl", children: "\uD83D\uDCF7" }), _jsx("p", { className: "text-sm", children: "Upload your photo" }), _jsx("span", { className: "text-xs text-text-dim", children: "Tap to choose" })] })) })), _jsx("input", { ref: ref1, type: "file", accept: "image/*", className: "hidden", onChange: (e) => handleFile(e, 1) }), _jsx("input", { ref: ref2, type: "file", accept: "image/*", className: "hidden", onChange: (e) => handleFile(e, 2) }), _jsx("button", { onClick: handleGenerate, disabled: !canGenerate, className: "w-full py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-accent text-black hover:opacity-90", children: canGenerate
                        ? 'Generate ✦'
                        : isCouple
                            ? slot1.ready ? 'Upload his photo' : 'Upload her photo first'
                            : 'Upload a photo first' }), _jsx("p", { className: "text-text-dim text-xs text-center mt-3", children: isCouple ? '~60 seconds · uses 1 generation' : '~30 seconds · uses 1 generation' })] }) }));
}
function PhotoUploadSlot({ slot, label, emoji, onClick, }) {
    return (_jsxs("div", { onClick: onClick, style: {
            aspectRatio: '3/4',
            borderRadius: 12,
            border: `2px dashed ${slot.ready ? 'rgb(var(--color-accent, 255 107 157))' : 'rgba(255,255,255,0.1)'}`,
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            background: '#16161a',
        }, children: [slot.previewSrc ? (_jsx("img", { src: slot.previewSrc, alt: label, style: { width: '100%', height: '100%', objectFit: 'cover' } })) : (_jsxs("div", { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#666' }, children: [_jsx("span", { style: { fontSize: 28 }, children: emoji }), _jsx("span", { style: { fontSize: 11, textAlign: 'center', lineHeight: 1.3 }, children: label }), _jsx("span", { style: { fontSize: 10, color: '#444' }, children: "Tap to choose" })] })), slot.ready && (_jsx("div", { style: { position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#4ade80' }, children: "\u2713" }))] }));
}
