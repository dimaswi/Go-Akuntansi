import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Shield, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionItem {
    id: number;
    name: string;
    display_name: string;
    description: string;
    module: string;
}

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' }, { title: 'Role', href: '/roles' },
    { title: 'Tambah Role' },
];

export default function RoleCreatePage() {
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState<PermissionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPerms, setSelectedPerms] = useState<number[]>([]);

    useEffect(() => {
        api.get('/permissions')
            .then((res) => {
                if (res.data?.data) {
                    setPermissions(res.data.data);
                }
            })
            .catch(() => toast.error('Gagal memuat daftar permission'))
            .finally(() => setFetching(false));
    }, []);

    const togglePerm = (id: number) => {
        setSelectedPerms((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const toggleModule = (moduleName: string) => {
        const modulePermIds = permissions
            .filter((p) => (p.module || 'Umum') === moduleName)
            .map((p) => p.id);
        const allSelected = modulePermIds.every((id) => selectedPerms.includes(id));

        if (allSelected) {
            setSelectedPerms((prev) => prev.filter((id) => !modulePermIds.includes(id)));
        } else {
            setSelectedPerms((prev) => Array.from(new Set([...prev, ...modulePermIds])));
        }
    };

    const selectAll = () => {
        setSelectedPerms(permissions.map((p) => p.id));
    };

    const deselectAll = () => {
        setSelectedPerms([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !displayName.trim()) {
            toast.error('Kode Role dan Display Name wajib diisi');
            return;
        }

        setLoading(true);
        try {
            await api.post('/roles', {
                name: name.trim().toLowerCase().replace(/\s+/g, '_'),
                display_name: displayName.trim(),
                description: description.trim(),
                permission_ids: selectedPerms,
            });
            toast.success(`Role ${displayName} berhasil ditambahkan`);
            navigate('/roles');
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal menambahkan role';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const permsByModule = permissions.reduce<Record<string, PermissionItem[]>>((acc, p) => {
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

                    {/* ─── Card Header: Kembali + Icon + Title ──────── */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/roles')}
                                className="h-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs font-medium gap-1 px-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                                title="Kembali ke Daftar Role"
                            >
                                <ArrowLeft className="size-3.5" />
                            </Button>

                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                                <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Tambah Role Baru
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* ─── Form Content ────────────────────────────────────────────── */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        System Code Role <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        placeholder="Contoh: akuntan_junior"
                                        className="h-9 rounded-none border border-neutral-200 font-mono text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                    />
                                    <p className="text-[11px] text-neutral-500">Format kode sistem: huruf kecil dan garis bawah</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Nama Tampilan (Display Name) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        placeholder="Contoh: Akuntan Junior"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                    Deskripsi Tugas & Wewenang
                                </label>
                                <Input
                                    placeholder="Jelaskan cakupan wewenang peran ini (opsional)"
                                    className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Permissions Matrix */}
                            <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                            <KeyRound className="size-4" />
                                            Penetapan Hak Akses (Permissions)
                                        </label>
                                        <p className="text-[11px] text-neutral-500">
                                            Pilih hak akses fitur yang diizinkan untuk peran ini ({selectedPerms.length} dipilih)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={selectAll}
                                            className="h-7 text-xs rounded-none border border-neutral-200 bg-white hover:bg-neutral-50 shadow-none px-2.5"
                                        >
                                            Pilih Semua
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={deselectAll}
                                            className="h-7 text-xs rounded-none border border-neutral-200 bg-white hover:bg-neutral-50 shadow-none px-2.5"
                                        >
                                            Hapus Semua
                                        </Button>
                                    </div>
                                </div>

                                {fetching ? (
                                    <div className="p-8 text-center text-sm text-neutral-500">
                                        <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                                        Memuat daftar hak akses...
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 border border-neutral-200 dark:border-neutral-800 p-4 rounded-none bg-neutral-50/20">
                                        {Object.entries(permsByModule).map(([mod, items]) => {
                                            const modItemIds = items.map((i) => i.id);
                                            const allChecked = modItemIds.every((id) => selectedPerms.includes(id));
                                            return (
                                                <div key={mod} className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none p-3 space-y-2.5">
                                                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                                                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                                                            Modul: {mod}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleModule(mod)}
                                                            className="text-[11px] font-medium text-neutral-500 hover:text-black underline"
                                                        >
                                                            {allChecked ? 'Batal Pilih Modul' : 'Pilih Semua Modul'}
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                        {items.map((p) => {
                                                            const isChecked = selectedPerms.includes(p.id);
                                                            return (
                                                                <label
                                                                    key={p.id}
                                                                    className={`flex items-start gap-2 p-2 border text-xs cursor-pointer rounded-none transition-colors ${isChecked
                                                                        ? 'bg-neutral-900 text-white border-neutral-900'
                                                                        : 'bg-neutral-50/50 hover:bg-neutral-100/50 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => togglePerm(p.id)}
                                                                        className="mt-0.5 rounded-none"
                                                                    />
                                                                    <div className="leading-tight">
                                                                        <div className="font-semibold">{p.display_name || p.name}</div>
                                                                        <div className={`font-mono text-[11px] ${isChecked ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                                                            {p.name}
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── Card Footer: Actions ───────────────────────────────────── */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/roles')}
                                className="h-9 px-4 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                            >
                                Batal
                            </Button>
                            <Can permission={['role.create', 'roles.create']}>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-9 px-5 rounded-none bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-4" />
                                    Simpan Role
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
