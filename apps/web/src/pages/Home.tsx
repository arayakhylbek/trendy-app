import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryPills } from '../components/templates/CategoryPills';
import { TemplateGrid } from '../components/templates/TemplateGrid';
import { TemplateModal } from '../components/generation/TemplateModal';
import { CatLoadingScreen } from '../components/generation/CatLoadingScreen';
import { ResultModal } from '../components/generation/ResultModal';
import { AuthModal } from '../components/auth/AuthModal';
import { FilterSidebar } from '../components/layout/FilterSidebar';
import { useTemplates } from '../hooks/useTemplates';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../hooks/useAuth';
import { useSaveGeneration } from '../hooks/useGallery';
import { apiFetch, ApiError } from '../lib/api';
import { applyFilter } from '../lib/applyFilter';
import { PLANS } from '@trendy/shared';
import type { Template } from '@trendy/shared';
import { PricingSection } from '../components/PricingSection';
import { UpgradeModal } from '../components/billing/UpgradeModal';

function scrollToPricing() {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
}

export function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentUser, refetch: refetchUser } = useCurrentUser();
  const { data: templates = [], isLoading, error } = useTemplates(activeCategory);

  const saveGen = useSaveGeneration(user?.uid);

  const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];
  const isOwner = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? '');
  const tier = currentUser?.tier ?? 'free';
  const plan = PLANS[tier];
  const used = currentUser?.generationsUsed ?? 0;
  const atLimit = !isOwner && plan.monthlyLimit !== Infinity && used >= plan.monthlyLimit;

  async function handleGenerate(template: Template, imageBase64: string | undefined, imageBase64_2?: string | undefined) {
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
      const result = await apiFetch<{ image: string }>('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: template.prompt,
          imageBase64,
          imageBase64_2,
          templateId: template.id,
          templateImageSrc: template.image,
        }),
      });
      const finalImage = activeFilter
        ? await applyFilter(result.image, activeFilter)
        : result.image;
      setResultImage(finalImage);
      refetchUser();
      saveGen.mutate({
        imageDataUri: result.image,
        templateLabel: template.label,
        templateEmoji: template.emoji,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        scrollToPricing();
      } else {
        alert(`Generation failed: ${(e as Error).message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <FilterSidebar
        templates={templates}
        onSelectTemplate={(t) => {
          if (!user) { setShowAuth(true); return; }
          if (atLimit) { setShowUpgrade(true); return; }
          setSelectedTemplate(t);
        }}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-4">
            Your photo,{' '}
            <span className="bg-gradient-accent bg-clip-text text-transparent italic">any vibe.</span>
          </h1>
          <p className="text-text-muted text-lg max-w-md mx-auto">
            Fresh AI-generated templates every day from the latest trends.
          </p>

          {user && (
            <button
              onClick={() => navigate('/gallery')}
              style={{
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
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff6b9d'; e.currentTarget.style.color = '#ff6b9d'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }}
            >
              🖼 My Gallery
            </button>
          )}
        </div>

        <div className="mb-6">
          <CategoryPills active={activeCategory} onChange={setActiveCategory} />
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface animate-pulse"
                style={{ aspectRatio: '3/4' }}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-text-muted">
            <p>Failed to load templates. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && (
          <div id="section-all">
            <TemplateGrid
              templates={templates}
              onSelect={(t) => {
                if (!user) { setShowAuth(true); return; }
                if (atLimit) { setShowUpgrade(true); return; }
                setSelectedTemplate(t);
              }}
            />
          </div>
        )}
      </main>

      <PricingSection onUpgrade={scrollToPricing} onNeedAuth={() => setShowAuth(true)} />

      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onGenerate={(t, img, img2) => {
            setSelectedTemplate(null);
            handleGenerate(t, img, img2);
          }}
        />
      )}

      <CatLoadingScreen visible={isGenerating} />

      {resultImage && (
        <ResultModal
          imageUrl={resultImage}
          onClose={() => setResultImage(null)}
          onNew={() => setResultImage(null)}
          onViewGallery={() => {
            setResultImage(null);
            navigate('/gallery');
          }}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
