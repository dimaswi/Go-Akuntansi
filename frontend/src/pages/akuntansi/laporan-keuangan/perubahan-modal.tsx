import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { PerubahanModalResponse } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah, cn } from '@/lib/utils';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Activity,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    Scale,
    Building2,
    Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Laporan Keuangan', href: '/akuntansi/laporan-keuangan' },
    { title: 'Perubahan Modal' },
];

export default function LaporanPerubahanModal() {
    const navigate = useNavigate();

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [includePenyesuaian, setIncludePenyesuaian] = useState(true);
    const [data, setData] = useState<PerubahanModalResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Collapsible for monthly retained earnings breakdown
    const [expandedLabaDitahan, setExpandedLabaDitahan] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/laporan/perubahan-modal', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    include_penyesuaian: includePenyesuaian,
                },
            });
            setData(res.data?.data || null);
        } catch {
            toast.error('Gagal memuat laporan perubahan modal');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, includePenyesuaian]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saldoAwalModal = Number(data?.saldo_awal_modal || 0);
    const labaDitahan = Number(data?.laba_ditahan || 0);
    const labaRugiPeriode = Number(data?.laba_rugi_periode || 0);
    const tambahanInvestasi = Number(data?.tambahan_investasi || 0);
    const penarikan = Number(data?.penarikan || 0);
    const saldoAkhirModal = Number(data?.saldo_akhir_modal || 0);
    const detailLabaDitahan = data?.detail_laba_ditahan_per_bulan || [];
    const detailModal = data?.detail_modal || [];

    const formattedStartDate = useMemo(() => {
        if (!startDate) return '';
        try {
            return new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return startDate;
        }
    }, [startDate]);

    const formattedEndDate = useMemo(() => {
        if (!endDate) return '';
        try {
            return new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return endDate;
        }
    }, [endDate]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Icon-Only Back Button + Title on Left, Empty beside Title */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/akuntansi/laporan-keuangan')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali ke Daftar Laporan"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Scale className="size-4" />
                            </div>

                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Laporan Perubahan Modal (Statement of Changes in Equity)
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono">
                                    Periode: {formattedStartDate} s/d {formattedEndDate}
                                    {' • '}
                                    {includePenyesuaian ? 'Termasuk Jurnal Penyesuaian (AJP)' : 'Tanpa Penyesuaian'}
                                    {' • Standar Akuntansi Keuangan (SAK ETAP)'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={includePenyesuaian}
                                    onChange={(e) => setIncludePenyesuaian(e.target.checked)}
                                    className="rounded-none border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0 size-3.5"
                                />
                                <span>Sertakan Jurnal Penyesuaian (AJP)</span>
                            </label>
                            <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                                Memasukkan penyesuaian akhir periode buku
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                                Rentang:
                            </span>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-8 w-36 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                            />
                            <span className="text-[11px] font-mono text-neutral-400">s/d</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-8 w-36 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                            />
                        </div>
                    </div>

                    {/* 3. Summary Metric Cards (KPI) */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {/* Saldo Awal Modal */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Saldo Awal Modal
                                    </span>
                                    <Building2 className="size-3.5 text-neutral-400" />
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    saldoAwalModal < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-900 dark:text-neutral-100'
                                )}>
                                    {formatRupiah(saldoAwalModal)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Sebelum {formattedStartDate}
                                </span>
                            </div>

                            {/* Laba Ditahan */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Laba Ditahan
                                    </span>
                                    <Activity className="size-3.5 text-blue-600" />
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    labaDitahan < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-blue-600 dark:text-blue-400'
                                )}>
                                    {formatRupiah(labaDitahan)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Akumulasi periode lalu
                                </span>
                            </div>

                            {/* Laba Rugi Periode */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Laba/Rugi Berjalan
                                    </span>
                                    {labaRugiPeriode >= 0 ? (
                                        <TrendingUp className="size-3.5 text-emerald-600" />
                                    ) : (
                                        <TrendingDown className="size-3.5 text-rose-600" />
                                    )}
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    labaRugiPeriode < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'
                                )}>
                                    {formatRupiah(labaRugiPeriode)}
                                </div>
                                <span className="text-[11px] font-mono block mt-0.5">
                                    {labaRugiPeriode >= 0 ? (
                                        <span className="text-emerald-600 font-semibold">SURPLUS BERJALAN</span>
                                    ) : (
                                        <span className="text-rose-600 font-semibold">DEFISIT BERJALAN</span>
                                    )}
                                </span>
                            </div>

                            {/* Mutasi Modal Bersih */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Investasi / (Prive)
                                    </span>
                                    <Scale className="size-3.5 text-neutral-400" />
                                </div>
                                <div className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                    {formatRupiah(tambahanInvestasi - penarikan)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Inv: {formatRupiah(tambahanInvestasi)} | Prive: {formatRupiah(penarikan)}
                                </span>
                            </div>

                            {/* Saldo Akhir Modal */}
                            <div className="p-3 border border-neutral-900 dark:border-neutral-700 bg-neutral-900 text-white dark:bg-neutral-900">
                                <div className="flex items-center justify-between text-neutral-400 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Saldo Akhir Modal
                                    </span>
                                    <Scale className="size-3.5 text-emerald-400" />
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    saldoAkhirModal < 0 ? 'text-rose-400 font-semibold' : 'text-white'
                                )}>
                                    {formatRupiah(saldoAkhirModal)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Per {formattedEndDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Format Laporan Perubahan Modal Formal (Sesuai SAK ETAP) */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="px-4 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Ringkasan Perhitungan Perubahan Modal
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                    Metode Standar Akuntansi
                                </span>
                            </div>

                            <div className="divide-y divide-neutral-100 dark:divide-neutral-900 text-sm">
                                {/* Baris 1: Saldo Awal Modal */}
                                <div className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                    <div>
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                                            1. Saldo Awal Modal
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            Total ekuitas pemilik per awal periode pembukuan ({formattedStartDate})
                                        </span>
                                    </div>
                                    <span className={cn(
                                        'font-mono font-bold text-sm',
                                        saldoAwalModal < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-900 dark:text-neutral-100'
                                    )}>
                                        {formatRupiah(saldoAwalModal)}
                                    </span>
                                </div>

                                {/* Baris 2: Laba Ditahan (Collapsible) */}
                                <div className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                    <div
                                        onClick={() => detailLabaDitahan.length > 0 && setExpandedLabaDitahan(!expandedLabaDitahan)}
                                        className={cn(
                                            'px-4 py-3 flex items-center justify-between',
                                            detailLabaDitahan.length > 0 && 'cursor-pointer'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {detailLabaDitahan.length > 0 && (
                                                expandedLabaDitahan ? (
                                                    <ChevronDown className="size-4 text-blue-600" />
                                                ) : (
                                                    <ChevronRight className="size-4 text-blue-600" />
                                                )
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        2. Laba Ditahan (Retained Earnings)
                                                    </span>
                                                    {detailLabaDitahan.length > 0 && (
                                                        <span className="text-[11px] font-mono px-1.5 py-0.2 border border-blue-200 dark:border-blue-900 text-blue-600 bg-blue-50 dark:bg-blue-950/40">
                                                            {detailLabaDitahan.length} Bulan
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-neutral-500">
                                                    Akumulasi laba/(rugi) bersih komprehensif dari awal beroperasi sampai sebelum periode ini
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            'font-mono font-bold text-sm',
                                            labaDitahan < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-blue-600 dark:text-blue-400'
                                        )}>
                                            {formatRupiah(labaDitahan)}
                                        </span>
                                    </div>

                                    {/* Collapsible Monthly Retained Earnings */}
                                    {expandedLabaDitahan && detailLabaDitahan.length > 0 && (
                                        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                                            <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                                                Rincian Laba Ditahan per Bulan
                                            </div>
                                            <table className="w-full text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                                <thead>
                                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                                        <th className="py-2 px-3 text-left w-36">Bulan & Tahun</th>
                                                        <th className="py-2 px-3 text-left">Rentang Tanggal</th>
                                                        <th className="py-2 px-3 text-right w-44">Laba / (Rugi) Bersih</th>
                                                        <th className="py-2 px-3 text-right w-44">Saldo Akumulasi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                                    {detailLabaDitahan.map((m, mIdx) => {
                                                        const mLR = Number(m.laba_rugi || 0);
                                                        const mAkum = Number(m.saldo_akumulasi || 0);
                                                        return (
                                                            <tr key={mIdx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30">
                                                                <td className="py-2 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                                                    {m.bulan}
                                                                </td>
                                                                <td className="py-2 px-3 text-neutral-500">
                                                                    {m.periode_dari} s/d {m.periode_sampai}
                                                                </td>
                                                                <td className={cn(
                                                                    'py-2 px-3 text-right font-bold',
                                                                    mLR < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'
                                                                )}>
                                                                    {formatRupiah(mLR)}
                                                                </td>
                                                                <td className={cn(
                                                                    'py-2 px-3 text-right font-bold',
                                                                    mAkum < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-900 dark:text-white'
                                                                )}>
                                                                    {formatRupiah(mAkum)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Baris 3: Laba / Rugi Bersih Periode Berjalan */}
                                <div className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                    <div>
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                                            3. Laba / (Rugi) Bersih Periode Berjalan
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            Hasil usaha operasional & non-operasional periode {formattedStartDate} s/d {formattedEndDate}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        'font-mono font-bold text-sm',
                                        labaRugiPeriode < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400'
                                    )}>
                                        {formatRupiah(labaRugiPeriode)}
                                    </span>
                                </div>

                                {/* Baris 4: Tambahan Investasi Modal */}
                                <div className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                    <div>
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                                            4. Tambahan Investasi Modal (Setoran Modal)
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            Tambahan setoran modal pemilik selama periode berjalan
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                        {formatRupiah(tambahanInvestasi)}
                                    </span>
                                </div>

                                {/* Baris 5: Penarikan Modal / Prive */}
                                <div className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                    <div>
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                                            5. Penarikan Modal Pemilik (Prive / Dividen)
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            Pengurangan ekuitas untuk keperluan pribadi pemilik atau pembagian dividen
                                        </span>
                                    </div>
                                    <span className={cn(
                                        'font-mono font-bold text-sm',
                                        penarikan > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-500'
                                    )}>
                                        {penarikan > 0 ? `(${formatRupiah(penarikan)})` : formatRupiah(0)}
                                    </span>
                                </div>

                                {/* Baris 6: Saldo Akhir Modal (Total) */}
                                <div className="px-4 py-3.5 bg-neutral-100/70 dark:bg-neutral-900/90 flex items-center justify-between border-t-2 border-neutral-300 dark:border-neutral-700">
                                    <div>
                                        <span className="font-bold text-sm uppercase tracking-wide text-neutral-900 dark:text-white block">
                                            Saldo Akhir Modal (Total Ekuitas Pemilik)
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            Per posisi tanggal penutupan {formattedEndDate}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        'font-mono font-bold text-base',
                                        saldoAkhirModal < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-900 dark:text-white'
                                    )}>
                                        {formatRupiah(saldoAkhirModal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Detail Mutasi per Rekening Modal / Ekuitas */}
                    <div className="p-4 bg-white dark:bg-neutral-950">
                        <div className="border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="px-4 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Rincian Per Rekening Buku Besar Modal & Ekuitas
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 text-left w-12">#</th>
                                            <th className="py-2.5 px-3 text-left w-36">Kode Akun</th>
                                            <th className="py-2.5 px-3 text-left">Nama Rekening Modal</th>
                                            <th className="py-2.5 px-3 text-right w-44">Saldo Awal</th>
                                            <th className="py-2.5 px-3 text-right w-44">Mutasi Periode</th>
                                            <th className="py-2.5 px-3 text-right w-44">Saldo Akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center text-neutral-500 text-sm">
                                                    <RefreshCw className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                                                    Memuat rincian akun ekuitas...
                                                </td>
                                            </tr>
                                        ) : detailModal.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center text-neutral-500 text-sm">
                                                    Tidak ada mutasi pada rekening modal periode ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            detailModal.map((item, idx) => {
                                                const sAwal = Number(item.saldo_awal || 0);
                                                const mutasi = Number(item.mutasi || 0);
                                                const sAkhir = Number(item.saldo_akhir || 0);

                                                return (
                                                    <tr key={item.akun.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                        <td className="py-2.5 px-3 font-mono text-neutral-400 text-xs">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                                {item.akun.kode_akun}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {item.akun.nama_akun}
                                                        </td>
                                                        <td className={cn(
                                                            'py-2.5 px-3 text-right font-mono font-medium tabular-nums',
                                                            sAwal < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                                                        )}>
                                                            {formatRupiah(sAwal)}
                                                        </td>
                                                        <td className={cn(
                                                            'py-2.5 px-3 text-right font-mono font-semibold tabular-nums',
                                                            mutasi < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'
                                                        )}>
                                                            {formatRupiah(mutasi)}
                                                        </td>
                                                        <td className={cn(
                                                            'py-2.5 px-3 text-right font-mono font-bold tabular-nums',
                                                            sAkhir < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-900 dark:text-white'
                                                        )}>
                                                            {formatRupiah(sAkhir)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

