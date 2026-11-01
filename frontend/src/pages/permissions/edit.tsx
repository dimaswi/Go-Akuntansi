import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' }, { title: 'Permission', href: '/permissions' },
    { title: 'Edit Permission' },
];

export default function PermissionEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [module, setModule] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        api.get(`/permissions/${id}`)
            .then((res) => {
                const p = res.data?.data;
                if (p) {
                    setName(p.name || '');
                    setDisplayName(p.display_name || '');
                    setModule(p.module || '');
                    setDescription(p.description || '');
                }
            })
            .catch(() => toast.error('Gagal memuat data permission'))
            .finally(() => setFetching(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Kode permission wajib diisi');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/permissions/${id}`, {
                name: name.trim().toLowerCase(),
                display_name: displayName.trim() || name.trim(),
                module: module.trim() || 'Umum',
                description: description.trim(),
            });
            toast.success(`Permission ${name} berhasil diperbarui`);
            navigate('/permissions');
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal memperbarui permission';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* ─── Unified Card Container: KOTAK (rounded-none border border-neutral-200) ─── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none">

                    {/* ─── Card Header: Kembali + Icon + Title ──────── */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/permissions')}
                                className="h-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs font-medium gap-1 px-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                                title="Kembali ke Daftar Permission"
                            >
                                <ArrowLeft className="size-3.5" />
                            </Button>

                            <div className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                                <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Edit Hak Akses (Permission)
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* ─── Form Content ────────────────────────────────────────────── */}
                    {fetching ? (
                        <div className="p-12 text-center text-sm text-neutral-500">
                            Memuat data permission...
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                            System Identifier (Kode Teknis) <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            required
                                            className="h-9 rounded-none border border-neutral-200 font-mono text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <p className="text-[11px] text-neutral-500">Format identifier sistem autentikasi</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                            Nama Tampilan (Display Name)
                                        </label>
                                        <Input
                                            className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                            Kelompok Modul Sistem
                                        </label>
                                        <Input
                                            className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                            value={module}
                                            onChange={(e) => setModule(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                            Keterangan & Deskripsi
                                        </label>
                                        <Input
                                            className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ─── Card Footer: Actions ───────────────────────────────────── */}
                            <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/permissions')}
                                    className="h-9 px-4 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                                >
                                    Batal
                                </Button>
                                <Can permission={['permission.edit', 'permissions.edit']}>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="h-9 px-5 rounded-none bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                                    >
                                        <Save className="size-4" />
                                        Perbarui Permission
                                    </Button>
                                </Can>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
