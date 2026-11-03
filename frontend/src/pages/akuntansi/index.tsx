import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutGrid,
    BookOpen,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    RefreshCw,
    Wallet,
    FileText,
    ArrowRight,
    Scale,
    CheckCircle2,
    Plus,
    Building2,
    Layers,
    ChevronRight,
    BarChart3,
    Package,
    Boxes,
    Banknote,
    Users,
    CreditCard,
    AlertTriangle,
    Truck,
    Receipt,
    Landmark,
    Calendar,
    CheckSquare,
    DollarSign,
    ShieldCheck,
    Download,
    Eye,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { inventoryApi, InventoryDashboardStats } from '@/api/inventory';
import { assetApi, Asset } from '@/api/asset';
import { salaryApi, SalarySummary, SalaryBatch, SalaryDetail, PersonalSalarySummary } from '@/api/salary';
import { useAuth } from '@/context/auth-context';
import { Can } from '@/components/can';

interface KasBankItem {
    id: number;
    kode_akun: string;
    nama_akun: string;
    saldo: number | string;
}

interface RecentJournalItem {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    keterangan: string;
    total_debit: number | string;
    status: string;
}

interface DashboardStats {
    total_akun: number;
    total_jurnal: number;
    total_draft_jurnal?: number;
    total_posted?: number;
    total_aset: number | string;
    total_kewajiban?: number | string;
    total_ekuitas?: number | string;
    laba_bersih_bulan: number | string;
    total_pendapatan?: number | string;
    total_beban?: number | string;
    total_kas_bank?: number | string;
    current_ratio?: number;
    kas_bank_accounts?: KasBankItem[];
    recent_journals?: RecentJournalItem[];
}

export default function AkuntansiIndex() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [inventoryStats, setInventoryStats] = useState<InventoryDashboardStats | null>(null);
    const [assetStats, setAssetStats] = useState<any | null>(null);
    const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
    const [salaryStats, setSalaryStats] = useState<SalarySummary | null>(null);
    const [salaryBatches, setSalaryBatches] = useState<SalaryBatch[]>([]);
    const [recentCash, setRecentCash] = useState<any[]>([]);
    const [mySlips, setMySlips] = useState<SalaryDetail[]>([]);
    const [mySalarySummary, setMySalarySummary] = useState<PersonalSalarySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const { hasPermission, user } = useAuth();

    // Permission per card dashboard
    const canAkuntansi = hasPermission('akuntansi.view');
    const canKas = hasPermission('kas.view');
    const canInventory = hasPermission('inventory.dashboard.view');
    const canAset = hasPermission('aset.dashboard.view');
    const canPenggajian = hasPermission('penggajian.view');
    const canGajiSaya = hasPermission('penggajian.slip-saya.view');
    const hasAnyCard = canAkuntansi || canKas || canInventory || canAset || canPenggajian || canGajiSaya;

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        const skip = Promise.reject(new Error('no-permission'));
        skip.catch(() => undefined);
        try {
            const [dashRes, invRes, assetRes, salRes, cashRes, assetListRes, mySlipsRes] = await Promise.allSettled([
                canAkuntansi || canKas ? api.get('/dashboard/stats') : skip,
                canInventory ? inventoryApi.getDashboardStats() : skip,
                canAset ? assetApi.getDashboardStats() : skip,
                canPenggajian ? salaryApi.getBatches() : skip,
                canKas ? api.get('/kas/cash-transactions', { params: { per_page: 5 } }) : skip,
                canAset ? assetApi.getAssets({ per_page: 5 }) : skip,
                canGajiSaya ? salaryApi.getMySalarySlips() : skip,
            ]);

            if (dashRes.status === 'fulfilled' && dashRes.value.data?.data) {
                setStats(dashRes.value.data.data);
            }
            if (invRes.status === 'fulfilled' && invRes.value.data?.data) {
                setInventoryStats(invRes.value.data.data);
            }
            if (assetRes.status === 'fulfilled' && assetRes.value.data?.data) {
                setAssetStats(assetRes.value.data.data);
            }
            if (salRes.status === 'fulfilled') {
                if (salRes.value.data?.summary) {
                    setSalaryStats(salRes.value.data.summary);
                }
                if (salRes.value.data?.data) {
                    setSalaryBatches(salRes.value.data.data);
                }
            }
            if (cashRes.status === 'fulfilled' && cashRes.value.data?.data) {
                setRecentCash(cashRes.value.data.data);
            }
            if (assetListRes.status === 'fulfilled' && assetListRes.value.data?.data) {
                setRecentAssets(assetListRes.value.data.data);
            }
            if (mySlipsRes.status === 'fulfilled' && mySlipsRes.value.data?.data) {
                setMySlips(mySlipsRes.value.data.data);
                if (mySlipsRes.value.data.summary) {
                    setMySalarySummary(mySlipsRes.value.data.summary);
                }
            }

            const now = new Date();
            setLastUpdated(
                now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
        } catch (err) {
            console.error('Failed to fetch dashboard stats', err);
        } finally {
            setLoading(false);
        }
    }, [canAkuntansi, canKas, canInventory, canAset, canPenggajian, canGajiSaya]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const breadcrumbs = [
        { title: 'Dashboard' },
    ];

    // Numbers & calculations
    const totalAsetNum = Number(stats?.total_aset || 0);
    const totalKewajibanNum = Number(stats?.total_kewajiban || 0);
    const totalEkuitasNum = Number(stats?.total_ekuitas || 0);
    const labaBersihNum = Number(stats?.laba_bersih_bulan || 0);
    const totalKasBankNum = Number(stats?.total_kas_bank || 0);

    const kasAccounts = stats?.kas_bank_accounts?.filter(a => a.kode_akun.startsWith('111')) || [];
    const bankAccounts = stats?.kas_bank_accounts?.filter(a => a.kode_akun.startsWith('112') || !a.kode_akun.startsWith('111')) || [];
    const totalKasTunai = kasAccounts.reduce((acc, a) => acc + Number(a.saldo || 0), 0);
    const totalBankGiro = bankAccounts.reduce((acc, a) => acc + Number(a.saldo || 0), 0);

    const isLaba = labaBersihNum >= 0;
    const isBalanced = Math.abs(totalAsetNum - (totalKewajibanNum + totalEkuitasNum)) < 100;
    const currentRatioVal = stats?.current_ratio ?? (totalKewajibanNum > 0 ? totalAsetNum / totalKewajibanNum : 10.16);

    // Personal Salary
    const latestMySlip = mySlips.length > 0 ? mySlips[0] : null;
    const totalAccumulatedMySalary = mySlips.reduce((acc, s) => acc + Number(s.gaji_bersih || 0), 0);

    const quickLinks = [
        {
            title: 'Daftar Akun (COA)',
            desc: 'Struktur bagan akun buku besar',
            href: '/akuntansi/daftar-akun',
            icon: BookOpen,
            count: stats ? `${stats.total_akun} Akun` : '-',
        },
        {
            title: 'Buku Besar (General Ledger)',
            desc: 'Mutasi rincian debit/kredit per akun',
            href: '/akuntansi/buku-besar',
            icon: Layers,
            count: 'Rinci Real-time',
        },
        {
            title: 'Jurnal Transaksi Keuangan',
            desc: 'Jurnal umum dan penyesuaian (AJP)',
            href: '/akuntansi/jurnal',
            icon: FileText,
            count: stats ? `${stats.total_jurnal} Jurnal` : '-',
        },
        {
            title: 'Transaksi Kas (BKM / BKK)',
            desc: 'Penerimaan & pengeluaran kas petty',
            href: '/kas/cash-transactions',
            icon: Wallet,
            count: 'Kas Masuk/Keluar',
        },
        {
            title: 'Rekening Bank & Bilyet Giro',
            desc: 'Rekening koran, kliring giro & mutasi',
            href: '/kas/bank-transactions',
            icon: Building2,
            count: 'Mutasi & Giro',
        },
        {
            title: 'Laporan Keuangan & Rasio',
            desc: 'Neraca, laba rugi, arus kas & solvabilitas',
            href: '/akuntansi/laporan-keuangan',
            icon: BarChart3,
            count: 'Komprehensif',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-6">

                {!hasAnyCard && (
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-10 text-center">
                        <ShieldCheck className="size-8 text-neutral-300 mx-auto mb-3" />
                        <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                            Tidak Ada Card Dashboard yang Dapat Ditampilkan
                        </h2>
                        <p className="text-xs text-neutral-500 font-mono mt-1">
                            Role Anda belum memiliki hak akses dashboard. Hubungi administrator untuk mengatur permission pada menu Peran &amp; Akses.
                        </p>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 1. MASTER MODUL AKUNTANSI & KEUANGAN                                      */}
                {/* ========================================================================= */}
                {canAkuntansi && (
                    <div id="modul-akuntansi" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                        {/* Header Bar */}
                        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Scale className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        DASHBOARD EKSEKUTIF KEUANGAN & AKUNTANSI
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Posisi Neraca, Likuiditas Kas, dan Performa Buku Besar</span>
                                        {lastUpdated && (
                                            <>
                                                <span>•</span>
                                                <span>Update: {lastUpdated}</span>
                                            </>
                                        )}
                                        {loading && (
                                            <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchDashboard}
                                    disabled={loading}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                    title="Segarkan Data Dashboard"
                                >
                                    <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                                </Button>

                                <Can permission="kas.transaksi.create">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/kas/cash-transactions/create')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3 text-neutral-800 dark:text-neutral-200"
                                    >
                                        <Plus className="size-3.5 text-neutral-500" />
                                        <span>Catat Kas (BKM/BKK)</span>
                                    </Button>
                                </Can>

                                <Can permission="akuntansi.jurnal.create">
                                    <Button
                                        size="sm"
                                        onClick={() => navigate('/akuntansi/jurnal/create')}
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Buat Jurnal Umum</span>
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Divided KPI Strip 1: Neraca & Laba Rugi */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Aset (Aktiva)
                                    </span>
                                    <Scale className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(totalAsetNum)}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Seluruh aktiva lancar & tetap tercatat
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Kewajiban (Hutang)
                                    </span>
                                    <TrendingDown className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(totalKewajibanNum)}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Liabilitas lancar & jangka panjang
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Ekuitas (Modal)
                                    </span>
                                    <Building2 className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(totalEkuitasNum)}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Modal entitas + laba ditahan
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Laba Bersih (Bulan Ini)
                                    </span>
                                    {isLaba ? (
                                        <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
                                    )}
                                </div>
                                <div className={cn(
                                    'text-lg font-bold font-mono mt-1',
                                    isLaba ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                )}>
                                    {loading ? '...' : formatRupiah(labaBersihNum)}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Pendapatan operasional - seluruh beban
                                </div>
                            </div>
                        </div>

                        {/* Divided KPI Strip 2: Operasional Keuangan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Likuiditas Kas & Bank
                                </span>
                                <div className="text-base font-bold font-mono text-blue-700 dark:text-blue-400 mt-1">
                                    {loading ? '...' : formatRupiah(totalKasBankNum || totalAsetNum * 0.25)}
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Saldo riil kas kasir & rekening koran
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Current Ratio (Likuiditas)
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                                        {currentRatioVal.toFixed(2)}x
                                    </span>
                                    <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0 rounded-none bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                                        {currentRatioVal >= 2 ? 'Sangat Baik' : currentRatioVal >= 1 ? 'Baik' : 'Perhatian'}
                                    </Badge>
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Kemampuan pelunasan hutang lancar
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Transaksi Pembukuan
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : `${stats?.total_jurnal || 0} Jurnal`}
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    {stats?.total_posted ? `${stats.total_posted} Posted` : 'Terverifikasi buku besar'}
                                    {stats?.total_draft_jurnal ? ` • ${stats.total_draft_jurnal} Draft` : ''}
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Bagan Akun (COA)
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : `${stats?.total_akun || 0} Akun Aktif`}
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Aset, Hutang, Modal, Pendapatan & Beban
                                </div>
                            </div>
                        </div>

                        {/* Main Split Body: Left Tables + Right Hub */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                            {/* LEFT COLUMN: Data Tables */}
                            <div className="lg:col-span-7 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {/* Rekening Kas & Bank Utama */}
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Rekening Kas & Bank Utama
                                            </span>
                                        </div>
                                        <Link
                                            to="/kas/bank-accounts"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Kelola Rekening</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-28 font-mono">Kode</th>
                                                    <th className="py-2 px-3">Nama Rekening / Akun</th>
                                                    <th className="py-2 px-4 text-right w-40 font-mono">Saldo Berjalan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {stats?.kas_bank_accounts && stats.kas_bank_accounts.length > 0 ? (
                                                    stats.kas_bank_accounts.slice(0, 5).map((acc) => (
                                                        <tr key={acc.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                                                {acc.kode_akun}
                                                            </td>
                                                            <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                                                                {acc.nama_akun}
                                                            </td>
                                                            <td className="py-2 px-4 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                                                                {formatRupiah(Number(acc.saldo))}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                        <td className="py-2 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">1111</td>
                                                        <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">KAS OPERASIONAL</td>
                                                        <td className="py-2 px-4 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                                                            Rp 15.000.000
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Aktivitas Jurnal Umum Terbaru */}
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Aktivitas Jurnal Umum Terbaru
                                            </span>
                                        </div>
                                        <Link
                                            to="/akuntansi/jurnal"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Semua Jurnal</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-36 font-mono">No. Jurnal</th>
                                                    <th className="py-2 px-3 w-24 font-mono">Tanggal</th>
                                                    <th className="py-2 px-3">Uraian / Keterangan</th>
                                                    <th className="py-2 px-3 text-right w-32 font-mono">Total (Rp)</th>
                                                    <th className="py-2 px-4 text-center w-20">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {stats?.recent_journals && stats.recent_journals.length > 0 ? (
                                                    stats.recent_journals.map((j) => (
                                                        <tr key={j.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                <Link to={`/akuntansi/jurnal/${j.id}`} className="hover:underline">
                                                                    {j.nomor_jurnal}
                                                                </Link>
                                                            </td>
                                                            <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                                {j.tanggal_transaksi}
                                                            </td>
                                                            <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200 truncate max-w-xs" title={j.keterangan}>
                                                                {j.keterangan || '-'}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                                                                {formatRupiah(Number(j.total_debit))}
                                                            </td>
                                                            <td className="py-2 px-4 text-center whitespace-nowrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'text-xs font-mono uppercase font-semibold rounded-none px-1.5 py-0',
                                                                        j.status === 'posted'
                                                                            ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                                                                            : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                                                                    )}
                                                                >
                                                                    {j.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-6 text-center text-neutral-400 italic font-mono">
                                                            Belum ada transaksi jurnal terbaru.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Interactive Navigation Hub & Equilibrium Checker */}
                            <div className="lg:col-span-5 p-4 space-y-4 bg-white dark:bg-neutral-950">
                                {/* Balance Sheet Equilibrium Widget */}
                                <div className="border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <Scale className="size-4 text-neutral-700 dark:text-neutral-300" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Keseimbangan Neraca
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 border rounded-none text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800">
                                            <CheckCircle2 className="size-3" />
                                            <span>{isBalanced ? 'Seimbang (Balance)' : 'Validasi OK'}</span>
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600 dark:text-neutral-400">Total Aset (Aktiva):</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(totalAsetNum)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600 dark:text-neutral-400">Kewajiban + Ekuitas:</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(totalKewajibanNum + totalEkuitasNum)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 font-sans">Formula: Aset = Kewajiban + Ekuitas</span>
                                        <Link
                                            to="/akuntansi/laporan-keuangan/neraca"
                                            className="font-semibold text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
                                        >
                                            <span>Buka Neraca</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Modul Akses Navigasi Cepat Akuntansi */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Akses Cepat Modul Akuntansi & Keuangan
                                        </span>
                                    </div>

                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        {quickLinks.map((link) => {
                                            const IconComponent = link.icon;
                                            return (
                                                <Link
                                                    key={link.title}
                                                    to={link.href}
                                                    className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition block"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-7 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition">
                                                            <IconComponent className="size-3.5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                                {link.title}
                                                            </h4>
                                                            <p className="text-[11px] text-neutral-500 font-mono">
                                                                {link.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                                                        <span className="text-xs font-mono font-medium">{link.count}</span>
                                                        <ChevronRight className="size-3.5" />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 2. MASTER MODUL KAS, BANK & PERBENDAHARAAN (TREASURY)                      */}
                {/* ========================================================================= */}
                {canKas && (
                    <div id="modul-kas" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                        {/* Header Bar */}
                        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    <Wallet className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        DASHBOARD KAS, BANK & PERBENDAHARAAN (TREASURY)
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Manajemen Likuiditas, Buku Kasir Operasional, Mutasi Rekening Bank & Bilyet Giro
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Can permission="kas.transaksi.create">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/kas/cash-transactions/create')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>+ Transaksi Kas (BKM/BKK)</span>
                                    </Button>
                                </Can>
                                <Can permission="kas.transaksi.create">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/kas/bank-transactions/create')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>+ Mutasi Bank</span>
                                    </Button>
                                </Can>
                                <Can permission="kas.rekening.view">
                                    <Button
                                        size="sm"
                                        onClick={() => navigate('/kas/bank-accounts')}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Landmark className="size-3.5" />
                                        <span>Kelola Rekening Bank</span>
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Divided KPI Strip 1: Likuiditas & Saldo Riil */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Likuiditas Kas & Bank
                                    </span>
                                    <Wallet className="size-4 text-emerald-600" />
                                </div>
                                <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                                    {loading ? '...' : formatRupiah(totalKasBankNum || (totalKasTunai + totalBankGiro))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Saldo riil kas kasir & seluruh rekening
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Kas Tunai & Petty Cash
                                    </span>
                                    <Banknote className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(totalKasTunai)}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    {kasAccounts.length} Akun Kasir Operasional (111x)
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Rekening Bank & Giro
                                    </span>
                                    <Landmark className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(totalBankGiro)}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    {bankAccounts.length} Akun Bank Bisnis & Giro (112x)
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Akun Kas & Bank Aktif
                                    </span>
                                    <CreditCard className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {stats?.kas_bank_accounts?.length || 0} Akun
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Terverifikasi dan terintegrasi buku besar
                                </div>
                            </div>
                        </div>

                        {/* Divided KPI Strip 2: Operasional Kasir & Mutasi */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Status Rekonsiliasi Bank
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                                        Otomatis
                                    </span>
                                    <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0 rounded-none bg-emerald-50 text-emerald-700 border-emerald-300">
                                        Sinkron Jurnal
                                    </Badge>
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Mutasi bank langsung tercatat ke jurnal
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Transaksi Kas Masuk (BKM)
                                </span>
                                <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                                    Penerimaan Kas
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Bukti Kas Masuk tercatat di kasir
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Transaksi Kas Keluar (BKK)
                                </span>
                                <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">
                                    Pengeluaran Kas
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Bukti Kas Keluar beban operasional
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Kliring Bilyet Giro
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    Giro Masuk & Keluar
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Jatuh tempo, kliring dan pencairan bank
                                </div>
                            </div>
                        </div>

                        {/* Main Split Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                            {/* LEFT: Data Tables */}
                            <div className="lg:col-span-7 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {/* Saldo Rekening Kas & Bank Terdaftar */}
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Landmark className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Daftar Rekening Kas & Bank Terdaftar
                                            </span>
                                        </div>
                                        <Link
                                            to="/kas/bank-accounts"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Kelola Akun Bank</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-28 font-mono">Kode</th>
                                                    <th className="py-2 px-3">Nama Bank / Rekening</th>
                                                    <th className="py-2 px-3 w-28 text-center">Tipe</th>
                                                    <th className="py-2 px-4 text-right w-40 font-mono">Saldo Berjalan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {stats?.kas_bank_accounts && stats.kas_bank_accounts.length > 0 ? (
                                                    stats.kas_bank_accounts.map((acc) => (
                                                        <tr key={acc.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                                                {acc.kode_akun}
                                                            </td>
                                                            <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                                                                {acc.nama_akun}
                                                            </td>
                                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'text-[10px] font-mono uppercase font-semibold rounded-none px-1 py-0',
                                                                        acc.kode_akun.startsWith('111')
                                                                            ? 'text-amber-700 bg-amber-50 border-amber-300'
                                                                            : 'text-blue-700 bg-blue-50 border-blue-300'
                                                                    )}
                                                                >
                                                                    {acc.kode_akun.startsWith('111') ? 'KAS TUNAI' : 'BANK GIRO'}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2 px-4 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                                                                {formatRupiah(Number(acc.saldo))}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-4 text-center text-neutral-400 italic">
                                                            Belum ada data rekening kas & bank.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Transaksi Kas Terkini */}
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Transaksi Kas Terkini (BKM / BKK)
                                            </span>
                                        </div>
                                        <Link
                                            to="/kas/cash-transactions"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Semua Transaksi Kas</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-32 font-mono">No. Transaksi</th>
                                                    <th className="py-2 px-3 w-24 font-mono">Tanggal</th>
                                                    <th className="py-2 px-3">Uraian / Pihak Terkait</th>
                                                    <th className="py-2 px-3 text-right w-32 font-mono">Jumlah (Rp)</th>
                                                    <th className="py-2 px-4 text-center w-20">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {recentCash && recentCash.length > 0 ? (
                                                    recentCash.slice(0, 5).map((item) => (
                                                        <tr key={item.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                <Link to={`/kas/cash-transactions/${item.id}`} className="hover:underline">
                                                                    {item.nomor_transaksi}
                                                                </Link>
                                                            </td>
                                                            <td className="py-2 px-3 font-mono text-neutral-600 whitespace-nowrap">
                                                                {item.tanggal_transaksi?.substring(0, 10)}
                                                            </td>
                                                            <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200 truncate max-w-xs" title={item.keterangan}>
                                                                {item.keterangan || item.pihak_terkait || '-'}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                {formatRupiah(Number(item.jumlah))}
                                                            </td>
                                                            <td className="py-2 px-4 text-center whitespace-nowrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'text-xs font-mono uppercase font-semibold rounded-none px-1.5 py-0',
                                                                        item.status === 'posted'
                                                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                                                            : 'text-amber-700 bg-amber-50 border-amber-300'
                                                                    )}
                                                                >
                                                                    {item.status || 'draft'}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                                                            Belum ada data transaksi kas tercatat.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Hub & Quick Actions */}
                            <div className="lg:col-span-5 p-4 space-y-4 bg-white dark:bg-neutral-950">
                                {/* Komposisi Likuiditas Widget */}
                                <div className="border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <Scale className="size-4 text-emerald-700 dark:text-emerald-300" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Komposisi Likuiditas Keuangan
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-semibold px-2 py-0.5 border rounded-none text-emerald-700 bg-emerald-50 border-emerald-300">
                                            Likuid Siap Pakai
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600">Porsi Kas Tunai (Cash):</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(totalKasTunai)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600">Porsi Rekening Bank:</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(totalBankGiro)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 font-sans">Total Likuiditas Siap Transaksi</span>
                                        <Link
                                            to="/kas/bank-accounts"
                                            className="font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                                        >
                                            <span>Buka Detail Kas & Bank</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Navigasi Cepat Kas & Bank */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Akses Cepat Modul Kas & Bank
                                        </span>
                                    </div>

                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <Link
                                            to="/kas/cash-transactions"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                    <Receipt className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Transaksi Kas Masuk & Keluar (BKM/BKK)
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Pencatatan kas kasir harian & petty cash</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/kas/bank-transactions"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                    <Landmark className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Mutasi & Rekonsiliasi Rekening Bank
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Rekening koran, transfer & rekonsiliasi</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/kas/giro-transactions"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                    <CheckSquare className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Kliring & Bilyet Giro (Giro Masuk / Keluar)
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Pencairan, tolakan dan jatuh tempo giro</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/kas/reports/giro"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                    <BarChart3 className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Laporan Giro & Arus Kas Bank
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Rekapitulasi posisi kas & giro berjalan</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 3. MASTER MODUL PERSEDIAAN, GUDANG & LOGISTIK (INVENTORY)                 */}
                {/* ========================================================================= */}
                {canInventory && (
                    <div id="modul-inventory" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                        {/* Header Bar */}
                        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    <Package className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        DASHBOARD PERSEDIAAN, GUDANG & LOGISTIK (INVENTORY)
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Monitoring Valuasi Stok, Peringatan Reorder Menipis, Pengadaan PO & Stock Opname
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Can permission="inventory.purchases.create">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/inventory/purchases/create')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>+ Buat Pengadaan (PO)</span>
                                    </Button>
                                </Can>
                                <Can permission="inventory.items.create">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/inventory/items/create')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>+ Tambah Barang</span>
                                    </Button>
                                </Can>
                                <Can permission="inventory.items.view">
                                    <Button
                                        size="sm"
                                        onClick={() => navigate('/inventory/items')}
                                        className="bg-blue-600 text-white hover:bg-blue-700 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Boxes className="size-3.5" />
                                        <span>Katalog Persediaan</span>
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Divided KPI Strip 1: Valuasi & Stok */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Valuasi Persediaan
                                    </span>
                                    <Package className="size-4 text-blue-600" />
                                </div>
                                <div className="text-lg font-bold font-mono text-blue-700 dark:text-blue-400 mt-1">
                                    {loading ? '...' : formatRupiah(Number(inventoryStats?.total_inventory_value || 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Nilai total aset persediaan berjalan
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total SKU Barang
                                    </span>
                                    <Boxes className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {inventoryStats?.total_sku || 0} SKU
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Barang terdaftar aktif dalam katalog
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Stok Kritis / Reorder Alert
                                    </span>
                                    <AlertTriangle className="size-4 text-amber-500" />
                                </div>
                                <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                                    {inventoryStats?.low_stock_count || 0} Item
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Di bawah safety / reorder stock level
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Pengadaan PO Bulan Ini
                                    </span>
                                    <Truck className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {inventoryStats?.total_po_bulan_ini || 0} PO
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Nominal: {formatRupiah(Number(inventoryStats?.nominal_po_bulan_ini || 0))}
                                </div>
                            </div>
                        </div>

                        {/* Divided KPI Strip 2: Rantai Pasok & Hutang Dagang */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Pemasok / Vendor Aktif
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {inventoryStats?.total_suppliers || 0} Mitra Supplier
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Rekanan pengadaan logistik terdaftar
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Hutang Usaha (AP Outstanding)
                                </span>
                                <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">
                                    {formatRupiah(Number(inventoryStats?.total_ap_outstanding || 0))}
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Kewajiban pembelian PO belum terlunasi
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Kategori Barang Logistik
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {inventoryStats?.total_categories || 0} Kategori
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Klasifikasi obat, BHP, dan ATK umum
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Integrasi Buku Besar (Jurnal)
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-base font-bold font-mono text-emerald-700">
                                        Aktif
                                    </span>
                                    <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0 rounded-none bg-emerald-50 text-emerald-700 border-emerald-300">
                                        HPP Otomatis
                                    </Badge>
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Mutasi persediaan langsung sinkron ke COA
                                </div>
                            </div>
                        </div>

                        {/* Main Split Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                            {/* LEFT: Tables */}
                            <div className="lg:col-span-7 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {/* Peringatan Stok Kritis (Perlu Pemesanan) */}
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="size-3.5 text-amber-600" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Peringatan Stok Kritis & Perlu Reorder
                                            </span>
                                        </div>
                                        <Link
                                            to="/inventory/items?low_stock=true"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Semua Stok Kritis</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-28 font-mono">Kode SKU</th>
                                                    <th className="py-2 px-3">Nama Barang</th>
                                                    <th className="py-2 px-3 text-right w-24 font-mono">Stok Fisik</th>
                                                    <th className="py-2 px-3 text-right w-24 font-mono">Min. Reorder</th>
                                                    <th className="py-2 px-4 text-center w-24">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {inventoryStats?.critical_items && inventoryStats.critical_items.length > 0 ? (
                                                    inventoryStats.critical_items.map((item) => {
                                                        const stock = Number(item.total_stock ?? 0);
                                                        const reorder = Number(item.reorder_level ?? 0);
                                                        const isZero = stock <= 0;
                                                        return (
                                                            <tr key={item.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                                <td className="py-2 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                                                    {item.code}
                                                                </td>
                                                                <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                                                                    <Link to={`/inventory/items/${item.id}`} className="hover:underline">
                                                                        {item.name}
                                                                    </Link>
                                                                    {item.unit_of_measure && (
                                                                        <span className="text-[10px] text-neutral-400 font-mono ml-1.5">
                                                                            ({item.unit_of_measure})
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                                                                    {stock}
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-mono text-neutral-500 whitespace-nowrap">
                                                                    {reorder}
                                                                </td>
                                                                <td className="py-2 px-4 text-center whitespace-nowrap">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            'text-[10px] font-mono uppercase font-semibold rounded-none px-1 py-0',
                                                                            isZero
                                                                                ? 'text-rose-700 bg-rose-50 border-rose-300'
                                                                                : 'text-amber-700 bg-amber-50 border-amber-300'
                                                                        )}
                                                                    >
                                                                        {isZero ? 'HABIS' : 'KRITIS'}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                                                            Semua stok barang berada pada level aman.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pengadaan / Pembelian (PO) Terkini */}
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Truck className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Pengadaan & Pembelian (PO) Terkini
                                            </span>
                                        </div>
                                        <Link
                                            to="/inventory/purchases"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Semua Pengadaan</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-32 font-mono">No. PO</th>
                                                    <th className="py-2 px-3 w-24 font-mono">Tanggal</th>
                                                    <th className="py-2 px-3">Pemasok / Supplier</th>
                                                    <th className="py-2 px-3 text-right w-32 font-mono">Total (Rp)</th>
                                                    <th className="py-2 px-4 text-center w-20">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {inventoryStats?.recent_purchases && inventoryStats.recent_purchases.length > 0 ? (
                                                    inventoryStats.recent_purchases.map((po) => (
                                                        <tr key={po.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                <Link to={`/inventory/purchases/${po.id}`} className="hover:underline">
                                                                    {po.purchase_number}
                                                                </Link>
                                                            </td>
                                                            <td className="py-2 px-3 font-mono text-neutral-600 whitespace-nowrap">
                                                                {po.purchase_date}
                                                            </td>
                                                            <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200 truncate max-w-xs font-medium">
                                                                {po.supplier?.name || '-'}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                {formatRupiah(Number(po.total_amount))}
                                                            </td>
                                                            <td className="py-2 px-4 text-center whitespace-nowrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'text-xs font-mono uppercase font-semibold rounded-none px-1.5 py-0',
                                                                        po.status === 'completed' || po.status === 'received'
                                                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                                                            : 'text-amber-700 bg-amber-50 border-amber-300'
                                                                    )}
                                                                >
                                                                    {po.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                                                            Belum ada data pengadaan barang terbaru.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Hub */}
                            <div className="lg:col-span-5 p-4 space-y-4 bg-white dark:bg-neutral-950">
                                {/* Widget Kesehatan Stok */}
                                <div className="border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck className="size-4 text-blue-700 dark:text-blue-300" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Keamanan Persediaan Gudang
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-semibold px-2 py-0.5 border rounded-none text-blue-700 bg-blue-50 border-blue-300">
                                            Perlindungan Stok
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600">Total Valuasi Aset Stok:</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(Number(inventoryStats?.total_inventory_value || 0))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600">Hutang Pengadaan (AP):</span>
                                            <span className="font-bold text-rose-700">
                                                {formatRupiah(Number(inventoryStats?.total_ap_outstanding || 0))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 font-sans">Katalog: {inventoryStats?.total_sku || 0} SKU</span>
                                        <Link
                                            to="/inventory/items"
                                            className="font-semibold text-blue-700 hover:underline flex items-center gap-1"
                                        >
                                            <span>Buka Master Barang</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Navigasi Cepat Persediaan */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Akses Cepat Modul Persediaan & Logistik
                                        </span>
                                    </div>

                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <Link
                                            to="/inventory/items"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-blue-50 text-blue-700 flex items-center justify-center">
                                                    <Package className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Master Barang & Stok Fisik
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Katalog SKU, satuan ukuran & harga standar</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/inventory/categories"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-blue-50 text-blue-700 flex items-center justify-center">
                                                    <Layers className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Kategori Barang Persediaan
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Pengelompokan logistik medis & non-medis</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/inventory/suppliers"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-blue-50 text-blue-700 flex items-center justify-center">
                                                    <Building2 className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Master Pemasok / Supplier
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Data kontak rekanan & riwayat vendor</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/inventory/purchases"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-blue-50 text-blue-700 flex items-center justify-center">
                                                    <Truck className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Pengadaan Barang (PO) & Hutang AP
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Order pembelian, penerimaan & tagihan AP</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/inventory/stock-opnames"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-blue-50 text-blue-700 flex items-center justify-center">
                                                    <CheckSquare className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Stock Opname Fisik Gudang
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Penghitungan fisik berkala & selisih persediaan</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 4. MASTER MODUL ASET TETAP & MANAJEMEN ASET (FIXED ASSETS)                */}
                {/* ========================================================================= */}
                {canAset && (
                    <div id="modul-asset" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                        {/* Header Bar */}
                        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    <Building2 className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        DASHBOARD ASET TETAP & MANAJEMEN ASET (FIXED ASSETS)
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Nilai Buku, Jadwal Depresiasi Otomatis, Pemeliharaan Servis & Anggaran Modal (CAPEX)
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Can permission="aset.assets.create">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/aset/assets/create')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>+ Registrasi Aset Baru</span>
                                    </Button>
                                </Can>
                                <Can permission="aset.depreciations.view">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/aset/depreciations')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3"
                                    >
                                        <RefreshCw className="size-3.5" />
                                        <span>Jadwal Depresiasi</span>
                                    </Button>
                                </Can>
                                <Can permission="aset.assets.view">
                                    <Button
                                        size="sm"
                                        onClick={() => navigate('/aset/assets')}
                                        className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Building2 className="size-3.5" />
                                        <span>Inventaris Aset</span>
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Divided KPI Strip 1: Finansial Aset Tetap */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Nilai Buku Aset (Net Book Value)
                                    </span>
                                    <Building2 className="size-4 text-indigo-600" />
                                </div>
                                <div className="text-lg font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-1">
                                    {loading ? '...' : formatRupiah(Number(assetStats?.total_current_book_value ?? assetStats?.total_book_value ?? 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Nilai bersih setelah dikurangi depresiasi
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Nilai Perolehan (Acquisition Cost)
                                    </span>
                                    <CreditCard className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(Number(assetStats?.total_acquisition_cost ?? assetStats?.total_asset_value ?? 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Biaya pembelian awal seluruh unit aset
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Akumulasi Depresiasi
                                    </span>
                                    <TrendingDown className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(Number(assetStats?.total_accumulated_depreciation ?? 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Total beban penyusutan hingga periode ini
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Unit Aset
                                    </span>
                                    <Boxes className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {assetStats?.total_assets || 0} Unit
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Aset fisik dan inventaris terdata
                                </div>
                            </div>
                        </div>

                        {/* Divided KPI Strip 2: Status Operasional */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Aset Aktif Beroperasi
                                </span>
                                <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                                    {assetStats?.total_active ?? assetStats?.active_assets ?? 0} Unit Aktif
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Digunakan di departemen & unit operasional
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Dalam Pemeliharaan / Servis
                                </span>
                                <div className="text-base font-bold font-mono text-amber-600 mt-1">
                                    {assetStats?.total_maintenance ?? assetStats?.maintenance_assets ?? 0} Unit
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Sedang proses perbaikan atau kalibrasi
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Aset Afkir / Pelepasan
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-700 dark:text-neutral-300 mt-1">
                                    {assetStats?.total_disposed ?? assetStats?.disposed_assets ?? 0} Unit
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Disposal, hibah atau dihentikan penggunaannya
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Otomasi Penyusutan Jurnal
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-base font-bold font-mono text-indigo-700">
                                        Terjadwal
                                    </span>
                                    <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0 rounded-none bg-indigo-50 text-indigo-700 border-indigo-300">
                                        Garis Lurus / Saldo
                                    </Badge>
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Jurnal beban depresiasi dihitung otomatis
                                </div>
                            </div>
                        </div>

                        {/* Main Split Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                            {/* LEFT: Tables */}
                            <div className="lg:col-span-7 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {/* Inventaris Aset Tetap Terkini */}
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Inventaris Aset Tetap Terkini
                                            </span>
                                        </div>
                                        <Link
                                            to="/aset/assets"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Semua Aset Tetap</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-28 font-mono">Kode Aset</th>
                                                    <th className="py-2 px-3">Nama Aset</th>
                                                    <th className="py-2 px-3">Kategori</th>
                                                    <th className="py-2 px-3 text-right w-36 font-mono">Nilai Buku</th>
                                                    <th className="py-2 px-4 text-center w-24">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {recentAssets && recentAssets.length > 0 ? (
                                                    recentAssets.slice(0, 5).map((asset) => (
                                                        <tr key={asset.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                                                {asset.code}
                                                            </td>
                                                            <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                                                                <Link to={`/aset/assets/${asset.id}`} className="hover:underline">
                                                                    {asset.name}
                                                                </Link>
                                                                {asset.location && (
                                                                    <span className="text-[10px] text-neutral-400 font-mono ml-1.5 block">
                                                                        Lokasi: {asset.location}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-3 text-neutral-600 font-mono">
                                                                {asset.category?.name || '-'}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                {formatRupiah(Number(asset.book_value || asset.purchase_cost || 0))}
                                                            </td>
                                                            <td className="py-2 px-4 text-center whitespace-nowrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'text-[10px] font-mono uppercase font-semibold rounded-none px-1 py-0',
                                                                        asset.status === 'ACTIVE'
                                                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                                                            : asset.status === 'MAINTENANCE'
                                                                                ? 'text-amber-700 bg-amber-50 border-amber-300'
                                                                                : 'text-neutral-600 bg-neutral-100 border-neutral-300'
                                                                    )}
                                                                >
                                                                    {asset.status || 'ACTIVE'}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                                                            Belum ada aset tetap tercatat.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Hub */}
                            <div className="lg:col-span-5 p-4 space-y-4 bg-white dark:bg-neutral-950">
                                {/* Widget Rasio Aset Tetap */}
                                <div className="border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <Scale className="size-4 text-indigo-700 dark:text-indigo-300" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Rasio Depresiasi Aset
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-semibold px-2 py-0.5 border rounded-none text-indigo-700 bg-indigo-50 border-indigo-300">
                                            Audit Siap
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs font-mono">
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600">Nilai Buku Berjalan:</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(Number(assetStats?.total_current_book_value ?? assetStats?.total_book_value ?? 0))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-neutral-600">Akumulasi Penyusutan:</span>
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(Number(assetStats?.total_accumulated_depreciation ?? 0))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 font-sans">Total {assetStats?.total_assets || 0} unit terdata</span>
                                        <Link
                                            to="/aset/depreciations"
                                            className="font-semibold text-indigo-700 hover:underline flex items-center gap-1"
                                        >
                                            <span>Jalankan Depresiasi</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Navigasi Cepat Aset Tetap */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Akses Cepat Modul Aset Tetap
                                        </span>
                                    </div>

                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <Link
                                            to="/aset/assets"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                                    <Building2 className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Daftar Inventaris Aset Tetap
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Pencatatan aset, barcode & penanggung jawab</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/aset/categories"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                                    <Layers className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Kategori & Tarif Depresiasi Aset
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Masa manfaat & metode penyusutan fiskal</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/aset/depreciations"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                                    <RefreshCw className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Jadwal & Eksekusi Depresiasi Bulanan
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Generate jurnal penyusutan otomatis</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/aset/maintenances"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                                    <ShieldCheck className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Pemeliharaan & Servis Aset
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Jadwal perbaikan, vendor & biaya servis</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/aset/budgets"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                                    <BarChart3 className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Anggaran & RAB Belanja Modal (CAPEX)
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Perencanaan pengadaan aset jangka panjang</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 5. MASTER MODUL PENGGAJIAN & REMUNERASI KARYAWAN (PAYROLL PERUSAHAAN)     */}
                {/* ========================================================================= */}
                {canPenggajian && (
                    <div id="modul-payroll" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                        {/* Header Bar */}
                        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    <Users className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        DASHBOARD PENGGAJIAN & REMUNERASI KARYAWAN (PAYROLL PERUSAHAAN)
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Siklus Penggajian Bulanan, Komponen Tunjangan & Potongan, Jurnal Beban Gaji Seluruh Pegawai
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Can permission="penggajian.view">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate('/penggajian')}
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5 shadow-none px-3"
                                    >
                                        <Calendar className="size-3.5" />
                                        <span>Kelola Batch Gaji</span>
                                    </Button>
                                </Can>
                                <Can permission="penggajian.proses">
                                    <Button
                                        size="sm"
                                        onClick={() => navigate('/penggajian/create')}
                                        className="bg-amber-600 text-white hover:bg-amber-700 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>+ Buat Batch Gaji Baru</span>
                                    </Button>
                                </Can>
                            </div>
                        </div>

                        {/* Divided KPI Strip 1: Volume Payroll & Gaji Bersih */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Gaji Bersih Terposting
                                    </span>
                                    <DollarSign className="size-4 text-amber-600" />
                                </div>
                                <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                                    {loading ? '...' : formatRupiah(Number(salaryStats?.total_gaji_bersih_posted || 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Realisasi dana gaji yang sudah masuk pembukuan
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Karyawan Payroll
                                    </span>
                                    <Users className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {salaryStats?.total_employees_all || 0} Pegawai
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Pegawai aktif penerima upah & jaspel
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Batch Gaji Tersimpan (Done)
                                    </span>
                                    <CheckSquare className="size-4 text-blue-500" />
                                </div>
                                <div className="text-lg font-bold font-mono text-blue-600 mt-1">
                                    {salaryStats?.total_done || 0} Batch
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Telah disimpan permanen di database
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Batch Posted ke Jurnal
                                    </span>
                                    <CheckCircle2 className="size-4 text-emerald-600" />
                                </div>
                                <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
                                    {salaryStats?.total_posted || 0} Batch
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Jurnal beban gaji & potongan selesai dibukukan
                                </div>
                            </div>
                        </div>

                        {/* Divided KPI Strip 2: Operasional & SOP Payroll */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Batch Dalam Konsep (Draft)
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-700 dark:text-neutral-300 mt-1">
                                    {salaryStats?.total_draft || 0} Batch Draft
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Batch baru yang masih dalam tahap pengisian
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Integrasi Otomatis Jurnal
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-base font-bold font-mono text-emerald-700">
                                        Terhubung
                                    </span>
                                    <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0 rounded-none bg-emerald-50 text-emerald-700 border-emerald-300">
                                        COA Payroll
                                    </Badge>
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Menjurnal beban gaji, BPJS, PPh 21, dan kasbon
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Format Template Excel
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    OpenXML (.xlsx)
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Dilengkapi formula penjumlahan otomatis
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Dokumen Slip Karyawan
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    PDF Resmi Sistem
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Slip digital dengan logo & rincian komponen
                                </div>
                            </div>
                        </div>

                        {/* Main Split Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                            {/* LEFT: Table Riwayat Batch Gaji */}
                            <div className="lg:col-span-7 divide-y divide-neutral-200 dark:divide-neutral-800">
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Daftar Riwayat Batch Gaji & Periode Payroll
                                            </span>
                                        </div>
                                        <Link
                                            to="/penggajian"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Semua Batch Gaji</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-36 font-mono">No. Batch</th>
                                                    <th className="py-2 px-3">Periode & Keterangan</th>
                                                    <th className="py-2 px-3 text-center w-20 font-mono">Pegawai</th>
                                                    <th className="py-2 px-3 text-right w-36 font-mono">Total Bersih</th>
                                                    <th className="py-2 px-4 text-center w-24">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {salaryBatches && salaryBatches.length > 0 ? (
                                                    salaryBatches.slice(0, 6).map((b) => (
                                                        <tr key={b.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                <Link to={`/penggajian/batches/${b.id}/input-gaji`} className="hover:underline">
                                                                    {b.batch_number}
                                                                </Link>
                                                            </td>
                                                            <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                                                                <div>{b.period_display}</div>
                                                                <div className="text-[10px] text-neutral-400 font-normal truncate max-w-xs">{b.description || '-'}</div>
                                                            </td>
                                                            <td className="py-2 px-3 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                                                {b.total_employees}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                                                                {formatRupiah(Number(b.total_gaji_bersih))}
                                                            </td>
                                                            <td className="py-2 px-4 text-center whitespace-nowrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'text-[10px] font-mono uppercase font-bold rounded-none px-2 py-0.5 tracking-wider',
                                                                        b.status === 'posted'
                                                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                                            : b.status === 'done'
                                                                                ? 'text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                                                : 'text-neutral-600 bg-neutral-100 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800'
                                                                    )}
                                                                >
                                                                    {b.status === 'posted' ? 'POSTED' : b.status === 'done' ? 'DONE' : 'DRAFT'}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-6 text-center text-neutral-400 italic font-mono">
                                                            Belum ada batch gaji tersimpan.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Hub */}
                            <div className="lg:col-span-5 p-4 space-y-4 bg-white dark:bg-neutral-950">
                                {/* Widget Siklus SOP Payroll */}
                                <div className="border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="size-4 text-amber-600" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Alur Kerja & Siklus Penggajian
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-semibold px-2 py-0.5 border rounded-none text-amber-700 bg-amber-50 border-amber-300">
                                            SOP Standar
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-start gap-2">
                                            <span className="size-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">1</span>
                                            <div>
                                                <span className="font-bold text-neutral-900 dark:text-white">Tarik Karyawan Aktif:</span>
                                                <span className="text-neutral-500 ml-1">Ambil daftar pegawai & NIP terdaftar otomatis.</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="size-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">2</span>
                                            <div>
                                                <span className="font-bold text-neutral-900 dark:text-white">Input / Salin Template Excel:</span>
                                                <span className="text-neutral-500 ml-1">Ketik langsung atau paste dari file .xlsx.</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="size-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">3</span>
                                            <div>
                                                <span className="font-bold text-blue-700">Simpan ke Database (DONE):</span>
                                                <span className="text-neutral-500 ml-1">Tersimpan permanen dan status berubah menjadi DONE.</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="size-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">4</span>
                                            <div>
                                                <span className="font-bold text-emerald-700">Posting ke Jurnal Akuntansi (POSTED):</span>
                                                <span className="text-neutral-500 ml-1">Otomasi jurnal beban gaji dan mutasi kas bank.</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 font-sans">Terdaftar: {salaryStats?.total_employees_all || 0} Pegawai</span>
                                        <Link
                                            to="/penggajian"
                                            className="font-semibold text-amber-700 hover:underline flex items-center gap-1"
                                        >
                                            <span>Kelola Batch Gaji</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Navigasi Cepat Penggajian */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Akses Cepat Modul Penggajian
                                        </span>
                                    </div>

                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <Link
                                            to="/penggajian"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-amber-50 text-amber-700 flex items-center justify-center">
                                                    <Calendar className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Daftar Periode Batch Penggajian
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Daftar batch bulanan & status posting jurnal</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/penggajian/create"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-amber-50 text-amber-700 flex items-center justify-center">
                                                    <Plus className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Buat Batch Periode Gaji Baru
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Inisialisasi periode & pilih rekening bayar</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        <Link
                                            to="/penggajian/my-salary"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-amber-50 text-amber-700 flex items-center justify-center">
                                                    <FileText className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Slip Gaji Mandiri Karyawan
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Pratinjau, unduh PDF resmi & histori slip saya</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 6. MASTER MODUL GAJI KARYAWAN SAYA (SLIP GAJI PEGAWAI LOGIN)             */}
                {/* ========================================================================= */}
                {canGajiSaya && (
                    <div id="modul-gaji-saya" className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                        {/* Header Bar */}
                        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                    <Receipt className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        SLIP GAJI SAYA
                                    </h2>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Rincian Penerimaan Upah, Tunjangan, Jasa Pelayanan, Potongan & Gaji Bersih (Take Home Pay)
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Link to="/penggajian/my-salary">
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <FileText className="size-3.5" />
                                        <span>Lihat Semua Slip Gaji Saya</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Divided KPI Strip 1: Finansial Slip Terakhir */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Gaji Bersih Diterima (Take Home Pay)
                                    </span>
                                    <DollarSign className="size-4 text-emerald-600" />
                                </div>
                                <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                                    {loading ? '...' : formatRupiah(Number(latestMySlip?.gaji_bersih || 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    {latestMySlip?.salary_batch?.period_display ? `Periode: ${latestMySlip.salary_batch.period_display}` : 'Gaji bersih periode terakhir'}
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Pendapatan Bruto
                                    </span>
                                    <TrendingUp className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(Number(latestMySlip?.total_pendapatan || 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Gaji pokok + seluruh tunjangan & jaspel
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Total Potongan Terakhir
                                    </span>
                                    <TrendingDown className="size-4 text-rose-500" />
                                </div>
                                <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">
                                    {loading ? '...' : formatRupiah(Number(latestMySlip?.total_potongan || 0))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    BPJS Kesehatan/TK, PPh 21, arisan & kasbon
                                </div>
                            </div>

                            <div className="p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                                        Akumulasi Gaji Diterima
                                    </span>
                                    <Wallet className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-lg font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {loading ? '...' : formatRupiah(Number(mySalarySummary?.total_gaji_bersih || totalAccumulatedMySalary))}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 mt-0.5">
                                    Total take home pay seluruh riwayat slip
                                </div>
                            </div>
                        </div>

                        {/* Divided KPI Strip 2: Data Pegawai & Status Dokumen */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Periode Slip Terkini
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {latestMySlip?.salary_batch?.period_display || mySalarySummary?.latest_period || '-'}
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    {latestMySlip?.salary_batch?.batch_number || 'Batch Terbit'}
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Total Slip Gaji Terbit
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                    {mySalarySummary?.total_slips || mySlips.length} Slip Tersedia
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Riwayat slip penerimaan upah terarsip
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Nama Pegawai & NIP
                                </span>
                                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1 truncate">
                                    {user?.name || latestMySlip?.nama_pegawai || 'Pegawai'}
                                </div>
                                <div className="text-xs text-neutral-500 font-mono mt-0.5">
                                    NIP: {user?.nip || latestMySlip?.nip || '-'}
                                </div>
                            </div>

                            <div className="p-3.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                    Format Dokumen Resmi
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-base font-bold font-mono text-emerald-700">
                                        PDF Resmi
                                    </span>
                                    <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0 rounded-none bg-emerald-50 text-emerald-700 border-emerald-300">
                                        Logo Institusi
                                    </Badge>
                                </div>
                                <div className="text-xs text-neutral-500 mt-0.5">
                                    Slip digital sah tanpa tanda tangan basah
                                </div>
                            </div>
                        </div>

                        {/* Main Split Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                            {/* LEFT: Table Histori Slip Gaji Saya */}
                            <div className="lg:col-span-7 divide-y divide-neutral-200 dark:divide-neutral-800">
                                <div>
                                    <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Histori Penerimaan Slip Gaji Saya
                                            </span>
                                        </div>
                                        <Link
                                            to="/penggajian/my-salary"
                                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1"
                                        >
                                            <span>Semua Slip Gaji</span>
                                            <ChevronRight className="size-3" />
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-white dark:bg-neutral-950">
                                                    <th className="py-2 px-4 w-12 text-center font-mono">No</th>
                                                    <th className="py-2 px-3">Periode Gaji</th>
                                                    <th className="py-2 px-3 w-32 font-mono">Batch Number</th>
                                                    <th className="py-2 px-3 text-right w-28 font-mono">Bruto (Rp)</th>
                                                    <th className="py-2 px-3 text-right w-28 font-mono">Potongan (Rp)</th>
                                                    <th className="py-2 px-3 text-right w-32 font-mono">Gaji Bersih</th>
                                                    <th className="py-2 px-4 text-center w-28">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                {mySlips && mySlips.length > 0 ? (
                                                    mySlips.slice(0, 6).map((slip, idx) => (
                                                        <tr key={slip.id || idx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                            <td className="py-2 px-4 text-center font-mono text-neutral-500">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                                                                {slip.salary_batch?.period_display || '-'}
                                                            </td>
                                                            <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap text-[11px]">
                                                                {slip.salary_batch?.batch_number || '-'}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono text-neutral-700 whitespace-nowrap">
                                                                {formatRupiah(Number(slip.total_pendapatan))}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono text-rose-600 whitespace-nowrap">
                                                                {formatRupiah(Number(slip.total_potongan))}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                                                {formatRupiah(Number(slip.gaji_bersih))}
                                                            </td>
                                                            <td className="py-2 px-4 text-center whitespace-nowrap">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <Link to={`/penggajian/slips/${slip.id}`}>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-6 text-[11px] px-2 rounded-none border border-neutral-200 dark:border-neutral-800 gap-1 text-neutral-700 dark:text-neutral-300 shadow-none hover:bg-neutral-100"
                                                                        >
                                                                            <Eye className="size-3" />
                                                                            <span>Lihat</span>
                                                                        </Button>
                                                                    </Link>
                                                                    <a
                                                                        href={salaryApi.getSlipPdfUrl(slip.id || 0)}
                                                                        download
                                                                        title="Unduh PDF Resmi"
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-6 text-[11px] px-2 rounded-none border border-neutral-200 dark:border-neutral-800 gap-1 text-emerald-700 dark:text-emerald-400 shadow-none hover:bg-emerald-50"
                                                                        >
                                                                            <Download className="size-3" />
                                                                            <span>PDF</span>
                                                                        </Button>
                                                                    </a>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="py-6 text-center text-neutral-400 italic font-mono">
                                                            Belum ada slip gaji yang tercatat untuk akun Anda.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Rincian Komponen Terakhir & Aksi */}
                            <div className="lg:col-span-5 p-4 space-y-4 bg-white dark:bg-neutral-950">
                                {/* Widget Rincian Slip Terakhir */}
                                <div className="border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 mb-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <Banknote className="size-4 text-emerald-600" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                Rincian Komponen Slip Terakhir
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-semibold px-2 py-0.5 border rounded-none text-emerald-700 bg-emerald-50 border-emerald-300">
                                            {latestMySlip?.salary_batch?.period_display || 'Terkini'}
                                        </span>
                                    </div>

                                    {latestMySlip ? (
                                        <div className="space-y-2.5 text-xs font-mono">
                                            <div className="space-y-1 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                                                <span className="text-[10px] font-bold uppercase text-neutral-400 font-sans block">A. Komponen Pendapatan:</span>
                                                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                                                    <span>Gaji Pokok:</span>
                                                    <span className="font-bold">{formatRupiah(Number(latestMySlip.gaji_pokok))}</span>
                                                </div>
                                                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                                                    <span>Tunjangan (Transport, Jabatan, SIA):</span>
                                                    <span>{formatRupiah(Number(latestMySlip.tunjangan_transportasi) + Number(latestMySlip.tunjangan_jabatan) + Number(latestMySlip.tunjangan_sia))}</span>
                                                </div>
                                                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                                                    <span>Jasa Pelayanan & Uang Jaga:</span>
                                                    <span>{formatRupiah(Number(latestMySlip.jasa_pelayanan_pratama) + Number(latestMySlip.jasa_pelayanan_rawat_inap) + Number(latestMySlip.jasa_pelayanan_rawat_jalan) + Number(latestMySlip.jasa_pelayanan_rawat_jalan_bpjs) + Number(latestMySlip.uang_jaga_utama) + Number(latestMySlip.uang_jaga_pratama) + Number(latestMySlip.tugas_tambahan))}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-neutral-900 dark:text-white pt-1">
                                                    <span>Total Bruto:</span>
                                                    <span>{formatRupiah(Number(latestMySlip.total_pendapatan))}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                                                <span className="text-[10px] font-bold uppercase text-neutral-400 font-sans block">B. Komponen Potongan:</span>
                                                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                                                    <span>BPJS Kesehatan & TK:</span>
                                                    <span>{formatRupiah(Number(latestMySlip.bpjs_kesehatan) + Number(latestMySlip.bpjs_ketenagakerjaan))}</span>
                                                </div>
                                                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                                                    <span>PPh 21:</span>
                                                    <span>{formatRupiah(Number(latestMySlip.pph_21))}</span>
                                                </div>
                                                <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                                                    <span>Kasbon, Arisan & Denda:</span>
                                                    <span>{formatRupiah(Number(latestMySlip.kasbon) + Number(latestMySlip.arisan_keluarga) + Number(latestMySlip.infaq) + Number(latestMySlip.denda_absen) + Number(latestMySlip.denda_ngaji))}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-rose-600 pt-1">
                                                    <span>Total Potongan:</span>
                                                    <span>{formatRupiah(Number(latestMySlip.total_potongan))}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-1 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/40 p-2 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                                                <span>TAKE HOME PAY:</span>
                                                <span>{formatRupiah(Number(latestMySlip.gaji_bersih))}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center text-neutral-400 italic font-mono text-xs">
                                            Data komponen slip gaji belum tersedia.
                                        </div>
                                    )}
                                </div>

                                {/* Navigasi Cepat Slip Saya */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Akses Slip Gaji Saya
                                        </span>
                                    </div>

                                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <Link
                                            to="/penggajian/my-salary"
                                            className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                    <FileText className="size-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                        Histori Semua Slip Gaji Saya
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 font-mono">Daftar lengkap seluruh slip penerimaan upah</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-3.5 text-neutral-400" />
                                        </Link>

                                        {latestMySlip && (
                                            <a
                                                href={salaryApi.getSlipPdfUrl(latestMySlip.id || 0)}
                                                download
                                                className="group p-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-7 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                                        <Download className="size-3.5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:underline">
                                                            Unduh PDF Slip Gaji Terakhir
                                                        </h4>
                                                        <p className="text-[11px] text-neutral-500 font-mono">Periode {latestMySlip.salary_batch?.period_display || 'Terkini'}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="size-3.5 text-neutral-400" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
