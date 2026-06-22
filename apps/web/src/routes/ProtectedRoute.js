import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-bg flex items-center justify-center", children: _jsx("div", { className: "text-text-muted", children: "Loading..." }) }));
    }
    if (!user)
        return _jsx(Navigate, { to: "/auth", replace: true });
    return _jsx(_Fragment, { children: children });
}
