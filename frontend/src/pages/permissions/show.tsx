import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { ArrowLeft, Edit3, KeyRound, Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionDetail {
    id: number;
    name: string;
    display_name: string;
    description: string;
    module: string;
    created_at: string;
    updated_at: string;
}

export default function PermissionShowPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [permission, setPermission] = useState<PermissionDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPermission = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/permissions/${id}`);
            if (res.data?.data) {
                setPermission(res.data.data);
            }
        } catch {
            toast.error('Gagal memuat detail permission');
            navigate('/permissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPermission();
        }
    }, [id]);

    const breadcrumbs = [
        { title: 'Hak Akses', href: '/permissions' },
        { title: permission?.display_name || permission?.name || 'Detail Hak Akses' },
    ];

    if (loading || !permission) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="py-16 text-center text-sm text-neutral-500">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data hak akses...
                </div>
            </AppLayout>
        );
    }

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
                                onClick={() => navigate('/permissions')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-none"
                                title="Kembali ke Daftar Permission"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <KeyRound className="h-5 w-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
                                <div>
                                    <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        {permission.display_name || permission.name}
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Code: {permission.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission={['permission.edit', 'permissions.edit']}>
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/permissions/${permission.id}/edit`)}
                                    className="h-8 rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-3 gap-1.5 shadow-none"
                                >
                                    <Edit3 className="size-3.5" />
                                    Edit Permission
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* ─── Card Body: Information Grid ────────────────────────── */}
                    <div className="p-6 space-y-6">

                        {/* Section 1: Ringkasan Utama */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-none">
                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Nama Izin Akses
                                </div>
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                    {permission.display_name || permission.name}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Identifier Sistem (Slug Code)
                                </div>
                                <div className="font-mono font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                                    {permission.name}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Kategori Modul
                                </div>
                                <div className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                                    <Layers className="size-3.5 text-neutral-500" />
                                    {permission.module || 'Umum'}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Deskripsi & Metadata */}
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden text-sm">
                            <div className="p-4 space-y-1 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    Deskripsi Kegunaan Izin
                                </div>
                                <div className="text-neutral-800 dark:text-neutral-200 text-sm">
                                    {permission.description || <span className="text-neutral-400 italic">Tidak ada deskripsi rinci untuk hak akses ini.</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800">
                                <div className="p-4 space-y-1">
                                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Waktu Ditambahkan
                                    </div>
                                    <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        {permission.created_at ? new Date(permission.created_at).toLocaleString('id-ID') : '-'}
                                    </div>
                                </div>
                                <div className="p-4 space-y-1">
                                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Pembaruan Terakhir
                                    </div>
                                    <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        {permission.updated_at ? new Date(permission.updated_at).toLocaleString('id-ID') : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
