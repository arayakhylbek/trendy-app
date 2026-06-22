import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function dataUriToBlob(dataUri) {
    const [header, data] = dataUri.split(',');
    const mime = header?.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(data ?? '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
function getExtension(dataUri) {
    const mime = dataUri.match(/data:(image\/\w+);/)?.[1];
    if (mime === 'image/png')
        return 'png';
    if (mime === 'image/webp')
        return 'webp';
    return 'jpg';
}
export function ResultModal({ imageUrl, templateEmoji, onClose, onNew, onViewGallery }) {
    if (!imageUrl && !templateEmoji)
        return null;
    const isDataUri = imageUrl?.startsWith('data:');
    async function handleShare() {
        if (!imageUrl)
            return;
        try {
            if (isDataUri && navigator.share) {
                const blob = dataUriToBlob(imageUrl);
                const ext = getExtension(imageUrl);
                const file = new File([blob], `trendy.${ext}`, { type: blob.type });
                await navigator.share({ files: [file], title: 'Made with Trendy ✦' });
            }
            else if (navigator.share) {
                await navigator.share({ url: imageUrl, title: 'Made with Trendy ✦' });
            }
            else {
                handleDownload();
            }
        }
        catch {
            handleDownload();
        }
    }
    function handleDownload() {
        if (!imageUrl)
            return;
        const ext = isDataUri ? getExtension(imageUrl) : 'jpg';
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `trendy-result.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    return (_jsx("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4", children: _jsxs("div", { className: "relative w-full max-w-sm bg-surface rounded-2xl border border-surface-border overflow-hidden", children: [_jsxs("div", { className: "relative", style: { aspectRatio: '3/4' }, children: [imageUrl ? (_jsx("img", { src: imageUrl, alt: "Generated result", className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-surface to-surface2", children: templateEmoji })), _jsx("div", { className: "absolute bottom-2 right-2 text-white/50 text-xs font-medium", children: "\u2726 Trendy" })] }), _jsxs("div", { className: "p-4 flex gap-3", children: [_jsx("button", { onClick: handleShare, className: "flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm", children: "Share" }), _jsx("button", { onClick: handleDownload, className: "flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm", children: "\u2193 Save" }), _jsx("button", { onClick: onNew, className: "flex-1 py-2.5 rounded-xl bg-gradient-accent text-black font-medium text-sm hover:opacity-90 transition-opacity", children: "New \u2726" })] }), onViewGallery && (_jsx("div", { className: "px-4 pb-4", children: _jsx("button", { onClick: onViewGallery, className: "w-full py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm", children: "\uD83D\uDDBC View Gallery" }) })), _jsx("button", { onClick: onClose, className: "absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors", children: "\u2715" })] }) }));
}
