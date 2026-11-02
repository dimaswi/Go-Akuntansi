import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Calendar,
    Receipt,
    Percent,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
    ExternalLink,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LabaRugiItem {
    id?: number;
    kode_akun: string;
    nama_akun: string;
    saldo: number | string;
}

interface LabaRugiData {
    start_date: string;
    end_date: string;
    periode_dari?: string;
    periode_sampai?: string;
    include_penyesuaian?: boolean;
    parent_map?: Record<string, string>;
    pendapatan: LabaRugiItem[];
    total_pendapatan: number | string;
    beban: LabaRugiItem[];
    total_beban: number | string;
    laba_bersih: number | string;
}

interface AccountGroup {
    key: string;
    code: string;
    name: string;
    total: number;
    items: LabaRugiItem[];
}

const DEFAULT_LABA_RUGI_PARENTS: Record<string, string> = {
    '41': 'Pendapatan Pelayanan & Rawat Inap/Jalan',
    '42': 'Pendapatan Non-Operasional & Jasa Giro',
    '51': 'Beban Pokok Pendapatan (HPP Farmasi & Medis)',
    '61': 'Beban Kepegawaian & Gaji Karyawan',
    '62': 'Beban Pemeliharaan & Operasional Umum',
    '71': 'Beban Non-Operasional & Administrasi Bank',
    '72': 'Beban Pajak & Biaya Lainnya',
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
    items: LabaRugiItem[],
    parentMap: Record<string, string> = {},
    fallbackTitle: string = 'Kelompok Akun'
): AccountGroup[] {
    const map = new Map<string, AccountGroup>();

    items.forEach((item) => {
        if (!item.kode_akun || item.kode_akun === '-') return;

        const prefix = item.kode_akun.length >= 2 ? item.kode_akun.substring(0, 2) : item.kode_akun;
        if (!map.has(prefix)) {
            const parentName =
                parentMap[prefix] ||
                DEFAULT_LABA_RUGI_PARENTS[prefix] ||
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
    { title: 'Laba Rugi' },
];

export default function LaporanLabaRugi() {
    const navigate = useNavigate();
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [includePenyesuaian, setIncludePenyesuaian] = useState(true);
    const [labaRugi, setLabaRugi] = useState<LabaRugiData | null>(null);
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

    const toggleAll = (groups: AccountGroup[]) => {
        const allKeys = groups.map((g) => g.key);
        const allAreCollapsed = allKeys.length > 0 && allKeys.every((k) => collapsedGroups.has(k));

        if (allAreCollapsed) {
            setCollapsedGroups((prev) => {
                const next = new Set(prev);
                allKeys.forEach((k) => next.delete(k));
                return next;
            });
        } else {
            setCollapsedGroups((prev) => {
                const next = new Set(prev);
                allKeys.forEach((k) => next.add(k));
                return next;
            });
        }
    };

    const fetchLabaRugi = async () => {
        setLoading(true);
        try {
            const res = await api.get(
                `/laporan/laba-rugi?start_date=${startDate}&end_date=${endDate}&include_penyesuaian=${includePenyesuaian}`
            );
            setLabaRugi(res.data.data);
        } catch {
            toast.error('Gagal memuat laporan laba rugi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabaRugi();
    }, [startDate, endDate, includePenyesuaian]);

    const totalPendapatan = Number(labaRugi?.total_pendapatan || 0);
    const totalBeban = Number(labaRugi?.total_beban || 0);
    const labaBersih = Number(labaRugi?.laba_bersih || 0);
    const isProfit = labaBersih >= 0;

    const netProfitMargin = useMemo(() => {
        if (totalPendapatan <= 0) return '0.00';
        return ((labaBersih / totalPendapatan) * 100).toFixed(2);
    }, [labaBersih, totalPendapatan]);

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

    // Grouping by 2-digit parent accounts
    const pendapatanGroups = useMemo(() => {
        if (!labaRugi?.pendapatan) return [];
        return groupAccountsBy2Digit(labaRugi.pendapatan, labaRugi.parent_map, 'Pendapatan');
    }, [labaRugi]);

    const bebanGroups = useMemo(() => {
        if (!labaRugi?.beban) return [];
        return groupAccountsBy2Digit(labaRugi.beban, labaRugi.parent_map, 'Beban');
    }, [labaRugi]);

    const allGroups = useMemo(() => [...pendapatanGroups, ...bebanGroups], [pendapatanGroups, bebanGroups]);
    const isAllCollapsed = allGroups.length > 0 && allGroups.every((g) => collapsedGroups.has(g.key));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* ─── Satu Container Utuh (Unified Single Container) ─────────── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar: Title, Back & Action Buttons */}
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
                                <TrendingUp className="size-4" />
                            </div>

                            <div>
                                <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                                    Laporan Laba Rugi Komprehensif (Income Statement)
                                </h1>
                                <p className="text-[11px] text-neutral-500">
                                    Periode: {formattedStartDate} s/d {formattedEndDate}
                                    {' • '}
                                    {includePenyesuaian ? 'Termasuk Jurnal Penyesuaian (AJP)' : 'Tanpa Penyesuaian'}
                                    {' • Standar Akuntansi Keuangan (SAK ETAP)'}
                                </p>
                            </div>
                        </div>

                        {/* Right: Actions */}
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
                                onClick={fetchLabaRugi}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Dedicated Filter / Parameter Strip */}
                    <div className="border-t border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* AJP Checkbox */}
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/60 select-none">
                                <input
                                    type="checkbox"
                                    checked={includePenyesuaian}
                                    onChange={(e) => setIncludePenyesuaian(e.target.checked)}
                                    className="size-3.5 rounded-none accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
                                />
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                    Sertakan Jurnal Penyesuaian (AJP)
                                </span>
                            </label>
                            <span className="text-[11px] text-neutral-500 hidden sm:inline">
                                Memasukkan saldo penyesuaian akhir periode buku
                            </span>
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                Rentang:
                            </span>
                            <div className="flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs">
                                <Calendar className="size-3.5 text-neutral-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none outline-none font-mono text-neutral-800 dark:text-neutral-200 text-xs"
                                    title="Tanggal Mulai"
                                />
                                <span className="text-neutral-400 text-xs">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none outline-none font-mono text-neutral-800 dark:text-neutral-200 text-xs"
                                    title="Tanggal Akhir"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Summary Metric Cards (Integral KPI Strip) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        {/* Pendapatan */}
                        <div className="p-4">
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Pendapatan
                                </span>
                                <TrendingUp className={cn("size-4", totalPendapatan < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")} />
                            </div>
                            <div className={cn(
                                "text-lg font-bold font-mono mt-0.5",
                                totalPendapatan < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                            )}>
                                {formatRupiah(totalPendapatan)}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                Total mutasi kredit pendapatan periode
                            </p>
                        </div>

                        {/* Beban */}
                        <div className="p-4">
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Beban Usaha
                                </span>
                                <TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className={cn(
                                "text-lg font-bold font-mono mt-0.5",
                                "text-rose-600 dark:text-rose-400"
                            )}>
                                {formatRupiah(totalBeban)}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                Total mutasi debit beban operasional
                            </p>
                        </div>

                        {/* Laba / Rugi Bersih */}
                        <div className="p-4">
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    {isProfit ? 'Laba Bersih Periode' : 'Rugi Bersih Periode'}
                                </span>
                                <Receipt className={cn("size-4", isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")} />
                            </div>
                            <div className={cn(
                                "text-lg font-bold font-mono mt-0.5",
                                isProfit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"
                            )}>
                                {formatRupiah(Math.abs(labaBersih))}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={cn(
                                    "px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                                    isProfit
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                )}>
                                    {isProfit ? 'PROFITABLE' : 'DEFISIT (LOSS)'}
                                </span>
                            </div>
                        </div>

                        {/* Net Profit Margin */}
                        <div className="p-4">
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Net Profit Margin (NPM)
                                </span>
                                <Percent className="size-4 text-neutral-400" />
                            </div>
                            <div className={cn(
                                "text-lg font-bold font-mono mt-0.5",
                                Number(netProfitMargin) < 0 ? "text-rose-600 dark:text-rose-400" : "text-neutral-900 dark:text-neutral-100"
                            )}>
                                {netProfitMargin}%
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                Rasio efisiensi laba terhadap pendapatan
                            </p>
                        </div>
                    </div>

                    {/* 4. Financial Statement Table with 2-Digit Hierarchical Collapsible */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400">
                                    <th className="py-2.5 px-3 text-left font-semibold w-10 text-center">#</th>
                                    <th className="py-2.5 px-3 text-left font-semibold w-32 uppercase tracking-wider text-[11px]">Kode Akun</th>
                                    <th className="py-2.5 px-3 text-left font-semibold uppercase tracking-wider text-[11px]">Nama Rekening / Uraian Akun</th>
                                    <th className="py-2.5 px-4 text-right font-semibold w-48 uppercase tracking-wider text-[11px]">Saldo Mutasi (Rp)</th>
                                    <th className="py-2.5 px-3 text-center font-semibold w-20 uppercase tracking-wider text-[11px]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">

                                {/* ─── 1. SEKSI PENDAPATAN ─── */}
                                <tr className="bg-neutral-100 dark:bg-neutral-900 border-t border-b border-neutral-200 dark:border-neutral-800 font-bold text-neutral-900 dark:text-neutral-100">
                                    <td className="py-2.5 px-3 text-center">
                                        <TrendingUp className={cn("size-3.5 mx-auto", totalPendapatan < 0 ? "text-rose-600" : "text-emerald-600")} />
                                    </td>
                                    <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider text-[11px] font-bold">
                                        1. PENDAPATAN OPERASIONAL & USAHA
                                    </td>
                                    <td className={cn(
                                        "py-2.5 px-4 text-right font-mono text-[11px] font-bold",
                                        totalPendapatan < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                    )}>
                                        {formatRupiah(totalPendapatan)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-neutral-400 text-[11px]">
                                        {pendapatanGroups.reduce((acc, g) => acc + g.items.length, 0)} Akun
                                    </td>
                                </tr>

                                {pendapatanGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                                            Tidak ada transaksi pendapatan pada periode ini
                                        </td>
                                    </tr>
                                ) : (
                                    pendapatanGroups.map((group) => {
                                        const isCollapsed = collapsedGroups.has(group.key);
                                        return (
                                            <React.Fragment key={group.key}>
                                                {/* Parent 2-Digit Header Row */}
                                                <tr
                                                    onClick={() => toggleGroup(group.key)}
                                                    className="bg-neutral-50/90 dark:bg-neutral-900/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 cursor-pointer select-none transition-colors border-t border-neutral-200/80 dark:border-neutral-800/80"
                                                >
                                                    <td className="py-2 px-3 text-center">
                                                        {isCollapsed ? (
                                                            <ChevronRight className="size-3.5 text-neutral-500 inline-block" />
                                                        ) : (
                                                            <ChevronDown className="size-3.5 text-neutral-500 inline-block" />
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-200/70 dark:bg-neutral-800 px-1.5 py-0.5 text-[11px]">
                                                            {group.code}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                        <div className="flex items-center gap-2">
                                                            <span>{group.name}</span>
                                                            <span className="text-[11px] font-normal text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800/60 px-1.5 py-0.2 rounded-none">
                                                                {group.items.length} rekening
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={cn(
                                                        "py-2 px-4 text-right font-mono font-bold",
                                                        getAmountColor(group.total)
                                                    )}>
                                                        {formatRupiah(group.total)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center text-[11px] text-neutral-400">
                                                        Subtotal
                                                    </td>
                                                </tr>

                                                {/* Child Account Rows */}
                                                {!isCollapsed &&
                                                    group.items.map((item, idx) => (
                                                        <tr
                                                            key={item.kode_akun || idx}
                                                            className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors"
                                                        >
                                                            <td className="py-1.5 px-3 text-center text-neutral-300 dark:text-neutral-700">
                                                                •
                                                            </td>
                                                            <td className="py-1.5 px-3 font-mono text-neutral-500 pl-6">
                                                                {item.kode_akun}
                                                            </td>
                                                            <td className="py-1.5 px-3 text-neutral-800 dark:text-neutral-200 pl-4">
                                                                {item.nama_akun}
                                                            </td>
                                                            <td className={cn(
                                                                "py-1.5 px-4 text-right font-mono font-medium",
                                                                getAmountColor(item.saldo)
                                                            )}>
                                                                {formatRupiah(item.saldo)}
                                                            </td>
                                                            <td className="py-1.5 px-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/akuntansi/buku-besar?start_date=${startDate}&end_date=${endDate}`);
                                                                    }}
                                                                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 inline-flex items-center gap-1"
                                                                    title="Buka Buku Besar Akun Ini"
                                                                >
                                                                    <ExternalLink className="size-3" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </React.Fragment>
                                        );
                                    })
                                )}

                                {/* Subtotal Row Pendapatan */}
                                <tr className="bg-emerald-50/70 dark:bg-emerald-950/20 font-bold border-t-2 border-b-2 border-emerald-300 dark:border-emerald-800">
                                    <td className="py-2.5 px-3 text-center">✓</td>
                                    <td colSpan={2} className="py-2.5 px-3 text-emerald-900 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
                                        TOTAL PENDAPATAN OPERASIONAL
                                    </td>
                                    <td className={cn(
                                        "py-2.5 px-4 text-right font-mono text-xs font-bold",
                                        totalPendapatan < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"
                                    )}>
                                        {formatRupiah(totalPendapatan)}
                                    </td>
                                    <td></td>
                                </tr>

                                {/* ─── 2. SEKSI BEBAN ─── */}
                                <tr className="bg-neutral-100 dark:bg-neutral-900 border-t border-b border-neutral-200 dark:border-neutral-800 font-bold text-neutral-900 dark:text-neutral-100">
                                    <td className="py-2.5 px-3 text-center">
                                        <TrendingDown className="size-3.5 text-rose-600 mx-auto" />
                                    </td>
                                    <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider text-[11px] font-bold">
                                        2. BEBAN OPERASIONAL & USAHA
                                    </td>
                                    <td className={cn(
                                        "py-2.5 px-4 text-right font-mono text-[11px] font-bold",
                                        "text-rose-600 dark:text-rose-400"
                                    )}>
                                        {formatRupiah(totalBeban)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-neutral-400 text-[11px]">
                                        {bebanGroups.reduce((acc, g) => acc + g.items.length, 0)} Akun
                                    </td>
                                </tr>

                                {bebanGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                                            Tidak ada transaksi beban pada periode ini
                                        </td>
                                    </tr>
                                ) : (
                                    bebanGroups.map((group) => {
                                        const isCollapsed = collapsedGroups.has(group.key);
                                        return (
                                            <React.Fragment key={group.key}>
                                                {/* Parent 2-Digit Header Row */}
                                                <tr
                                                    onClick={() => toggleGroup(group.key)}
                                                    className="bg-neutral-50/90 dark:bg-neutral-900/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 cursor-pointer select-none transition-colors border-t border-neutral-200/80 dark:border-neutral-800/80"
                                                >
                                                    <td className="py-2 px-3 text-center">
                                                        {isCollapsed ? (
                                                            <ChevronRight className="size-3.5 text-neutral-500 inline-block" />
                                                        ) : (
                                                            <ChevronDown className="size-3.5 text-neutral-500 inline-block" />
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-200/70 dark:bg-neutral-800 px-1.5 py-0.5 text-[11px]">
                                                            {group.code}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                        <div className="flex items-center gap-2">
                                                            <span>{group.name}</span>
                                                            <span className="text-[11px] font-normal text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800/60 px-1.5 py-0.2 rounded-none">
                                                                {group.items.length} rekening
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={cn(
                                                        "py-2 px-4 text-right font-mono font-bold",
                                                        getAmountColor(group.total)
                                                    )}>
                                                        {formatRupiah(group.total)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center text-[11px] text-neutral-400">
                                                        Subtotal
                                                    </td>
                                                </tr>

                                                {/* Child Account Rows */}
                                                {!isCollapsed &&
                                                    group.items.map((item, idx) => (
                                                        <tr
                                                            key={item.kode_akun || idx}
                                                            className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors"
                                                        >
                                                            <td className="py-1.5 px-3 text-center text-neutral-300 dark:text-neutral-700">
                                                                •
                                                            </td>
                                                            <td className="py-1.5 px-3 font-mono text-neutral-500 pl-6">
                                                                {item.kode_akun}
                                                            </td>
                                                            <td className="py-1.5 px-3 text-neutral-800 dark:text-neutral-200 pl-4">
                                                                {item.nama_akun}
                                                            </td>
                                                            <td className={cn(
                                                                "py-1.5 px-4 text-right font-mono font-medium",
                                                                getAmountColor(item.saldo)
                                                            )}>
                                                                {formatRupiah(item.saldo)}
                                                            </td>
                                                            <td className="py-1.5 px-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/akuntansi/buku-besar?start_date=${startDate}&end_date=${endDate}`);
                                                                    }}
                                                                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 inline-flex items-center gap-1"
                                                                    title="Buka Buku Besar Akun Ini"
                                                                >
                                                                    <ExternalLink className="size-3" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </React.Fragment>
                                        );
                                    })
                                )}

                                {/* Subtotal Row Beban */}
                                <tr className="bg-rose-50/70 dark:bg-rose-950/20 font-bold border-t-2 border-b-2 border-rose-300 dark:border-rose-800">
                                    <td className="py-2.5 px-3 text-center">✓</td>
                                    <td colSpan={2} className="py-2.5 px-3 text-rose-900 dark:text-rose-300 uppercase tracking-wider text-[11px]">
                                        TOTAL BEBAN OPERASIONAL
                                    </td>
                                    <td className={cn(
                                        "py-2.5 px-4 text-right font-mono text-xs font-bold",
                                        "text-rose-600 dark:text-rose-400"
                                    )}>
                                        {formatRupiah(totalBeban)}
                                    </td>
                                    <td></td>
                                </tr>

                                {/* ─── 3. GRAND TOTAL LABA (RUGI) BERSIH ROW ─── */}
                                <tr className={cn(
                                    "font-bold text-sm border-t-4",
                                    isProfit
                                        ? "bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-600 text-emerald-950 dark:text-emerald-100"
                                        : "bg-rose-100/70 dark:bg-rose-950/40 border-rose-600 text-rose-950 dark:text-rose-100"
                                )}>
                                    <td className="py-3 px-3 text-center">
                                        {isProfit ? (
                                            <CheckCircle2 className="size-4 text-emerald-600 inline-block" />
                                        ) : (
                                            <AlertTriangle className="size-4 text-rose-600 inline-block" />
                                        )}
                                    </td>
                                    <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-xs">
                                        <div className="flex items-center gap-2">
                                            <span>{isProfit ? 'LABA BERSIH PERIODE BERJALAN' : 'RUGI BERSIH PERIODE BERJALAN'}</span>
                                            <span className={cn(
                                                "text-[11px] px-1.5 py-0.5 uppercase tracking-wider font-bold",
                                                isProfit
                                                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-neutral-900"
                                                    : "bg-rose-600 text-white dark:bg-rose-500 dark:text-neutral-900"
                                            )}>
                                                {isProfit ? 'SURPLUS' : 'DEFISIT'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={cn(
                                        "py-3 px-4 text-right font-mono text-base font-bold",
                                        isProfit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"
                                    )}>
                                        {formatRupiah(Math.abs(labaBersih))}
                                    </td>
                                    <td className="py-3 px-3 text-center text-[11px] font-mono">
                                        NPM: {netProfitMargin}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Bottom Accounting Footnote */}
                    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-3 text-[11px] text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Catatan Rekonsiliasi: </span>
                            Nilai Laba (Rugi) Bersih Periode Berjalan ({formatRupiah(labaBersih)}) otomatis terakumulasi ke dalam baris Ekuitas pada Laporan Posisi Keuangan (Neraca).
                        </div>
                        <div className="font-mono text-[11px] text-neutral-400">
                            PSAK 1 / SAK ETAP • SIM Keuangan & Akuntansi
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
