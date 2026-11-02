import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    Calendar,
    Scale,
    TrendingUp,
    Building2,
    Wallet,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NeracaItem {
    kode_akun: string;
    nama_akun: string;
    saldo: number | string;
}

interface NeracaData {
    tanggal: string;
    periode_dari?: string;
    periode_sampai?: string;
    mode?: string;
    include_penyesuaian?: boolean;
    parent_map?: Record<string, string>;
    aset_lancar: NeracaItem[];
    aset_tetap: NeracaItem[];
    kewajiban: NeracaItem[];
    ekuitas: NeracaItem[];
    total_aset_lancar: number | string;
    total_aset_tetap: number | string;
    total_aset: number | string;
    total_kewajiban: number | string;
    total_ekuitas: number | string;
    total_pasiva: number | string;
    is_balance: boolean;
}

interface AccountGroup {
    key: string;
    code: string;
    name: string;
    total: number;
    items: NeracaItem[];
}

const DEFAULT_PARENT_NAMES: Record<string, string> = {
    '11': 'Aset Lancar',
    '12': 'Aset Tetap',
    '13': 'Aset Lainnya',
    '21': 'Liabilitas Jangka Pendek',
    '22': 'Liabilitas Jangka Panjang',
    '23': 'Hutang Lain-Lain / Alat Kesehatan',
    '31': 'Modal & Ekuitas Pemilik',
    '32': 'Laba Ditahan',
};

// Helper warna angka: jika negatif/minus selalu merah
const getAmountColor = (
    amount: number | string,
    defaultColor: string = 'text-neutral-900 dark:text-neutral-100'
) => {
    const val = Number(amount || 0);
    if (val < 0) {
        return 'text-rose-600 dark:text-rose-400 font-semibold';
    }
    return defaultColor;
};

function groupAccountsBy2Digit(
    items: NeracaItem[],
    parentMap: Record<string, string> = {},
    fallbackTitle: string = 'Kelompok Akun'
): AccountGroup[] {
    const map = new Map<string, AccountGroup>();

    items.forEach((item) => {
        // Special row: Laba (Rugi) Periode Berjalan
        if (!item.kode_akun || item.kode_akun === '-' || isNaN(Number(item.kode_akun.substring(0, 2)))) {
            const specialKey = '33_laba_berjalan';
            if (!map.has(specialKey)) {
                map.set(specialKey, {
                    key: specialKey,
                    code: '33',
                    name: 'Hasil Usaha Berjalan',
                    total: 0,
                    items: [],
                });
            }
            const grp = map.get(specialKey)!;
            grp.items.push(item);
            grp.total += Number(item.saldo || 0);
            return;
        }

        const prefix = item.kode_akun.length >= 2 ? item.kode_akun.substring(0, 2) : item.kode_akun;
        if (!map.has(prefix)) {
            const parentName =
                parentMap[prefix] ||
                DEFAULT_PARENT_NAMES[prefix] ||
                `${fallbackTitle} (${prefix})`;

            map.set(prefix, {
                key: prefix,
                code: prefix,
                name: parentName,
                total: 0,
                items: [],
            });
        }

        const grp = map.get(prefix)!;
        grp.items.push(item);
        grp.total += Number(item.saldo || 0);
    });

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Laporan Keuangan', href: '/akuntansi/laporan-keuangan' },
    { title: 'Neraca' },
];

export default function LaporanNeraca() {
    const navigate = useNavigate();
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [mode, setMode] = useState<'akumulasi' | 'periode'>('akumulasi');
    const [includePenyesuaian, setIncludePenyesuaian] = useState(true);
    const [neraca, setNeraca] = useState<NeracaData | null>(null);
    const [loading, setLoading] = useState(true);

    // Collapsible state for 2-digit parent accounts
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (key: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleAll = (allGroups: AccountGroup[]) => {
        const allKeys = allGroups.map((g) => g.key);
        const allCollapsed = allKeys.every((k) => collapsedGroups.has(k));
        if (allCollapsed) {
            setCollapsedGroups(new Set()); // Expand all
        } else {
            setCollapsedGroups(new Set(allKeys)); // Collapse all
        }
    };

    const fetchNeraca = async () => {
        setLoading(true);
        try {
            const res = await api.get(
                `/laporan/neraca?start_date=${startDate}&end_date=${endDate}&mode=${mode}&include_penyesuaian=${includePenyesuaian}`
            );
            setNeraca(res.data.data);
        } catch {
            toast.error('Gagal memuat laporan neraca');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNeraca();
    }, [startDate, endDate, mode, includePenyesuaian]);

    const selisih = useMemo(() => {
        if (!neraca) return 0;
        const aset = Number(neraca.total_aset || 0);
        const pasiva = Number(neraca.total_pasiva || 0);
        return aset - pasiva;
    }, [neraca]);

    const isBalanced = Math.abs(selisih) < 1;

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

    // Grouping by 2-digit codes for Aktiva and Pasiva
    const aktivaGroups = useMemo(() => {
        if (!neraca) return [];
        const allAset = [...(neraca.aset_lancar || []), ...(neraca.aset_tetap || [])];
        return groupAccountsBy2Digit(allAset, neraca.parent_map, 'Kelompok Aset');
    }, [neraca]);

    const pasivaGroups = useMemo(() => {
        if (!neraca) return [];
        const allPasiva = [...(neraca.kewajiban || []), ...(neraca.ekuitas || [])];
        return groupAccountsBy2Digit(allPasiva, neraca.parent_map, 'Kelompok Kewajiban/Ekuitas');
    }, [neraca]);

    const allGroups = useMemo(() => [...aktivaGroups, ...pasivaGroups], [aktivaGroups, pasivaGroups]);
    const isAllCollapsed = allGroups.length > 0 && allGroups.every((g) => collapsedGroups.has(g.key));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* ─── Satu Container Utuh ─────────────────────────────────────── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar: Title, Back & Action Buttons (Clean & Spacious) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/akuntansi/laporan-keuangan')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                                title="Kembali ke Daftar Laporan"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Scale className="size-4" />
                            </div>

                            <div>
                                <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                                    Laporan Posisi Keuangan (Neraca)
                                </h1>
                                <p className="text-[11px] text-neutral-500">
                                    {mode === 'akumulasi'
                                        ? `Posisi Akumulasi s/d ${formattedEndDate} (Standar SAK)`
                                        : `Mutasi Pergerakan Periode: ${formattedStartDate} s/d ${formattedEndDate}`}
                                    {' • '}
                                    {includePenyesuaian ? 'Termasuk Jurnal Penyesuaian (AJP)' : 'Tanpa Penyesuaian'}
                                </p>
                            </div>
                        </div>

                        {/* Right: Quick Table Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAll(allGroups)}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 gap-1.5"
                                title={isAllCollapsed ? 'Buka Semua Hierarki' : 'Tutup Semua Hierarki'}
                            >
                                <ChevronsUpDown className="size-3.5" />
                                <span>{isAllCollapsed ? 'Buka Semua' : 'Tutup Semua'}</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchNeraca}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Dedicated Filter / Parameter Strip (Terpisah dari Header Bar) */}
                    <div className="border-t border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Mode Selector & AJP Checkbox */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                Mode:
                            </span>

                            {/* Mode Segmented Button */}
                            <div className="inline-flex border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setMode('akumulasi')}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-semibold transition-colors",
                                        mode === 'akumulasi'
                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                    )}
                                    title="Posisi akumulasi kumulatif dari awal sampai tanggal akhir (Standar Akuntansi SAK)"
                                >
                                    Akumulasi (SAK)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('periode')}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-semibold transition-colors",
                                        mode === 'periode'
                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                    )}
                                    title="Mutasi pergerakan hanya di dalam rentang periode yang dipilih (Analisis)"
                                >
                                    Periode Berjalan
                                </button>
                            </div>

                            {/* Checkbox AJP */}
                            <label className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/60 select-none">
                                <input
                                    type="checkbox"
                                    checked={includePenyesuaian}
                                    onChange={(e) => setIncludePenyesuaian(e.target.checked)}
                                    className="size-3.5 rounded-none accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                                />
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                    Sertakan AJP
                                </span>
                            </label>
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                Rentang:
                            </span>
                            <div className="flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs">
                                <Calendar className="size-3.5 text-neutral-400 mr-1" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-xs outline-none font-mono text-neutral-800 dark:text-neutral-200"
                                />
                                <span className="text-xs text-neutral-400">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-xs outline-none font-mono text-neutral-800 dark:text-neutral-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Balance Status Strip */}
                    <div
                        className={cn(
                            'px-4 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2',
                            isBalanced
                                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800/50 dark:text-emerald-300'
                                : 'bg-rose-50/70 border-rose-200/80 text-rose-900 dark:bg-rose-950/20 dark:border-rose-800/50 dark:text-rose-300'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {isBalanced ? (
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                                <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold uppercase tracking-wide">
                                {isBalanced ? 'Neraca Seimbang (Balanced)' : 'Neraca Belum Seimbang!'}
                            </span>
                            <span className="text-[11px] opacity-75 hidden md:inline font-mono">
                                • Persamaan: Total Aset = Total Kewajiban + Total Ekuitas
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono font-bold">
                            <div>
                                <span className="text-[11px] uppercase font-normal opacity-70 mr-1">
                                    Total Aset:
                                </span>
                                <span>{formatRupiah(neraca?.total_aset || 0)}</span>
                            </div>
                            <span className="opacity-40">|</span>
                            <div>
                                <span className="text-[11px] uppercase font-normal opacity-70 mr-1">
                                    Total Pasiva:
                                </span>
                                <span>{formatRupiah(neraca?.total_pasiva || 0)}</span>
                            </div>
                            {!isBalanced && (
                                <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px] bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5">
                                    Selisih: {formatRupiah(selisih)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 4. Metric Summary KPI Strip (3 Kolom Terintegrasi) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/20">
                        {/* 1. Total Aset */}
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Aktiva (Aset)
                                </span>
                                <Wallet className="size-4 text-neutral-400" />
                            </div>
                            <div className="text-base sm:text-lg font-bold mt-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                                {formatRupiah(neraca?.total_aset || 0)}
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                                {mode === 'akumulasi' ? 'Akumulasi Aset Lancar + Aset Tetap' : 'Mutasi Aset dalam Periode'}
                            </div>
                        </div>

                        {/* 2. Total Kewajiban */}
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Kewajiban (Hutang)
                                </span>
                                <Building2 className="size-4 text-neutral-400" />
                            </div>
                            <div className="text-base sm:text-lg font-bold mt-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                                {formatRupiah(neraca?.total_kewajiban || 0)}
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                                {mode === 'akumulasi' ? 'Hutang lancar & jangka panjang' : 'Mutasi Hutang dalam Periode'}
                            </div>
                        </div>

                        {/* 3. Total Ekuitas */}
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Ekuitas (Permodalan)
                                </span>
                                <TrendingUp className="size-4 text-neutral-400" />
                            </div>
                            <div className="text-base sm:text-lg font-bold mt-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                                {formatRupiah(neraca?.total_ekuitas || 0)}
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                                {mode === 'akumulasi' ? 'Modal + Laba Kumulatif s/d Tanggal' : 'Modal + Laba Periode Berjalan'}
                            </div>
                        </div>
                    </div>

                    {/* 5. Two-Column Balance Sheet Table Section with 2-Digit Hierarchical Collapsible */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800 items-start">

                        {/* ─── LEFT COLUMN: AKTIVA (ASET) ───────────────────────────── */}
                        <div className="w-full">
                            <div className="px-4 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                    <span className="size-2 bg-emerald-600 inline-block" />
                                    <span>Aktiva (Aset)</span>
                                </h2>
                                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                                    {formatRupiah(neraca?.total_aset || 0)}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                            <th className="py-2 px-3 text-left w-24">Kode</th>
                                            <th className="py-2 px-3 text-left">Nama Akun</th>
                                            <th className="py-2 px-3 text-right w-36">Saldo (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {aktivaGroups.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="py-4 px-3 text-center text-neutral-400 italic">
                                                    Tidak ada data akun aktiva pada periode ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            aktivaGroups.map((group) => {
                                                const isCollapsed = collapsedGroups.has(group.key);
                                                return (
                                                    <React.Fragment key={group.key}>
                                                        {/* Induk Header 2 Digit (Collapsible Row) */}
                                                        <tr
                                                            onClick={() => toggleGroup(group.key)}
                                                            className="bg-neutral-100/80 dark:bg-neutral-900 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80 cursor-pointer select-none transition-colors border-y border-neutral-200 dark:border-neutral-800 font-bold"
                                                        >
                                                            <td className="py-2 px-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    {isCollapsed ? (
                                                                        <ChevronRight className="size-3.5 text-neutral-500 shrink-0" />
                                                                    ) : (
                                                                        <ChevronDown className="size-3.5 text-neutral-500 shrink-0" />
                                                                    )}
                                                                    <span className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-1 py-0.5">
                                                                        {group.code}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] uppercase tracking-wide text-neutral-900 dark:text-neutral-100 font-bold">
                                                                        {group.name}
                                                                    </span>
                                                                    <span className="text-[11px] font-normal text-neutral-400 font-mono">
                                                                        ({group.items.length} akun)
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className={cn("py-2 px-3 text-right font-mono text-[11px] font-bold", getAmountColor(group.total))}>
                                                                {formatRupiah(group.total)}
                                                            </td>
                                                        </tr>

                                                        {/* Sub-Akun Children Rows */}
                                                        {!isCollapsed &&
                                                            group.items.map((item, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                                                                >
                                                                    <td className="py-1.5 px-3 pl-8 font-mono text-neutral-600 dark:text-neutral-400 text-[11px]">
                                                                        {item.kode_akun}
                                                                    </td>
                                                                    <td className="py-1.5 px-3 text-neutral-800 dark:text-neutral-200">
                                                                        {item.nama_akun}
                                                                    </td>
                                                                    <td className={cn("py-1.5 px-3 text-right font-mono tabular-nums", getAmountColor(item.saldo))}>
                                                                        {formatRupiah(item.saldo)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 bg-neutral-100/90 dark:bg-neutral-900 font-bold text-neutral-900 dark:text-white text-xs">
                                            <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-[11px]">
                                                Total Aktiva (Aset):
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold">
                                                {formatRupiah(neraca?.total_aset || 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* ─── RIGHT COLUMN: PASIVA (KEWAJIBAN & EKUITAS) ─────────── */}
                        <div className="w-full">
                            <div className="px-4 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                    <span className="size-2 bg-amber-500 inline-block" />
                                    <span>Pasiva (Kewajiban & Ekuitas)</span>
                                </h2>
                                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                                    {formatRupiah(neraca?.total_pasiva || 0)}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                            <th className="py-2 px-3 text-left w-24">Kode</th>
                                            <th className="py-2 px-3 text-left">Nama Akun</th>
                                            <th className="py-2 px-3 text-right w-36">Saldo (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {pasivaGroups.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="py-4 px-3 text-center text-neutral-400 italic">
                                                    Tidak ada data akun pasiva pada periode ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            pasivaGroups.map((group) => {
                                                const isCollapsed = collapsedGroups.has(group.key);
                                                return (
                                                    <React.Fragment key={group.key}>
                                                        {/* Induk Header 2 Digit (Collapsible Row) */}
                                                        <tr
                                                            onClick={() => toggleGroup(group.key)}
                                                            className="bg-neutral-100/80 dark:bg-neutral-900 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80 cursor-pointer select-none transition-colors border-y border-neutral-200 dark:border-neutral-800 font-bold"
                                                        >
                                                            <td className="py-2 px-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    {isCollapsed ? (
                                                                        <ChevronRight className="size-3.5 text-neutral-500 shrink-0" />
                                                                    ) : (
                                                                        <ChevronDown className="size-3.5 text-neutral-500 shrink-0" />
                                                                    )}
                                                                    <span className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-1 py-0.5">
                                                                        {group.code}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] uppercase tracking-wide text-neutral-900 dark:text-neutral-100 font-bold">
                                                                        {group.name}
                                                                    </span>
                                                                    <span className="text-[11px] font-normal text-neutral-400 font-mono">
                                                                        ({group.items.length} akun)
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className={cn("py-2 px-3 text-right font-mono text-[11px] font-bold", getAmountColor(group.total))}>
                                                                {formatRupiah(group.total)}
                                                            </td>
                                                        </tr>

                                                        {/* Sub-Akun Children Rows */}
                                                        {!isCollapsed &&
                                                            group.items.map((item, idx) => {
                                                                const isLabaBerjalan = item.nama_akun
                                                                    .toLowerCase()
                                                                    .includes('laba');
                                                                return (
                                                                    <tr
                                                                        key={idx}
                                                                        className={cn(
                                                                            'hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors',
                                                                            isLabaBerjalan &&
                                                                            'bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold'
                                                                        )}
                                                                    >
                                                                        <td className="py-1.5 px-3 pl-8 font-mono text-neutral-600 dark:text-neutral-400 text-[11px]">
                                                                            {item.kode_akun}
                                                                        </td>
                                                                        <td className="py-1.5 px-3 text-neutral-800 dark:text-neutral-200">
                                                                            {item.nama_akun}
                                                                        </td>
                                                                        <td
                                                                            className={cn(
                                                                                'py-1.5 px-3 text-right font-mono tabular-nums',
                                                                                isLabaBerjalan
                                                                                    ? (Number(item.saldo) < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold')
                                                                                    : getAmountColor(item.saldo)
                                                                            )}
                                                                        >
                                                                            {formatRupiah(item.saldo)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 bg-neutral-100/90 dark:bg-neutral-900 font-bold text-neutral-900 dark:text-white text-xs">
                                            <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-[11px]">
                                                Total Pasiva (Kewajiban + Ekuitas):
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold">
                                                {formatRupiah(neraca?.total_pasiva || 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 6. Bottom Footnote Strip */}
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500">
                        <div>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Mode {mode === 'akumulasi' ? 'Akumulasi' : 'Periode'}: </span>
                            {mode === 'akumulasi'
                                ? 'Menampilkan posisi neraca akumulasi kumulatif dari awal sampai tanggal akhir periode (Standar Akuntansi SAK).'
                                : 'Menampilkan pergerakan dan mutasi saldo hanya dalam rentang tanggal yang dipilih (Untuk Analisis Mutasi).'}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-400">
                            PSAK 1 SAK ETAP • Hierarki 2-Digit
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
