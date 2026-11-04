import React, { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const GRID_SIZE = 40;
const INFLUENCE_RADIUS = 220;

function InteractiveGrid() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const smoothMouseRef = useRef({ x: -9999, y: -9999 });
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                mouseRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                };
            }
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -9999, y: -9999 };
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) {
            animFrameRef.current = requestAnimationFrame(draw);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = Math.round(width * dpr);
        const ch = Math.round(height * dpr);

        if (canvas.width !== cw || canvas.height !== ch) {
            canvas.width = cw;
            canvas.height = ch;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        // Smooth mouse follow (lerp)
        const sm = smoothMouseRef.current;
        const tm = mouseRef.current;
        sm.x += (tm.x - sm.x) * 0.15;
        sm.y += (tm.y - sm.y) * 0.15;

        ctx.clearRect(0, 0, width, height);

        const mx = sm.x;
        const my = sm.y;

        const cols = Math.ceil(width / GRID_SIZE) + 1;
        const rows = Math.ceil(height / GRID_SIZE) + 1;

        // --- Static grid lines ---
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= cols; c++) {
            const x = c * GRID_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let r = 0; r <= rows; r++) {
            const y = r * GRID_SIZE;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // --- Big ambient glow under cursor ---
        if (mx > -1000 && my > -1000) {
            const bigGlow = ctx.createRadialGradient(mx, my, 0, mx, my, INFLUENCE_RADIUS * 1.3);
            bigGlow.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
            bigGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
            bigGlow.addColorStop(1, 'rgba(99, 102, 241, 0)');
            ctx.fillStyle = bigGlow;
            ctx.fillRect(0, 0, width, height);
        }

        // --- Interactive grid lines (highlight near cursor) ---
        for (let c = 0; c <= cols; c++) {
            const x = c * GRID_SIZE;
            const clampedY = Math.max(0, Math.min(height, my));
            const vDist = Math.abs(x - mx);
            if (vDist < INFLUENCE_RADIUS) {
                const vt = 1 - vDist / INFLUENCE_RADIUS;
                const alpha = vt * vt * 0.35;
                const segTop = Math.max(0, clampedY - INFLUENCE_RADIUS);
                const segBot = Math.min(height, clampedY + INFLUENCE_RADIUS);
                const grad = ctx.createLinearGradient(x, segTop, x, segBot);
                grad.addColorStop(0, 'rgba(129, 140, 248, 0)');
                grad.addColorStop(0.5, `rgba(129, 140, 248, ${alpha})`);
                grad.addColorStop(1, 'rgba(129, 140, 248, 0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, segTop);
                ctx.lineTo(x, segBot);
                ctx.stroke();
            }
        }
        for (let r = 0; r <= rows; r++) {
            const y = r * GRID_SIZE;
            const clampedX = Math.max(0, Math.min(width, mx));
            const hDist = Math.abs(y - my);
            if (hDist < INFLUENCE_RADIUS) {
                const ht = 1 - hDist / INFLUENCE_RADIUS;
                const alpha = ht * ht * 0.35;
                const segLeft = Math.max(0, clampedX - INFLUENCE_RADIUS);
                const segRight = Math.min(width, clampedX + INFLUENCE_RADIUS);
                const grad = ctx.createLinearGradient(segLeft, y, segRight, y);
                grad.addColorStop(0, 'rgba(129, 140, 248, 0)');
                grad.addColorStop(0.5, `rgba(129, 140, 248, ${alpha})`);
                grad.addColorStop(1, 'rgba(129, 140, 248, 0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(segLeft, y);
                ctx.lineTo(segRight, y);
                ctx.stroke();
            }
        }

        // --- Intersection dots ---
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * GRID_SIZE;
                const y = r * GRID_SIZE;

                const dx = x - mx;
                const dy = y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const t = Math.max(0, 1 - dist / INFLUENCE_RADIUS);
                const ease = t * t;

                const baseRadius = 1.2;
                const baseOpacity = 0.1;

                if (ease > 0.01) {
                    const dotRadius = baseRadius + ease * 5;
                    const dotOpacity = baseOpacity + ease * 0.9;

                    // Glow ring
                    const glow = ctx.createRadialGradient(x, y, 0, x, y, dotRadius + 16);
                    glow.addColorStop(0, `rgba(129, 140, 248, ${ease * 0.45})`);
                    glow.addColorStop(0.4, `rgba(129, 140, 248, ${ease * 0.15})`);
                    glow.addColorStop(1, 'rgba(129, 140, 248, 0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius + 16, 0, Math.PI * 2);
                    ctx.fill();

                    // Core dot
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(199, 210, 254, ${dotOpacity})`;
                    ctx.fill();
                } else {
                    // Static small dot
                    ctx.beginPath();
                    ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity})`;
                    ctx.fill();
                }
            }
        }

        animFrameRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [draw]);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
            <canvas ref={canvasRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
        </div>
    );
}

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, token, user, isLoading } = useAuth();

    useEffect(() => {
        document.title = 'Log in - Akuntansi';
    }, []);

    useEffect(() => {
        if (!isLoading && token && user) {
            navigate('/akuntansi', { replace: true });
        }
    }, [token, user, isLoading, navigate]);

    const [nip, setNip] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const appName = 'Sistem Akuntansi';

    const logoEl = (
        <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/15 p-1.5 shadow-sm">
            <img
                src="/1.png"
                alt="Logo Klinik Muhammadiyah Kedungadem"
                className="size-full object-contain"
            />
        </div>
    );

    const handleSubmit: FormEventHandler = async (e) => {
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
        <div className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Panel - Dark with interactive grid (Identik dengan sistem Laravel) */}
            <div className="relative hidden lg:flex lg:w-[55%] bg-gray-950 overflow-hidden">
                <InteractiveGrid />

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/40 pointer-events-none" />

                {/* Branding content */}
                <div className="relative z-10 flex flex-col justify-between p-10 w-full pointer-events-none">
                    {/* Top - Logo */}
                    <div className="flex items-center gap-3">
                        {logoEl}
                        <span className="text-xl font-bold text-white tracking-tight">{appName}</span>
                    </div>

                    {/* Center - Tagline */}
                    <div className="max-w-md">
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                            Sistem Informasi
                            <br />
                            <span className="text-indigo-400">Akuntansi</span>
                            <br />
                            Terintegrasi
                        </h1>
                        <p className="text-lg text-gray-400 leading-relaxed">
                            Kelola keuangan dan pembukuan bisnis Anda dengan mudah dan efisien
                        </p>
                    </div>

                    {/* Bottom - Footer */}
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Klinik Muhammadiyah Kedungadem
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="relative flex-1 flex items-center justify-center bg-background p-6 sm:p-10">
                {/* Mobile: dark bg with interactive grid */}
                <div className="absolute inset-0 lg:hidden bg-gray-950">
                    <InteractiveGrid />
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 to-gray-950/80 pointer-events-none" />
                </div>

                <div className="relative z-10 w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        {logoEl}
                        <span className="text-xl font-bold text-white tracking-tight">{appName}</span>
                    </div>

                    <div className="bg-background/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none rounded-2xl lg:rounded-none p-8 lg:p-0 border border-border/50 lg:border-0 shadow-xl lg:shadow-none">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold tracking-tight">Selamat datang</h2>
                            <p className="text-sm text-muted-foreground mt-1.5">
                                Masukkan kredensial untuk mengakses akun anda
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="nip" className="text-sm font-medium">
                                    NIP
                                </Label>
                                <Input
                                    id="nip"
                                    type="text"
                                    placeholder="Nomor Induk Kepegawaian"
                                    value={nip}
                                    onChange={(e) => setNip(e.target.value)}
                                    className="h-11"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Mobile footer */}
                    <p className="lg:hidden text-center text-xs text-gray-500 mt-8">
                        &copy; {new Date().getFullYear()} Klinik Muhammadiyah Kedungadem
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
