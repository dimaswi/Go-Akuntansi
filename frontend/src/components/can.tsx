import React from 'react';
import { useAuth } from '@/context/auth-context';

interface CanProps {
    /** Nama permission. Jika array, cukup salah satu yang dimiliki (any-of). */
    permission: string | string[];
    /** Ditampilkan jika tidak punya akses. Default: tidak menampilkan apa pun. */
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/** Render children hanya jika user memiliki permission. Admin/superadmin selalu lolos. */
export const Can: React.FC<CanProps> = ({ permission, fallback = null, children }) => {
    const { hasPermission } = useAuth();
    const perms = Array.isArray(permission) ? permission : [permission];
    return <>{perms.some((p) => hasPermission(p)) ? children : fallback}</>;
};

export default Can;

