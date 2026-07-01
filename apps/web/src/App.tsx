import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Header } from './components/layout/Header';
import { SidebarProvider } from './contexts/SidebarContext';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Gallery } from './pages/Gallery';
import { Admin } from './pages/Admin';
import { ProtectedRoute } from './routes/ProtectedRoute';

export function App() {
  return (
    <SidebarProvider>
    <div className="min-h-screen bg-bg font-sans">
      <Header />
      <div style={{ height: 88 }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/success"
          element={
            <div className="min-h-screen bg-bg flex items-center justify-center text-center px-4">
              <div>
                <p className="text-5xl mb-4">🎉</p>
                <h1 className="font-display text-2xl text-white mb-2">You&apos;re upgraded!</h1>
                <p className="text-text-muted mb-6">Your new plan is active. Enjoy more generations.</p>
                <a href="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-accent text-black font-medium hover:opacity-90 transition-opacity">
                  Go to Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>
      <Analytics />
    </div>
    </SidebarProvider>
  );
}
