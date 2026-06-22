import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Header } from './components/layout/Header';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Gallery } from './pages/Gallery';
import { Admin } from './pages/Admin';
import { ProtectedRoute } from './routes/ProtectedRoute';
export function App() {
    return (_jsxs("div", { className: "min-h-screen bg-bg font-sans", children: [_jsx(Header, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/pricing", element: _jsx(Pricing, {}) }), _jsx(Route, { path: "/auth", element: _jsx(Auth, {}) }), _jsx(Route, { path: "/gallery", element: _jsx(ProtectedRoute, { children: _jsx(Gallery, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(Admin, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/billing/success", element: _jsx("div", { className: "min-h-screen bg-bg flex items-center justify-center text-center px-4", children: _jsxs("div", { children: [_jsx("p", { className: "text-5xl mb-4", children: "\uD83C\uDF89" }), _jsx("h1", { className: "font-display text-2xl text-white mb-2", children: "You're upgraded!" }), _jsx("p", { className: "text-text-muted mb-6", children: "Your new plan is active. Enjoy more generations." }), _jsx("a", { href: "/dashboard", className: "px-6 py-3 rounded-xl bg-gradient-accent text-black font-medium hover:opacity-90 transition-opacity", children: "Go to Dashboard" })] }) }) })] }), _jsx(Analytics, {})] }));
}
