import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, isTokenValid } from '@/context/auth-context';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { token, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground font-mono">Memverifikasi sesi...</span>
                </div>
            </div>
        );
    }

    if (!token || !user || !isTokenValid(token)) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
