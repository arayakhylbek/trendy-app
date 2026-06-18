import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';

export function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <AuthModal onClose={() => navigate('/')} />
    </div>
  );
}
