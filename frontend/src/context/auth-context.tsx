import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/client';

export interface UserProfile {
    id: number;
    nip: string;
    name: string;
    role?: {
        id: number;
        name: string;
        display_name: string;
        permissions?: Array<{ id: number; name: string; display_name: string }>;
    };
    department_id?: number;
    department?: {
        id: number;
        code: string;
        name: string;
    };
    is_aktif?: boolean;
}

export function parseJwt(token: string): any {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: UserProfile) => void;
    logout: () => void;
    hasPermission: (permissionName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(() => {
        try {
            const saved = localStorage.getItem('user');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && (parsed.name || parsed.nip)) {
                    return parsed;
                }
            }
            const savedToken = localStorage.getItem('token');
            if (savedToken) {
                const claims = parseJwt(savedToken);
                if (claims && (claims.name || claims.nip)) {
                    return {
                        id: claims.user_id || 1,
                        nip: claims.nip || '',
                        name: claims.name || '',
                        role: {
                            id: 1,
                            name: claims.role || 'admin',
                            display_name: claims.role === 'admin' ? 'Administrator' : claims.role,
                        },
                    };
                }
            }
        } catch {
            // ignore
        }
        return null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchMe = async () => {
            const savedToken = localStorage.getItem('token');
            if (savedToken) {
                try {
                    const res = await api.get('/auth/me');
                    if (res.data?.data) {
                        setUser(res.data.data);
                        localStorage.setItem('user', JSON.stringify(res.data.data));
                    }
                } catch (err: any) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                        setToken(null);
                    }
                }
            }
            setIsLoading(false);
        };

        fetchMe();
    }, []);

    const login = (newToken: string, newUser: UserProfile) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    };

    const hasPermission = (permissionName: string): boolean => {
        if (!user || !user.role) return false;
        if (user.role.name === 'admin' || user.role.name === 'superadmin') return true;
        return user.role.permissions?.some((p) => p.name === permissionName) ?? false;
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
