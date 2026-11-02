import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    RefreshCw,
    Calendar,
    Activity,
    DollarSign,
    Info,
    PieChart,
    Wallet,
    Building2,
    TrendingUp,
    ShieldCheck,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/api/client';
import type { AnalisisRasioResponse } from '@/types/accounting';

export const LaporanAnalisisRasio: React.FC = () => {
    const navigate = useNavigate();

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(defaultStart);
    const [endDate, setEndDate] = useState<string>(defaultEnd);
    const [includePenyesuaian, setIncludePenyesuaian] = useState<boolean>(true);

    const [data, setData] = useState<AnalisisRasioResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const breadcrumbs = [
        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Laporan Keuangan', href: '/akuntansi/laporan-keuangan' },
        { title: 'Analisis Rasio Keuangan', href: '/akuntansi/laporan-keuangan/analisis-rasio' },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/laporan/analisis-rasio', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    include_penyesuaian: includePenyesuaian,
                },
            });
            setData(res.data?.data || null);
        } catch {
            toast.error('Gagal memuat analisis rasio keuangan');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, includePenyesuaian]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatRupiah = (val: number | string | undefined): string => {
        const num = typeof val === 'number' ? val : parseFloat(val || '0');
        if (isNaN(num)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatRatio = (val: number | undefined): string => {
        if (val === undefined || isNaN(val)) return '0.00';
        return val.toFixed(2);
    };

    const formatPercent = (val: number | undefined): string => {
        if (val === undefined || isNaN(val)) return '0.00%';
        return (val * 100).toFixed(2) + '%';
    };

    const formatDateDisplay = (dateStr: string): string => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // Helper status rasio likuiditas
    const getCurrentRatioStatus = (r: number) => {
        if (r >= 2.0) return { label: 'Sangat Baik (Prima)', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' };
        if (r >= 1.0) return { label: 'Baik (Aman)', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' };
        return { label: 'Perlu Perhatian', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' };
    };

    const getQuickRatioStatus = (r: number) => {
        if (r >= 1.0) return { label: 'Baik (Cepat)', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' };
        if (r >= 0.5) return { label: 'Cukup', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' };
        return { label: 'Kurang', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' };
    };

    const getCashRatioStatus = (r: number) => {
        if (r >= 0.5) return { label: 'Sangat Likuid', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' };
        if (r >= 0.2) return { label: 'Memadai', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' };
        return { label: 'Rendah', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' };
    };

    // Helper status rasio solvabilitas
    const getDebtToAssetStatus = (r: number) => {
        if (r <= 0.5) return { label: 'Aman (< 50%)', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' };
        if (r <= 0.7) return { label: 'Moderat (50-70%)', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' };
        return { label: 'Tinggi (> 70%)', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' };
    };

    const getDebtToEquityStatus = (r: number) => {
        if (r <= 1.0) return { label: 'Sehat (DER <= 1x)', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' };
        if (r <= 2.0) return { label: 'Terkendali (1-2x)', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' };
        return { label: 'Berisiko (> 2x)', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' };
    };

    const currentRatio = data?.current_ratio || 0;
    const quickRatio = data?.quick_ratio || 0;
    const cashRatio = data?.cash_ratio || 0;
    const debtToAsset = data?.debt_to_asset_ratio || 0;
    const debtToEquity = data?.debt_to_equity_ratio || 0;

    const modalKerjaNum = Number(data?.modal_kerja || 0);

    const curStatus = getCurrentRatioStatus(currentRatio);
    const qStatus = getQuickRatioStatus(quickRatio);
    const cStatus = getCashRatioStatus(cashRatio);
    const dtaStatus = getDebtToAssetStatus(debtToAsset);
    const dteStatus = getDebtToEquityStatus(debtToEquity);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* Unified Single Container (Tanpa card di dalam card) */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar: Title & Back Button */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/akuntansi/laporan-keuangan')}
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    title="Kembali ke Daftar Laporan"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>

                                <div className="size-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0">
                                    <PieChart className="size-4" />
                                </div>

                                <div>
                                    <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white uppercase font-mono">
                                        ANALISIS RASIO KEUANGAN (FINANCIAL RATIOS)
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Periode: {formatDateDisplay(startDate)} s/d {formatDateDisplay(endDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono px-2 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 uppercase">
                                    METRIK MANAJERIAL & AUDIT
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Shaded Parameter Filter Strip */}
                    <div className="bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Rentang Tanggal */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono whitespace-nowrap">
                                    <Calendar className="size-3.5 inline mr-1 text-neutral-400" />
                                    Rentang:
                                </span>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-8 w-36 text-xs rounded-none border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-mono"
                                />
                                <span className="text-[11px] font-mono text-neutral-400">s/d</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-8 w-36 text-xs rounded-none border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-mono"
                                />
                            </div>

                            {/* Toggle Jurnal Penyesuaian */}
                            <div className="flex items-center gap-2 pl-3 border-l border-neutral-300 dark:border-neutral-700">
                                <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        id="ajp-toggle"
                                        checked={includePenyesuaian}
                                        onChange={(e) => setIncludePenyesuaian(e.target.checked)}
                                        className="rounded-none border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0 size-3.5"
                                    />
                                    <span>Sertakan Penyesuaian (AJP)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={fetchData}
                                disabled={loading}
                                className="h-8 text-xs font-semibold rounded-none bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 gap-1.5 px-3"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                                <span>Segarkan</span>
                            </Button>
                        </div>
                    </div>

                    {/* 3. Strip Ringkasan Saldo Pokok (KPI Strip Terintegrasi) */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono mb-1">
                                    Total Aset Lancar
                                </div>
                                <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                    {formatRupiah(data?.total_aset_lancar)}
                                </div>
                                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                                    Kas: {formatRupiah(data?.total_kas)}
                                </div>
                            </div>

                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono mb-1">
                                    Kewajiban Lancar
                                </div>
                                <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                    {formatRupiah(data?.total_kewajiban_lancar)}
                                </div>
                                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                                    Hutang jangka pendek
                                </div>
                            </div>

                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono mb-1">
                                    Modal Kerja (NWC)
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    modalKerjaNum < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'
                                )}>
                                    {formatRupiah(modalKerjaNum)}
                                </div>
                                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                                    Aset Lancar - Kewajiban Lancar
                                </div>
                            </div>

                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono mb-1">
                                    Total Kewajiban
                                </div>
                                <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                    {formatRupiah(data?.total_kewajiban)}
                                </div>
                                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                                    Seluruh liabilitas
                                </div>
                            </div>

                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono mb-1">
                                    Total Ekuitas
                                </div>
                                <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                    {formatRupiah(data?.total_ekuitas)}
                                </div>
                                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                                    Modal + Laba berjalan
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Tabel Tunggal Analisis Rasio (Direct Table - Tanpa Card Di Dalam Card) */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="py-3 px-4 w-60">Indikator Rasio</th>
                                    <th className="py-3 px-4 w-80">Rumus / Formula</th>
                                    <th className="py-3 px-4 text-center w-40">Nilai Rasio</th>
                                    <th className="py-3 px-4 text-center w-52">Status Evaluasi</th>
                                    <th className="py-3 px-4">Skala Acuan & Benchmark Standar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {/* SECTION 1: LIKUIDITAS */}
                                <tr className="bg-neutral-50/80 dark:bg-neutral-900/50 font-bold border-y border-neutral-200 dark:border-neutral-800">
                                    <td colSpan={5} className="py-2.5 px-4 text-xs tracking-wider uppercase font-mono text-neutral-900 dark:text-neutral-100">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                                            <span>1. Rasio Likuiditas (Liquidity Ratios)</span>
                                            <span className="text-[11px] text-neutral-500 font-normal font-sans ml-2 hidden sm:inline">
                                                — Mengukur kemampuan entitas melunasi kewajiban jangka pendek tepat waktu
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Current Ratio */}
                                <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition">
                                    <td className="py-3 px-4">
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Current Ratio</div>
                                        <div className="text-[11px] text-neutral-400 font-mono">Rasio Lancar</div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        Total Aset Lancar / Total Kewajiban Lancar
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-extrabold text-base text-neutral-900 dark:text-neutral-100">
                                        {formatRatio(currentRatio)}x
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant="outline" className={cn('text-[11px] font-mono rounded-none', curStatus.color)}>
                                            {curStatus.label}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">≥ 2.0x (Sangat Baik)</span>
                                        {'  |  '}
                                        <span className="text-blue-700 dark:text-blue-400">1.0x - 2.0x (Baik)</span>
                                        {'  |  '}
                                        <span className="text-rose-600 dark:text-rose-400">&lt; 1.0x (Perlu Perhatian)</span>
                                    </td>
                                </tr>

                                {/* Quick Ratio */}
                                <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition">
                                    <td className="py-3 px-4">
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Quick Ratio</div>
                                        <div className="text-[11px] text-neutral-400 font-mono">Acid-Test Ratio (Rasio Cepat)</div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        (Aset Lancar - Persediaan) / Kewajiban Lancar
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-extrabold text-base text-neutral-900 dark:text-neutral-100">
                                        {formatRatio(quickRatio)}x
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant="outline" className={cn('text-[11px] font-mono rounded-none', qStatus.color)}>
                                            {qStatus.label}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">≥ 1.0x (Baik)</span>
                                        {'  |  '}
                                        <span className="text-blue-700 dark:text-blue-400">0.5x - 1.0x (Cukup)</span>
                                        {'  |  '}
                                        <span className="text-rose-600 dark:text-rose-400">&lt; 0.5x (Kurang)</span>
                                    </td>
                                </tr>

                                {/* Cash Ratio */}
                                <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition">
                                    <td className="py-3 px-4">
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Cash Ratio</div>
                                        <div className="text-[11px] text-neutral-400 font-mono">Rasio Kas & Setara Kas</div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        Total Saldo Kas & Bank / Kewajiban Lancar
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-extrabold text-base text-neutral-900 dark:text-neutral-100">
                                        {formatRatio(cashRatio)}x
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant="outline" className={cn('text-[11px] font-mono rounded-none', cStatus.color)}>
                                            {cStatus.label}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">≥ 0.5x (Sangat Likuid)</span>
                                        {'  |  '}
                                        <span className="text-blue-700 dark:text-blue-400">0.2x - 0.5x (Memadai)</span>
                                        {'  |  '}
                                        <span className="text-amber-600 dark:text-amber-400">&lt; 0.2x (Rendah)</span>
                                    </td>
                                </tr>

                                {/* SECTION 2: SOLVABILITAS */}
                                <tr className="bg-neutral-50/80 dark:bg-neutral-900/50 font-bold border-y border-neutral-200 dark:border-neutral-800">
                                    <td colSpan={5} className="py-2.5 px-4 text-xs tracking-wider uppercase font-mono text-neutral-900 dark:text-neutral-100">
                                        <div className="flex items-center gap-2">
                                            <Activity className="size-4 text-purple-600 dark:text-purple-400" />
                                            <span>2. Rasio Solvabilitas & Struktur Permodalan (Solvency / Leverage)</span>
                                            <span className="text-[11px] text-neutral-500 font-normal font-sans ml-2 hidden sm:inline">
                                                — Mengukur kemampuan entitas melunasi seluruh hutang jangka panjang dan porsi ekuitas
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Debt to Asset Ratio (DAR) */}
                                <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition">
                                    <td className="py-3 px-4">
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Debt to Asset Ratio (DAR)</div>
                                        <div className="text-[11px] text-neutral-400 font-mono">Rasio Utang Terhadap Aset</div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        Total Seluruh Kewajiban / Total Seluruh Aset
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-extrabold text-base text-purple-700 dark:text-purple-400">
                                        {formatPercent(debtToAsset)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant="outline" className={cn('text-[11px] font-mono rounded-none', dtaStatus.color)}>
                                            {dtaStatus.label}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">&lt; 50% (Aman / Konservatif)</span>
                                        {'  |  '}
                                        <span className="text-blue-700 dark:text-blue-400">50% - 70% (Moderat)</span>
                                        {'  |  '}
                                        <span className="text-rose-600 dark:text-rose-400">&gt; 70% (Tinggi / Berisiko)</span>
                                    </td>
                                </tr>

                                {/* Debt to Equity Ratio (DER) */}
                                <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition">
                                    <td className="py-3 px-4">
                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">Debt to Equity Ratio (DER)</div>
                                        <div className="text-[11px] text-neutral-400 font-mono">Rasio Utang Terhadap Modal</div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                        Total Seluruh Kewajiban / Total Ekuitas Modal
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-extrabold text-base text-purple-700 dark:text-purple-400">
                                        {formatPercent(debtToEquity)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant="outline" className={cn('text-[11px] font-mono rounded-none', dteStatus.color)}>
                                            {dteStatus.label}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">&lt; 100% (Sehat / Rendah Risiko)</span>
                                        {'  |  '}
                                        <span className="text-blue-700 dark:text-blue-400">100% - 200% (Terkendali)</span>
                                        {'  |  '}
                                        <span className="text-rose-600 dark:text-rose-400">&gt; 200% (High Leverage)</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Catatan Kaki Analisis Manajerial & Audit */}
                    <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-start gap-2.5">
                        <Info className="size-4 text-neutral-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Catatan Interpretasi:</span>{' '}
                            Seluruh angka rasio keuangan dikalkulasikan secara otomatis dari buku besar akun riil dan laba berjalan hingga tanggal posisi yang dipilih.
                            Angka benchmark di atas mengacu pada standar umum akuntansi manajemen dan dapat disesuaikan dengan regulasi sektor industri entitas.
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default LaporanAnalisisRasio;
