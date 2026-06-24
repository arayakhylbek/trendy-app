import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryPills } from '../components/templates/CategoryPills';
import { TemplateGrid } from '../components/templates/TemplateGrid';
import { TemplateModal } from '../components/generation/TemplateModal';
import { CatLoadingScreen } from '../components/generation/CatLoadingScreen';
import { ResultModal } from '../components/generation/ResultModal';
import { AuthModal } from '../components/auth/AuthModal';
import { useTemplates } from '../hooks/useTemplates';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../hooks/useAuth';
import { useSaveGeneration } from '../hooks/useGallery';
import { apiFetch, ApiError } from '../lib/api';
import { PLANS } from '@trendy/shared';
import { PricingSection } from '../components/PricingSection';
import { UpgradeModal } from '../components/billing/UpgradeModal';
function scrollToPricing() {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
}
export function Home() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: currentUser, refetch: refetchUser } = useCurrentUser();
    const { data: templates = [], isLoading, error } = useTemplates(activeCategory);
    const saveGen = useSaveGeneration(user?.uid);
    const isOwner = user?.email?.toLowerCase() === 'araiakhylbek78@gmail.com';
    const tier = currentUser?.tier ?? 'free';
    const plan = PLANS[tier];
    const used = currentUser?.generationsUsed ?? 0;
    const atLimit = !isOwner && plan.monthlyLimit !== Infinity && used >= plan.monthlyLimit;
    async function handleGenerate(template, imageBase64, imageBase64_2) {
        if (!user) {
            setShowAuth(true);
            return;
        }
        if (atLimit) {
            scrollToPricing();
            return;
        }
        setIsGenerating(true);
        try {
            const result = await apiFetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: template.prompt,
                    imageBase64,
                    imageBase64_2,
                    templateId: template.id,
                    templateImageSrc: template.image,
                }),
            });
            setResultImage(result.image);
            refetchUser();
            saveGen.mutate({
                imageUrl: result.image,
                templateLabel: template.label,
                templateEmoji: template.emoji,
                createdAt: new Date().toISOString(),
            });
        }
        catch (e) {
            if (e instanceof ApiError && e.status === 429) {
                scrollToPricing();
            }
            else {
                alert(`Generation failed: ${e.message}`);
            }
        }
        finally {
            setIsGenerating(false);
        }
    }
    return (_jsxs(_Fragment, { children: [_jsxs("main", { className: "max-w-6xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsxs("h1", { className: "font-display text-5xl sm:text-6xl font-bold text-white mb-4", children: ["Your photo,", ' ', _jsx("span", { className: "bg-gradient-accent bg-clip-text text-transparent italic", children: "any vibe." })] }), _jsx("p", { className: "text-text-muted text-lg max-w-md mx-auto", children: "Fresh AI-generated templates every day from the latest trends." }), user && (_jsx("button", { onClick: () => navigate('/gallery'), style: {
                                    marginTop: '1.25rem',
                                    padding: '9px 20px',
                                    borderRadius: 20,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: '#1e1e24',
                                    color: '#888',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: '"DM Sans", sans-serif',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    transition: 'border-color .2s, color .2s',
                                }, onMouseEnter: (e) => { e.currentTarget.style.borderColor = '#ff6b9d'; e.currentTarget.style.color = '#ff6b9d'; }, onMouseLeave: (e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }, children: "\uD83D\uDDBC My Gallery" }))] }), _jsx("div", { className: "mb-6", children: _jsx(CategoryPills, { active: activeCategory, onChange: setActiveCategory }) }), isLoading && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", children: Array.from({ length: 8 }).map((_, i) => (_jsx("div", { className: "rounded-2xl bg-surface animate-pulse", style: { aspectRatio: '3/4' } }, i))) })), error && (_jsx("div", { className: "text-center py-20 text-text-muted", children: _jsx("p", { children: "Failed to load templates. Please try again." }) })), !isLoading && !error && (_jsx("div", { id: "section-all", children: _jsx(TemplateGrid, { templates: templates, onSelect: (t) => {
                                if (!user) {
                                    setShowAuth(true);
                                    return;
                                }
                                if (atLimit) {
                                    setShowUpgrade(true);
                                    return;
                                }
                                setSelectedTemplate(t);
                            } }) }))] }), _jsx(PricingSection, { onUpgrade: scrollToPricing, onNeedAuth: () => setShowAuth(true) }), selectedTemplate && (_jsx(TemplateModal, { template: selectedTemplate, onClose: () => setSelectedTemplate(null), onGenerate: (t, img, img2) => {
                    setSelectedTemplate(null);
                    handleGenerate(t, img, img2);
                } })), _jsx(CatLoadingScreen, { visible: isGenerating }), resultImage && (_jsx(ResultModal, { imageUrl: resultImage, onClose: () => setResultImage(null), onNew: () => setResultImage(null), onViewGallery: () => {
                    setResultImage(null);
                    navigate('/gallery');
                } })), showAuth && _jsx(AuthModal, { onClose: () => setShowAuth(false) }), showUpgrade && _jsx(UpgradeModal, { onClose: () => setShowUpgrade(false) })] }));
}
