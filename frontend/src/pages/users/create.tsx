import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';

interface RoleOption {
    id: number;
    name: string;
    display_name: string;
}

interface DepartmentOption {
    id: number;
    code: string;
    name: string;
}

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' }, { title: 'Tambah User' },
];

export default function UserCreatePage() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [nip, setNip] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState<number | ''>('');
    const [departmentId, setDepartmentId] = useState<number | ''>('');

    useEffect(() => {
        Promise.all([
            api.get('/roles').catch(() => ({ data: { data: [] } })),
            api.get('/departments').catch(() => ({ data: { data: [] } })),
        ]).then(([rolesRes, deptsRes]) => {
            if (rolesRes.data?.data) {
                setRoles(rolesRes.data.data);
                if (rolesRes.data.data.length > 0) {
                    setRoleId(rolesRes.data.data[0].id);
                }
            }
            if (deptsRes.data?.data) {
                setDepartments(deptsRes.data.data);
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !nip.trim() || !password) {
            toast.error('Silakan lengkapi semua kolom yang wajib diisi');
            return;
        }

        setLoading(true);
        try {
            await api.post('/users', {
                name: name.trim(),
                nip: nip.trim(),
                password,
                role_id: roleId ? Number(roleId) : null,
                department_id: departmentId ? Number(departmentId) : null,
            });
            toast.success(`Pengguna ${name} berhasil ditambahkan`);
            navigate('/users');
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal menambahkan pengguna';
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
                                onClick={() => navigate('/users')}
                                className="h-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs font-medium gap-1 px-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                                title="Kembali ke Daftar User"
                            >
                                <ArrowLeft className="size-3.5" />
                            </Button>

                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                                <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Tambah User Baru
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
                                        Nama Lengkap Pegawai <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        placeholder="Contoh: Ahmad Bagus Rifai, S.Kep"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Nomor Induk Pegawai (NIP) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        placeholder="Contoh: 2025.04.01.217"
                                        className="h-9 rounded-none border border-neutral-200 font-mono text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        value={nip}
                                        onChange={(e) => setNip(e.target.value)}
                                    />
                                    <p className="text-[11px] text-neutral-500">Format standar NIP (misal: 2025.04.01.217)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Kata Sandi Awal <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        type="password"
                                        placeholder="Minimal 5 karakter"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Peran / Role Akses
                                    </label>
                                    <SearchableSelect
                                        value={roleId ? String(roleId) : ''}
                                        onValueChange={(val) => setRoleId(val ? Number(val) : '')}
                                        placeholder="-- Pilih Peran / Role Akses --"
                                        searchPlaceholder="Cari role pengguna..."
                                        inputClassName="h-9 text-sm font-sans"
                                        options={[
                                            { value: '', label: '-- Tanpa Role Khusus --' },
                                            ...roles.map((r) => ({
                                                value: String(r.id),
                                                label: `${r.display_name || r.name} (${r.name})`,
                                            })),
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                    Departemen / Unit Kerja
                                </label>
                                <SearchableSelect
                                    value={departmentId ? String(departmentId) : ''}
                                    onValueChange={(val) => setDepartmentId(val ? Number(val) : '')}
                                    placeholder="-- Pilih Departemen / Unit Kerja --"
                                    searchPlaceholder="Cari nama atau kode departemen..."
                                    inputClassName="h-9 text-sm font-sans"
                                    options={[
                                        { value: '', label: '-- Tanpa Departemen Khusus --' },
                                        ...departments.map((d) => ({
                                            value: String(d.id),
                                            label: d.code ? `${d.name} (${d.code})` : d.name,
                                        })),
                                    ]}
                                />
                            </div>
                        </div>

                        {/* ─── Card Footer: Actions ───────────────────────────────────── */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/users')}
                                className="h-9 px-4 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                            >
                                Batal
                            </Button>
                            <Can permission={['user.create', 'users.create']}>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-9 px-5 rounded-none bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-4" />
                                    Simpan User
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
