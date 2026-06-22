import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { compressImage } from '../../lib/compressImage';
export function TemplateModal({ template, onClose, onGenerate }) {
    const [previewSrc, setPreviewSrc] = useState();
    const [compressedBase64, setCompressedBase64] = useState();
    const [hasPhoto, setHasPhoto] = useState(false);
    const fileInputRef = useRef(null);
    if (!template)
        return null;
    function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const src = ev.target?.result;
            setPreviewSrc(src);
            setHasPhoto(true);
            // Compress to max 1024px JPEG before sending to API (keeps payload under 1MB)
            const compressed = await compressImage(src, 1024, 0.85);
            setCompressedBase64(compressed.split(',')[1]);
        };
        reader.readAsDataURL(file);
    }
    function handleGenerate() {
        if (!hasPhoto)
            return;
        onGenerate(template, compressedBase64);
        onClose();
    }
    return (_jsx("div", { className: "fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-sm bg-surface rounded-2xl border border-surface-border p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-white font-display text-lg", children: template.label }), _jsx("p", { className: "text-text-muted text-sm", children: template.style })] }), _jsx("button", { onClick: onClose, className: "text-text-muted hover:text-white transition-colors text-xl", children: "\u2715" })] }), _jsx("div", { className: `
            relative rounded-xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors mb-4
            ${hasPhoto ? 'border-accent' : 'border-surface-border hover:border-white/20'}
          `, style: { aspectRatio: '3/4' }, onClick: () => fileInputRef.current?.click(), children: previewSrc ? (_jsx("img", { src: previewSrc, alt: "Your photo", className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-text-muted gap-2", children: [_jsx("span", { className: "text-4xl", children: "\uD83D\uDCF7" }), _jsx("p", { className: "text-sm", children: "Upload your photo" }), _jsx("span", { className: "text-xs text-text-dim", children: "Tap to choose" })] })) }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleFile }), _jsx("button", { onClick: handleGenerate, disabled: !hasPhoto, className: "w-full py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-accent text-black hover:opacity-90", children: hasPhoto ? 'Generate ✦' : 'Upload a photo first' }), _jsx("p", { className: "text-text-dim text-xs text-center mt-3", children: "~30 seconds \u00B7 uses 1 generation" })] }) }));
}
