import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [nip, setNip] = useState('2023.01.02.03'); // Default NIP Dimas Wisnu Wirawan (Administrator)
    const [password, setPassword] = useState('12345');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nip.trim()) {
            toast.error('Silakan isi Nomor Induk Pegawai (NIP)');
            return;
        }
        if (!password) {
            toast.error('Silakan isi kata sandi Anda');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', { nip: nip.trim(), password });
            if (res.data?.success) {
                const { token, user } = res.data.data;
                login(token, user);
                toast.success(`Selamat datang kembali, ${user.name}!`);
                navigate('/akuntansi');
            } else {
                toast.error(res.data?.message || 'Login gagal, periksa NIP dan password');
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'NIP atau kata sandi tidak sesuai';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col justify-center items-center p-4 selection:bg-primary/20 selection:text-primary">
            {/* Laravel Hospital / SIMRS Style Clean Card Layout */}
            <div className="w-full max-w-[440px]">
                {/* Brand / Logo Top */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-3 mb-3">
                        <img
                            src="/1.png"
                            alt="Logo Sistem"
                            className="size-full object-contain"
                        />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        SIM - Akuntansi
                    </h1>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Sistem Informasi Manajemen Rumah Sakit & Modul Akuntansi
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-none p-7 sm:p-8">
                    <div className="mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            Masuk ke Akun Anda
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Gunakan kredensial NIP yang telah terdaftar di database
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* NIP Field */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nip" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Nomor Induk Pegawai (NIP)
                            </Label>
                            <div className="relative">
                                <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    id="nip"
                                    type="text"
                                    placeholder="Masukkan NIP Anda"
                                    value={nip}
                                    onChange={(e) => setNip(e.target.value)}
                                    className="pl-9 h-10 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-sm focus-visible:ring-primary"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Kata Sandi
                                </Label>
                            </div>
                            <div className="relative">
                                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Masukkan kata sandi"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 pr-9 h-10 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-sm focus-visible:ring-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center justify-between pt-1">
                            <button
                                type="button"
                                onClick={() => setRememberMe(!rememberMe)}
                                className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                            >
                                {rememberMe ? (
                                    <CheckSquare className="size-4 text-primary" />
                                ) : (
                                    <Square className="size-4 text-neutral-400" />
                                )}
                                <span>Ingat saya di perangkat ini</span>
                            </button>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 mt-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg shadow transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Masuk ke Sistem</span>
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Security Badge */}
                    <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                        <span>Sistem Keamanan Akses Berbasis Role & Izin Terverifikasi</span>
                    </div>
                </div>

                {/* Footer Copyright */}
                <div className="text-center mt-6 text-xs text-neutral-400">
                    &copy; {new Date().getFullYear()} SIM - Akuntansi Enterprise. Hak Cipta Dilindungi.
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
