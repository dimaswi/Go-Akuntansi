import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { ArrowLeft, Edit3, KeyRound, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface RoleDetail {
    id: number;
    name: string;
    display_name: string;
    description: string;
    created_at: string;
    updated_at: string;
    permissions?: Array<{
        id: number;
        name: string;
        display_name: string;
        description: string;
        module: string;
    }>;
}

export default function RoleShowPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [role, setRole] = useState<RoleDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRole = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/roles/${id}`);
            if (res.data?.data) {
                setRole(res.data.data);
            }
        } catch {
            toast.error('Gagal memuat detail role');
            navigate('/roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchRole();
        }
    }, [id]);

    const breadcrumbs = [
        { title: 'Role & Peran', href: '/roles' },
        { title: role?.display_name || role?.name || 'Detail Role' },
    ];

    if (loading || !role) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="py-16 text-center text-sm text-neutral-500">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat rincian role pengguna...
                </div>
            </AppLayout>
        );
    }

    // Group permissions by module (deduplicated by id & name)
    const uniquePermissions = (role?.permissions || []).filter(
        (p, idx, self) => idx === self.findIndex((t) => (p.id && t.id === p.id) || t.name === p.name)
    );
    const permsByModule = uniquePermissions.reduce<Record<string, NonNullable<RoleDetail['permissions']>>>((acc, p) => {
        const mod = p.module || 'Umum';
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(p);
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* ─── Unified Card Container: KOTAK (rounded-none border border-neutral-200) ─── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none">

                    {/* ─── Card Header: Kembali + Icon + Title (Left) & Actions (Right) ──────── */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/roles')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-none"
                                title="Kembali ke Daftar Role"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <Shield className="h-5 w-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
                                <div>
                                    <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        Role: {role.display_name || role.name}
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Code: {role.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission={['role.edit', 'roles.edit']}>
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/roles/${role.id}/edit`)}
                                    className="h-8 rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-3 gap-1.5 shadow-none"
                                >
                                    <Edit3 className="size-3.5" />
                                    Edit Role
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* ─── Card Body: Information Grid ────────────────────────── */}
                    <div className="p-6 space-y-6">

                        {/* Section 1: Ringkasan Role */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-none">
                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Nama Tampilan Role
                                </div>
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                    {role.display_name || role.name}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Identifier Sistem (Slug)
                                </div>
                                <div className="font-mono font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                                    {role.name}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Jumlah Hak Akses Terdaftar
                                </div>
                                <div className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                                    <KeyRound className="size-3.5 text-neutral-500" />
                                    {role.permissions ? `${role.permissions.length} Hak Akses` : '0'}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Deskripsi & Metadata */}
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden text-sm">
                            <div className="p-4 space-y-1 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    Deskripsi Fungsi Role
                                </div>
                                <div className="text-neutral-800 dark:text-neutral-200 text-sm">
                                    {role.description || <span className="text-neutral-400 italic">Tidak ada deskripsi role yang ditambahkan.</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800">
                                <div className="p-4 space-y-1">
                                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Waktu Dibuat
                                    </div>
                                    <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        {role.created_at ? new Date(role.created_at).toLocaleString('id-ID') : '-'}
                                    </div>
                                </div>
                                <div className="p-4 space-y-1">
                                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Pembaruan Terakhir
                                    </div>
                                    <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        {role.updated_at ? new Date(role.updated_at).toLocaleString('id-ID') : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Daftar Hak Akses Terkait */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                <div className="flex items-center gap-2">
                                    <KeyRound className="size-4 text-neutral-700 dark:text-neutral-300" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                        Daftar Hak Akses (Permissions) Terkait
                                    </h3>
                                </div>
                                <span className="text-xs text-neutral-500">
                                    {role.permissions ? `${role.permissions.length} Hak Akses` : '0 Hak Akses'}
                                </span>
                            </div>

                            {role.name === 'administrator' ? (
                                <div className="p-4 border border-emerald-300 bg-emerald-50/40 text-emerald-800 text-xs rounded-none">
                                    Role <strong>Administrator</strong> memiliki hak akses penuh tak terbatas (Bypass Superadmin) ke seluruh modul dan menu sistem.
                                </div>
                            ) : !role.permissions || role.permissions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50">
                                    Belum ada hak akses khusus yang ditetapkan pada role ini.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(permsByModule).map(([mod, items]) => (
                                        <div
                                            key={mod}
                                            className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                                                    Modul: {mod}
                                                </div>
                                                <span className="text-[11px] text-neutral-400 font-mono">
                                                    {items.length} izin
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                                {items.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/40 rounded-none text-xs space-y-0.5"
                                                    >
                                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {p.display_name || p.name}
                                                        </div>
                                                        <div className="font-mono text-[11px] text-neutral-500">
                                                            {p.name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
