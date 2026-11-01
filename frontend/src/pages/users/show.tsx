import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { ArrowLeft, Building2, Calendar, CheckCircle2, Edit3, RefreshCw, Shield, User, Users } from 'lucide-react';
import { toast } from 'sonner';

interface UserDetail {
    id: number;
    name: string;
    nip: string;
    role_id: number;
    department_id: number;
    department?: {
        id: number;
        code: string;
        name: string;
    };
    created_at: string;
    updated_at: string;
    role?: {
        id: number;
        name: string;
        display_name: string;
        description: string;
        permissions?: Array<{ id: number; name: string; display_name: string; module: string }>;
    };
}

export default function UserShowPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/${id}`);
            if (res.data?.data) {
                setUser(res.data.data);
            }
        } catch {
            toast.error('Gagal memuat detail pengguna');
            navigate('/users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    const breadcrumbs = [
        { title: 'User Pegawai', href: '/users' },
        { title: user?.name || 'Detail Pegawai' },
    ];

    if (loading || !user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="py-16 text-center text-sm text-neutral-500">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data rincian pegawai...
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
                                onClick={() => navigate('/users')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-none"
                                title="Kembali ke Daftar User"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <Users className="h-5 w-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
                                <div>
                                    <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        {user.name}
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        NIP: {user.nip}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission={['user.edit', 'users.edit']}>
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/users/${user.id}/edit`)}
                                    className="h-8 rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-3 gap-1.5 shadow-none"
                                >
                                    <Edit3 className="size-3.5" />
                                    Edit Pegawai
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* ─── Card Body: Information Grid ────────────────────────── */}
                    <div className="p-6 space-y-6">

                        {/* Section 1: Ringkasan Utama */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-none">
                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Nama Lengkap Pegawai
                                </div>
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                    {user.name}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Nomor Induk Pegawai (NIP)
                                </div>
                                <div className="font-mono font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                                    {user.nip}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Departemen / Unit Kerja
                                </div>
                                <div className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                                    <Building2 className="size-3.5 text-neutral-500" />
                                    {user.department?.name || (user.department_id ? `Dept #${user.department_id}` : '-')}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Peran / Role Akses
                                </div>
                                <div className="inline-flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                                    <Shield className="size-3.5 text-neutral-500" />
                                    {user.role?.display_name || user.role?.name || 'Tanpa Role Khusus'}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Metadata & Status */}
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 border-b border-neutral-200 dark:border-neutral-800">
                                <div className="p-4 space-y-1">
                                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Status Keaktifan Akun
                                    </div>
                                    <div>
                                        <span className="inline-block px-2.5 py-0.5 rounded-none text-xs font-medium border border-emerald-400 text-emerald-600 bg-emerald-50/30">
                                            Aktif
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-1">
                                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Waktu Terdaftar
                                    </div>
                                    <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        {user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '-'}
                                    </div>
                                </div>
                                <div className="p-4 space-y-1">
                                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Pembaruan Terakhir
                                    </div>
                                    <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        {user.updated_at ? new Date(user.updated_at).toLocaleString('id-ID') : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Hak Akses Role Terkait */}
                        {user.role && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="size-4 text-neutral-700 dark:text-neutral-300" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                            Rincian Hak Akses Role: {user.role.display_name || user.role.name}
                                        </h3>
                                    </div>
                                    <span className="text-xs text-neutral-500">
                                        {user.role.permissions ? `${user.role.permissions.length} Hak Akses` : 'Akses Penuh'}
                                    </span>
                                </div>

                                {user.role.name === 'administrator' ? (
                                    <div className="p-4 border border-emerald-300 bg-emerald-50/40 text-emerald-800 text-xs rounded-none">
                                        Role ini memiliki status <strong>Superadmin</strong> dan memiliki izin bypass tak terbatas ke semua fitur sistem.
                                    </div>
                                ) : !user.role.permissions || user.role.permissions.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-none bg-neutral-50/50">
                                        Tidak ada hak akses khusus yang ditetapkan pada role ini.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {user.role.permissions.map((p) => (
                                            <div
                                                key={p.id}
                                                className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none text-xs space-y-0.5"
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
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
