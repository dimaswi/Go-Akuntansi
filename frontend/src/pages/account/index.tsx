import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { useAuth, parseJwt, UserProfile } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle2, Lock, Save, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPage() {
    const navigate = useNavigate();
    const { user: authUser, token } = useAuth();
    const [profile, setProfile] = useState<UserProfile | any>(authUser);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch fresh profile data on component mount
    useEffect(() => {
        const fetchProfile = async () => {
            setLoadingProfile(true);
            try {
                const res = await api.get('/auth/me');
                if (res.data?.data) {
                    setProfile(res.data.data);
                    localStorage.setItem('user', JSON.stringify(res.data.data));
                }
            } catch (err) {
                // Keep existing profile or fallback
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, []);

    // Sync if authUser updates from context
    useEffect(() => {
        if (authUser) {
            setProfile((prev: any) => prev || authUser);
        }
    }, [authUser]);

    // Token claims and localStorage fallbacks
    const claims = token ? parseJwt(token) : null;
    let localSaved: any = null;
    try {
        const item = localStorage.getItem('user');
        if (item) localSaved = JSON.parse(item);
    } catch {
        // ignore
    }

    const current = profile || authUser || localSaved;

    const displayName =
        current?.name ||
        current?.nama ||
        claims?.name ||
        'Dimas Wisnu Wirawan';

    const displayNIP =
        current?.nip ||
        current?.username ||
        claims?.nip ||
        '2023.01.02.03';

    const displayRole =
        current?.role?.display_name ||
        current?.role?.name ||
        (claims?.role === 'admin' ? 'Administrator' : claims?.role) ||
        'Administrator';

    const departmentName =
        current?.department?.name ||
        '-';

    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'US';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!oldPassword) {
            toast.error('Kata sandi saat ini harus diisi');
            return;
        }

        if (newPassword.length < 5) {
            toast.error('Kata sandi baru minimal 5 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Konfirmasi kata sandi baru tidak cocok');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                old_password: oldPassword,
                new_password: newPassword,
            });
            toast.success('Kata sandi berhasil diperbarui');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengubah kata sandi');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/' },
        { title: 'Akun Pengguna' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* ─── Unified Card Container: KOTAK (rounded-none border border-neutral-200) ─── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none">

                    {/* ─── Card Header: Kembali + Icon + Title (Left) ──────── */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(-1)}
                                className="h-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs font-medium gap-1 px-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-3.5" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <User className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                                <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Pengaturan Akun & Kata Sandi
                                </h2>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* ─── Card Body ────────────────────────────────────────────── */}
                        <div className="p-6 space-y-8 max-w-full">

                            {/* Profil Ringkas */}
                            <div className="space-y-3">
                                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Informasi Profil Pengguna</span>
                                    {loadingProfile && (
                                        <span className="text-[11px] text-neutral-400 font-normal">Memperbarui data...</span>
                                    )}
                                </div>

                                <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-none p-4">
                                    {/* Header Avatar & Name Strip */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="size-12 rounded-none bg-neutral-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                            {initials}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                                {displayName}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 font-mono">
                                                <span>NIP: {displayNIP}</span>
                                                <span>•</span>
                                                <span className="inline-flex items-center gap-1 font-sans font-medium text-neutral-700 dark:text-neutral-300">
                                                    <Shield className="size-3 text-neutral-500" />
                                                    {displayRole}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <div className="text-xs text-neutral-400 font-medium">Nama Lengkap</div>
                                            <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                                {displayName}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-neutral-400 font-medium">Nomor Induk Pegawai (NIP)</div>
                                            <div className="font-mono font-medium text-neutral-800 dark:text-neutral-200 mt-0.5">
                                                {displayNIP}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-neutral-400 font-medium">Hak Akses / Role</div>
                                            <div className="inline-flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300 mt-0.5">
                                                <Shield className="size-3.5 text-neutral-500" />
                                                {displayRole}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-neutral-400 font-medium">Status Keaktifan</div>
                                            <div className="mt-0.5">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-xs font-medium border border-emerald-400 text-emerald-600 bg-emerald-50/30">
                                                    <CheckCircle2 className="size-3" />
                                                    Aktif
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Ubah Password */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        <Lock className="size-3.5" />
                                        Ganti Kata Sandi
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Pastikan kata sandi baru Anda unik dan memiliki minimal 5 karakter demi keamanan akun.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                            Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            type="password"
                                            required
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            placeholder="Masukkan kata sandi lama Anda"
                                            className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                                Kata Sandi Baru <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                type="password"
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Minimal 5 karakter"
                                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                                Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Ulangi kata sandi baru"
                                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ─── Card Footer: Actions ───────────────────────────────────── */}
                        <div className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-end gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/')}
                                className="h-9 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-medium px-4 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 shadow-none"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-9 rounded-none bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold px-5 gap-1.5 shadow-none"
                            >
                                <Save className="size-4" />
                                {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
