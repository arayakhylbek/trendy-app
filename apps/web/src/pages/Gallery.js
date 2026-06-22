import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGallery, useDeleteGeneration } from '../hooks/useGallery';
export function Gallery() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: items = [], isLoading } = useGallery(user?.uid);
    const deleteMut = useDeleteGeneration(user?.uid);
    const [preview, setPreview] = useState(null);
    if (!user) {
        navigate('/auth');
        return null;
    }
    function download(item) {
        const a = document.createElement('a');
        a.href = item.imageBase64;
        a.download = `trendy-${item.templateLabel.replace(/\s+/g, '-').toLowerCase()}.jpg`;
        a.click();
    }
    function handleDelete(id) {
        deleteMut.mutate(id);
        if (preview?.id === id)
            setPreview(null);
    }
    return (_jsxs("div", { className: "min-h-screen bg-bg", children: [_jsxs("main", { className: "max-w-5xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("h1", { style: {
                                    fontFamily: '"Playfair Display", serif',
                                    fontSize: 28, fontWeight: 700, color: '#fff',
                                }, children: ["Your", ' ', _jsx("em", { style: {
                                            fontStyle: 'italic',
                                            background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }, children: "gallery" })] }), _jsx("button", { onClick: () => navigate('/'), style: {
                                    padding: '8px 18px', borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: '#1e1e24', color: '#888',
                                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                    fontFamily: '"DM Sans", sans-serif',
                                }, children: "\u2190 Back" })] }), isLoading && (_jsx("div", { style: { textAlign: 'center', padding: '5rem', color: '#888', fontSize: 14 }, children: "Loading your creations\u2026" })), !isLoading && items.length === 0 && (_jsxs("div", { style: { textAlign: 'center', padding: '5rem 1rem', color: '#888' }, children: [_jsx("div", { style: { fontSize: '3.5rem', marginBottom: '1rem' }, children: "\uD83E\uDE84" }), _jsx("p", { style: { fontSize: 16, marginBottom: '1.5rem' }, children: "Your gallery is empty \u2014 go create something!" }), _jsx("button", { onClick: () => navigate('/'), style: {
                                    padding: '12px 28px', borderRadius: 14, border: 'none',
                                    background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
                                    color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                    fontFamily: '"DM Sans", sans-serif',
                                }, children: "Browse Templates \u2726" })] })), !isLoading && items.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("p", { style: { fontSize: 13, color: '#555', marginBottom: '1.5rem' }, children: [items.length, " creation", items.length !== 1 ? 's' : ''] }), _jsx("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: 16,
                                }, children: items.map((item) => (_jsx(GalleryCard, { item: item, onPreview: () => setPreview(item), onDownload: () => download(item), onDelete: () => handleDelete(item.id), deleting: deleteMut.isPending && deleteMut.variables === item.id }, item.id))) })] }))] }), preview && (_jsxs("div", { onClick: () => setPreview(null), style: {
                    position: 'fixed', inset: 0, zIndex: 700,
                    background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(8px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '1.5rem', gap: 20,
                }, children: [_jsx("img", { src: preview.imageBase64, alt: preview.templateLabel, onClick: (e) => e.stopPropagation(), style: {
                            maxWidth: '88vw', maxHeight: '72vh',
                            borderRadius: 20, objectFit: 'contain',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                        } }), _jsxs("div", { style: { display: 'flex', gap: 12 }, onClick: (e) => e.stopPropagation(), children: [_jsx("button", { onClick: () => download(preview), style: {
                                    padding: '11px 22px', borderRadius: 12, border: 'none',
                                    background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
                                    color: '#fff', fontSize: 14, fontWeight: 500,
                                    cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                                }, children: "\u2193 Download" }), _jsx("button", { onClick: () => handleDelete(preview.id), style: {
                                    padding: '11px 22px', borderRadius: 12,
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    background: 'rgba(239,68,68,0.08)',
                                    color: '#ef4444', fontSize: 14, fontWeight: 500,
                                    cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                                }, children: "Delete" }), _jsx("button", { onClick: () => setPreview(null), style: {
                                    padding: '11px 22px', borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: '#1e1e24',
                                    color: '#888', fontSize: 14, fontWeight: 500,
                                    cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                                }, children: "Close" })] }), _jsxs("p", { style: { fontSize: 12, color: '#444', marginTop: 4 }, children: [preview.templateEmoji, " ", preview.templateLabel, " \u00B7", ' ', new Date(preview.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })] })] }))] }));
}
function GalleryCard({ item, onPreview, onDownload, onDelete, deleting, }) {
    const [hovered, setHovered] = useState(false);
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
    });
    return (_jsxs("div", { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), style: {
            background: '#16161a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            transition: 'transform .2s, box-shadow .2s',
            transform: hovered ? 'translateY(-4px)' : 'none',
            boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5)' : 'none',
        }, children: [_jsxs("div", { onClick: onPreview, style: { position: 'relative', aspectRatio: '3/4', overflow: 'hidden', cursor: 'pointer' }, children: [_jsx("img", { src: item.imageBase64, alt: item.templateLabel, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }), hovered && (_jsx("div", { style: {
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
                            display: 'flex', alignItems: 'flex-end', padding: 10,
                        }, children: _jsx("span", { style: { color: '#fff', fontSize: 12 }, children: "\uD83D\uDD0D Preview" }) }))] }), _jsxs("div", { style: { padding: '8px 10px 4px' }, children: [_jsxs("div", { style: {
                            fontSize: 12, fontWeight: 500, color: '#f0f0f5',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }, children: [item.templateEmoji, " ", item.templateLabel] }), _jsx("div", { style: { fontSize: 11, color: '#444', marginTop: 2 }, children: date })] }), _jsxs("div", { style: { display: 'flex', gap: 6, padding: '6px 10px 10px' }, children: [_jsx(CardBtn, { onClick: onDownload, style: { flex: 1 }, children: "\u2193 Save" }), _jsx(CardBtn, { onClick: onDelete, disabled: deleting, danger: true, style: { flex: '0 0 36px' }, children: deleting ? '…' : '✕' })] })] }));
}
function CardBtn({ children, onClick, style: extra = {}, danger, disabled, }) {
    const [hovered, setHovered] = useState(false);
    return (_jsx("button", { onClick: onClick, disabled: disabled, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), style: {
            padding: '6px 8px', borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(255,255,255,0.08)',
            background: hovered ? (danger ? 'rgba(239,68,68,0.12)' : '#252530') : '#1e1e24',
            color: hovered ? (danger ? '#ef4444' : '#f0f0f5') : '#666',
            fontSize: 12, fontWeight: 500,
            fontFamily: '"DM Sans", sans-serif',
            transition: 'all .15s', opacity: disabled ? 0.5 : 1,
            textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...extra,
        }, children: children }));
}
