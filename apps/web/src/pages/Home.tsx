import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryPills } from '../components/templates/CategoryPills';
import { TemplateGrid } from '../components/templates/TemplateGrid';
import { TemplateModal } from '../components/generation/TemplateModal';
import { CatLoadingScreen } from '../components/generation/CatLoadingScreen';
import { ResultModal } from '../components/generation/ResultModal';
import { UpgradeModal } from '../components/billing/UpgradeModal';
import { AuthModal } from '../components/auth/AuthModal';
import { useTemplates } from '../hooks/useTemplates';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../hooks/useAuth';
import { apiFetch, ApiError } from '../lib/api';
import { PLANS } from '@trendy/shared';
import type { Template } from '@trendy/shared';

export function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const { user } = useAuth();
  const { data: currentUser, refetch: refetchUser } = useCurrentUser();
  const { data: templates = [], isLoading, error } = useTemplates(activeCategory);
  const navigate = useNavigate();

  const tier = currentUser?.tier ?? 'free';
  const plan = PLANS[tier];
  const used = currentUser?.generationsUsed ?? 0;
  const atLimit = plan.monthlyLimit !== Infinity && used >= plan.monthlyLimit;

  async function handleGenerate(template: Template, imageBase64: string | undefined) {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (atLimit) {
      setShowUpgrade(true);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiFetch<{ image: string }>('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: template.prompt, imageBase64 }),
      });
      setResultImage(result.image);
      refetchUser();
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setShowUpgrade(true);
      } else {
        alert(`Generation failed: ${(e as Error).message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-4">
            Your photo,{' '}
            <span className="bg-gradient-accent bg-clip-text text-transparent italic">any vibe.</span>
          </h1>
          <p className="text-text-muted text-lg max-w-md mx-auto">
            Fresh AI-generated templates every day from the latest trends.
          </p>
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
          <TemplateGrid
            templates={templates}
            onSelect={(t) => {
              setSelectedTemplate(t);
            }}
          />
        )}
      </main>

      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onGenerate={(t, img) => {
            setSelectedTemplate(null);
            handleGenerate(t, img);
          }}
        />
      )}

      <CatLoadingScreen visible={isGenerating} />

      {resultImage && (
        <ResultModal
          imageUrl={resultImage}
          onClose={() => setResultImage(null)}
          onNew={() => setResultImage(null)}
        />
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
