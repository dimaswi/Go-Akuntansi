import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import {
    BukuBesarAccountSummary,
    BukuBesarSummaryResponse,
    BukuBesarResponse,
    ChartOfAccount,
} from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { formatRupiah, cn } from '@/lib/utils';
import { Can } from '@/components/can';
import {
    Search,
    Eye,
    Calculator,
    TrendingUp,
    TrendingDown,
    FileText,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    Layers,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

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

const jenisAkunLabels: Record<string, string> = {
    aset: 'Aset',
    kewajiban: 'Kewajiban',
    ekuitas: 'Ekuitas',
    modal: 'Ekuitas',
    pendapatan: 'Pendapatan',
    beban: 'Beban',
};

const badgeJenisAkun: Record<string, string> = {
    aset: 'border-blue-200 bg-blue-50/70 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    kewajiban: 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    ekuitas: 'border-purple-200 bg-purple-50/70 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    modal: 'border-purple-200 bg-purple-50/70 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    pendapatan: 'border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    beban: 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
};

export default function BukuBesarIndex() {
    // Default dates: awal bulan ini s/d akhir bulan ini
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [periodeDari, setPeriodeDari] = useState(defaultStart);
    const [periodeSampai, setPeriodeSampai] = useState(defaultEnd);
    const [selectedAkun, setSelectedAkun] = useState('all');
    const [selectedJenis, setSelectedJenis] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [summaryData, setSummaryData] = useState<BukuBesarSummaryResponse | null>(null);
    const [allAccounts, setAllAccounts] = useState<ChartOfAccount[]>([]);
    const [loadingSummary, setLoadingSummary] = useState(true);

    // Collapsible state: Set of expanded account IDs
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // In-memory cache for transaction details (accId -> BukuBesarResponse)
    const [detailsCache, setDetailsCache] = useState<Record<number, BukuBesarResponse>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

    // Fetch list of all accounts for the filter dropdown once
    const fetchAccountOptions = async () => {
        try {
            const res = await api.get('/daftar-akun');
            setAllAccounts(res.data?.data || []);
        } catch {
            // ignore
        }
    };

    // Fetch summary for given date range (instant & debounced)
    const fetchSummary = useCallback(async (start: string, end: string) => {
        if (!start || !end) return;
        setLoadingSummary(true);
        try {
            const params: Record<string, any> = {
                start_date: start,
                end_date: end,
            };

            const res = await api.get('/laporan/buku-besar', { params });
            setSummaryData(res.data.data);
            // Clear details cache when period changes
            setDetailsCache({});
            setExpandedRows(new Set());
        } catch {
            toast.error('Gagal memuat data buku besar');
        } finally {
            setLoadingSummary(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchAccountOptions();
    }, []);

    // Reactive auto-fetch when date changes (debounced by 300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSummary(periodeDari, periodeSampai);
        }, 300);
        return () => clearTimeout(timer);
    }, [periodeDari, periodeSampai, fetchSummary]);

    // Toggle Collapsible Row: load transactions seamlessly if not cached
    const toggleRow = async (accountId: number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(accountId)) {
                next.delete(accountId);
            } else {
                next.add(accountId);
            }
            return next;
        });

        // If opening and not yet in cache, fetch asynchronously without disrupting table
        if (!expandedRows.has(accountId) && !detailsCache[accountId]) {
            setLoadingDetails((prev) => ({ ...prev, [accountId]: true }));
            try {
                const res = await api.get(`/laporan/buku-besar/${accountId}`, {
                    params: {
                        start_date: periodeDari,
                        end_date: periodeSampai,
                    },
                });
                if (res.data?.data) {
                    setDetailsCache((prev) => ({
                        ...prev,
                        [accountId]: res.data.data,
                    }));
                }
            } catch {
                toast.error('Gagal memuat rincian transaksi akun');
            } finally {
                setLoadingDetails((prev) => ({ ...prev, [accountId]: false }));
            }
        }
    };

    // Expand / Collapse all
    const toggleAllRows = () => {
        if (!summaryData?.accounts) return;
        if (expandedRows.size === filteredAccounts.length && filteredAccounts.length > 0) {
            setExpandedRows(new Set());
        } else {
            const allIds = new Set(filteredAccounts.map((a) => a.akun.id));
            setExpandedRows(allIds);

            // Fetch any missing details
            filteredAccounts.forEach(async (acc) => {
                if (!detailsCache[acc.akun.id]) {
                    try {
                        const res = await api.get(`/laporan/buku-besar/${acc.akun.id}`, {
                            params: {
                                start_date: periodeDari,
                                end_date: periodeSampai,
                            },
                        });
                        if (res.data?.data) {
                            setDetailsCache((prev) => ({
                                ...prev,
                                [acc.akun.id]: res.data.data,
                            }));
                        }
                    } catch {
                        // ignore
                    }
                }
            });
        }
    };

    // Find selected account object for intelligent hierarchy code matching
    const selectedAccountObj = useMemo(() => {
        if (!selectedAkun || selectedAkun === 'all') return null;
        return allAccounts.find((a) => String(a.id) === String(selectedAkun));
    }, [allAccounts, selectedAkun]);

    // Instant real-time filtering (zero-delay on client side)
    const filteredAccounts = useMemo(() => {
        if (!summaryData?.accounts) return [];
        return summaryData.accounts.filter((item) => {
            const matchSearch =
                !searchTerm.trim() ||
                item.akun.kode_akun.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.akun.nama_akun.toLowerCase().includes(searchTerm.toLowerCase());

            const matchJenis =
                selectedJenis === 'all' ||
                item.akun.jenis_akun?.toLowerCase() === selectedJenis.toLowerCase();

            // Intelligent account filter: matches exact ID OR if parent account is selected, matches all child accounts starting with code!
            const matchAkun =
                !selectedAccountObj ||
                item.akun.id === selectedAccountObj.id ||
                item.akun.kode_akun.startsWith(selectedAccountObj.kode_akun);

            return matchSearch && matchJenis && matchAkun;
        });
    }, [summaryData, searchTerm, selectedJenis, selectedAccountObj]);

    // Dynamic totals calculated live based on current active filters
    const totals = useMemo(() => {
        let awal = 0;
        let debet = 0;
        let kredit = 0;
        let akhir = 0;

        filteredAccounts.forEach((item) => {
            awal += Number(item.saldo_awal || 0);
            debet += Number(item.mutasi_debet || 0);
            kredit += Number(item.mutasi_kredit || 0);
            akhir += Number(item.saldo_akhir || 0);
        });

        return { awal, debet, kredit, akhir };
    }, [filteredAccounts]);

    // Group accounts by category/hierarchy
    const groupedAccounts = useMemo(() => {
        const groups: {
            categoryKey: string;
            categoryLabel: string;
            accounts: BukuBesarAccountSummary[];
            subtotalAwal: number;
            subtotalDebet: number;
            subtotalKredit: number;
            subtotalAkhir: number;
        }[] = [];

        const categories = [
            { key: 'aset', label: '1 - Aset' },
            { key: 'kewajiban', label: '2 - Kewajiban' },
            { key: 'ekuitas', label: '3 - Ekuitas' },
            { key: 'pendapatan', label: '4 - Pendapatan' },
            { key: 'beban', label: '5 - Beban' },
        ];

        categories.forEach((cat) => {
            const accs = filteredAccounts.filter(
                (a) =>
                    a.akun.jenis_akun?.toLowerCase() === cat.key ||
                    (cat.key === 'ekuitas' && a.akun.jenis_akun?.toLowerCase() === 'modal')
            );
            if (accs.length > 0) {
                const subAwal = accs.reduce((sum, a) => sum + Number(a.saldo_awal || 0), 0);
                const subDebet = accs.reduce((sum, a) => sum + Number(a.mutasi_debet || 0), 0);
                const subKredit = accs.reduce((sum, a) => sum + Number(a.mutasi_kredit || 0), 0);
                const subAkhir = accs.reduce((sum, a) => sum + Number(a.saldo_akhir || 0), 0);

                groups.push({
                    categoryKey: cat.key,
                    categoryLabel: cat.label,
                    accounts: accs,
                    subtotalAwal: subAwal,
                    subtotalDebet: subDebet,
                    subtotalKredit: subKredit,
                    subtotalAkhir: subAkhir,
                });
            }
        });

        // Any accounts that didn't match standard 5 categories
        const otherAccs = filteredAccounts.filter(
            (a) => !['aset', 'kewajiban', 'ekuitas', 'modal', 'pendapatan', 'beban'].includes(a.akun.jenis_akun?.toLowerCase())
        );
        if (otherAccs.length > 0) {
            const subAwal = otherAccs.reduce((sum, a) => sum + Number(a.saldo_awal || 0), 0);
            const subDebet = otherAccs.reduce((sum, a) => sum + Number(a.mutasi_debet || 0), 0);
            const subKredit = otherAccs.reduce((sum, a) => sum + Number(a.mutasi_kredit || 0), 0);
            const subAkhir = otherAccs.reduce((sum, a) => sum + Number(a.saldo_akhir || 0), 0);

            groups.push({
                categoryKey: 'lainnya',
                categoryLabel: 'Akun Lainnya',
                accounts: otherAccs,
                subtotalAwal: subAwal,
                subtotalDebet: subDebet,
                subtotalKredit: subKredit,
                subtotalAkhir: subAkhir,
            });
        }

        return groups;
    }, [filteredAccounts]);

    const hasActiveFilters =
        searchTerm !== '' ||
        selectedAkun !== 'all' ||
        selectedJenis !== 'all' ||
        periodeDari !== defaultStart ||
        periodeSampai !== defaultEnd;

    const handleReset = () => {
        setSearchTerm('');
        setSelectedAkun('all');
        setSelectedJenis('all');
        setPeriodeDari(defaultStart);
        setPeriodeSampai(defaultEnd);
    };

    const breadcrumbs = [

        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Buku Besar', href: '/akuntansi/buku-besar' },
    ];

    const accountOptions = [
        { value: 'all', label: 'Semua Akun' },
        ...allAccounts.map((a) => ({
            value: String(a.id),
            label: `${a.kode_akun} - ${a.nama_akun}`,
        })),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Buku Besar (General Ledger)
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                                    <span>Periode: {periodeDari} s/d {periodeSampai}</span>
                                    <span>•</span>
                                    <span>{filteredAccounts.length} Akun</span>
                                    {loadingSummary && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons: Reset, Expand/Collapse All, Refresh */}
                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                    title="Reset semua filter ke default"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleAllRows}
                                className="h-8 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 px-2.5 gap-1.5"
                            >
                                <Layers className="size-3.5" />
                                <span>
                                    {expandedRows.size === filteredAccounts.length && filteredAccounts.length > 0
                                        ? 'Tutup Semua'
                                        : 'Buka Semua'}
                                </span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fetchSummary(periodeDari, periodeSampai)}
                                disabled={loadingSummary}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loadingSummary && 'animate-spin')} />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            {/* 1. Cari Akun */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Akun
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Kode / nama akun..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            {/* 2. Akun Spesifik */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Akun Spesifik
                                </label>
                                <SearchableSelect
                                    options={accountOptions}
                                    value={selectedAkun}
                                    onValueChange={(val) => setSelectedAkun(val)}
                                    placeholder="Semua Akun"
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>

                            {/* 3. Kategori Akun */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Kategori Akun
                                </label>
                                <NativeSearchableSelect
                                    value={selectedJenis}
                                    onChange={(e) => setSelectedJenis(e.target.value)}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer"
                                >
                                    <option value="all">Semua Kategori</option>
                                    <option value="aset">Aset</option>
                                    <option value="kewajiban">Kewajiban</option>
                                    <option value="ekuitas">Ekuitas</option>
                                    <option value="pendapatan">Pendapatan</option>
                                    <option value="beban">Beban</option>
                                </NativeSearchableSelect>
                            </div>

                            {/* 4. Dari Tanggal */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Dari Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={periodeDari}
                                    onChange={(e) => setPeriodeDari(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>

                            {/* 5. Sampai Tanggal */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Sampai Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={periodeSampai}
                                    onChange={(e) => setPeriodeSampai(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. KPI Summary Strip (Divided seamlessly inside single container) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                        {/* 1. Saldo Awal */}
                        <div className="p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Saldo Awal
                                </span>
                                <Calculator className="size-4 text-neutral-400" />
                            </div>
                            <div className={cn("text-base sm:text-lg font-bold mt-1 font-mono tabular-nums", getAmountColor(totals.awal))}>
                                {formatRupiah(totals.awal)}
                            </div>
                        </div>

                        {/* 2. Mutasi Debet */}
                        <div className="p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Mutasi Debet
                                </span>
                                <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className={cn("text-base sm:text-lg font-bold mt-1 font-mono tabular-nums", totals.debet < 0 ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-emerald-600 dark:text-emerald-400")}>
                                {formatRupiah(totals.debet)}
                            </div>
                        </div>

                        {/* 3. Mutasi Kredit */}
                        <div className="p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Mutasi Kredit
                                </span>
                                <TrendingDown className="size-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className={cn("text-base sm:text-lg font-bold mt-1 font-mono tabular-nums", totals.kredit < 0 ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-amber-600 dark:text-amber-400")}>
                                {formatRupiah(totals.kredit)}
                            </div>
                        </div>

                        {/* 4. Saldo Akhir */}
                        <div className="p-3.5 bg-neutral-900 text-white dark:bg-neutral-800">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                                    Total Saldo Akhir
                                </span>
                                <FileText className="size-4 text-neutral-400" />
                            </div>
                            <div className={cn("text-base sm:text-lg font-bold mt-1 font-mono tabular-nums", totals.akhir < 0 ? "text-rose-400 font-semibold" : "text-white")}>
                                {formatRupiah(totals.akhir)}
                            </div>
                        </div>
                    </div>

                    {/* 4. The Collapsible Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-left w-8"></th>
                                    <th className="py-2.5 px-3 text-left w-24">Kode</th>
                                    <th className="py-2.5 px-3 text-left">Akun</th>
                                    <th className="py-2.5 px-3 text-left w-24">Kategori</th>
                                    <th className="py-2.5 px-3 text-right w-32">Saldo Awal</th>
                                    <th className="py-2.5 px-3 text-right w-28">Debet</th>
                                    <th className="py-2.5 px-3 text-right w-28">Kredit</th>
                                    <th className="py-2.5 px-3 text-right w-36">Saldo Akhir</th>
                                    <th className="py-2.5 px-3 text-center w-16">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {loadingSummary && (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-500">
                                            <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                                            Memuat data buku besar...
                                        </td>
                                    </tr>
                                )}

                                {!loadingSummary && filteredAccounts.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400 italic">
                                            Tidak ada data buku besar untuk periode yang dipilih.
                                        </td>
                                    </tr>
                                )}

                                {!loadingSummary &&
                                    groupedAccounts.map((group) => (
                                        <React.Fragment key={group.categoryKey}>
                                            {/* Category Section Header (Hierarki Kategori) */}
                                            <tr className="bg-neutral-100/70 dark:bg-neutral-900/80 font-bold border-y border-neutral-200 dark:border-neutral-800">
                                                <td colSpan={4} className="py-2 px-3 text-[11px] uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                                    📁 {group.categoryLabel} ({group.accounts.length} Akun)
                                                </td>
                                                <td className={cn("py-2 px-3 text-right font-mono tabular-nums", getAmountColor(group.subtotalAwal, "text-neutral-700 dark:text-neutral-300"))}>
                                                    {formatRupiah(group.subtotalAwal)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                                                    {formatRupiah(group.subtotalDebet)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400">
                                                    {formatRupiah(group.subtotalKredit)}
                                                </td>
                                                <td className={cn("py-2 px-3 text-right font-mono tabular-nums font-semibold", getAmountColor(group.subtotalAkhir, "text-neutral-900 dark:text-white"))}>
                                                    {formatRupiah(group.subtotalAkhir)}
                                                </td>
                                                <td></td>
                                            </tr>

                                            {/* Account Rows inside Category */}
                                            {group.accounts.map((item, idx) => {
                                                const isExpanded = expandedRows.has(item.akun.id);
                                                const badgeClass =
                                                    badgeJenisAkun[item.akun.jenis_akun?.toLowerCase()] ||
                                                    'border-neutral-200 bg-neutral-100 text-neutral-700';

                                                const detail = detailsCache[item.akun.id];
                                                const isRowLoading = loadingDetails[item.akun.id];

                                                return (
                                                    <React.Fragment key={item.akun.id}>
                                                        {/* Main Account Row */}
                                                        <tr
                                                            onClick={() => toggleRow(item.akun.id)}
                                                            className={cn(
                                                                'border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition cursor-pointer select-none',
                                                                isExpanded
                                                                    ? 'bg-neutral-50/70 dark:bg-neutral-900/40'
                                                                    : idx % 2 === 0
                                                                        ? 'bg-white dark:bg-neutral-950'
                                                                        : 'bg-neutral-50/20 dark:bg-neutral-900/20'
                                                            )}
                                                        >
                                                            {/* Chevron toggle */}
                                                            <td className="py-2.5 px-3 text-center">
                                                                {isExpanded ? (
                                                                    <ChevronDown className="size-3.5 text-neutral-700 dark:text-neutral-300" />
                                                                ) : (
                                                                    <ChevronRight className="size-3.5 text-neutral-400" />
                                                                )}
                                                            </td>

                                                            {/* Kode Akun */}
                                                            <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                                {item.akun.kode_akun}
                                                            </td>

                                                            {/* Nama Akun */}
                                                            <td className="py-2.5 px-3">
                                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    {item.akun.nama_akun}
                                                                </div>
                                                                <div className="text-[11px] text-neutral-400">
                                                                    {item.transaksi_count} transaksi mutasi
                                                                </div>
                                                            </td>

                                                            {/* Jenis Akun Badge */}
                                                            <td className="py-2.5 px-3">
                                                                <span
                                                                    className={cn(
                                                                        'text-[9px] uppercase px-1.5 py-0.2 font-semibold border',
                                                                        badgeClass
                                                                    )}
                                                                >
                                                                    {jenisAkunLabels[item.akun.jenis_akun] || item.akun.jenis_akun}
                                                                </span>
                                                            </td>

                                                            {/* Saldo Awal */}
                                                            <td className={cn("py-2.5 px-3 text-right font-mono tabular-nums", getAmountColor(item.saldo_awal, "text-neutral-700 dark:text-neutral-300"))}>
                                                                {formatRupiah(item.saldo_awal)}
                                                            </td>

                                                            {/* Debet */}
                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                                                                {Number(item.mutasi_debet) > 0
                                                                    ? formatRupiah(item.mutasi_debet)
                                                                    : '—'}
                                                            </td>

                                                            {/* Kredit */}
                                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                                                                {Number(item.mutasi_kredit) > 0
                                                                    ? formatRupiah(item.mutasi_kredit)
                                                                    : '—'}
                                                            </td>

                                                            {/* Saldo Akhir */}
                                                            <td className={cn("py-2.5 px-3 text-right font-mono tabular-nums font-bold", getAmountColor(item.saldo_akhir, "text-neutral-900 dark:text-white"))}>
                                                                {formatRupiah(item.saldo_akhir)}
                                                            </td>

                                                            {/* Aksi: Buka Detail */}
                                                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                                <Can permission="akuntansi.buku-besar.view">
                                                                    <Button
                                                                        asChild
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                                                                        title="Buka Kartu Buku Besar"
                                                                    >
                                                                        <Link to={`/akuntansi/buku-besar/${item.akun.id}?start_date=${periodeDari}&end_date=${periodeSampai}`}>
                                                                            <Eye className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                                                        </Link>
                                                                    </Button>
                                                                </Can>
                                                            </td>
                                                        </tr>

                                                        {/* ─── Expandable Sub-Row (Clean Seamless Mutasi Table) ─── */}
                                                        {isExpanded && (
                                                            <tr className="bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800">
                                                                <td colSpan={9} className="py-3 px-4 sm:px-6">
                                                                    {/* Simple Sub-header Info Bar */}
                                                                    <div className="mb-2.5 flex items-center justify-between text-xs pb-1.5 border-b border-neutral-200/70 dark:border-neutral-800">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-[11px] font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5">
                                                                                {item.akun.kode_akun}
                                                                            </span>
                                                                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase text-[11px] tracking-tight">
                                                                                Mutasi Transaksi: {item.akun.nama_akun}
                                                                            </span>
                                                                            <span className="text-[11px] text-neutral-400 font-mono">
                                                                                ({detail ? detail.transactions.length : item.transaksi_count} mutasi)
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-[11px] text-neutral-500 font-mono">
                                                                                Saldo Normal:{' '}
                                                                                <strong className="uppercase text-neutral-700 dark:text-neutral-300">
                                                                                    {item.akun.saldo_normal}
                                                                                </strong>
                                                                            </span>
                                                                            <Link
                                                                                to={`/akuntansi/buku-besar/${item.akun.id}?start_date=${periodeDari}&end_date=${periodeSampai}`}
                                                                                className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline underline-offset-2"
                                                                            >
                                                                                Buka Detail Lengkap →
                                                                            </Link>
                                                                        </div>
                                                                    </div>

                                                                    {/* Loading State */}
                                                                    {isRowLoading && (
                                                                        <div className="py-6 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                                                                            <RefreshCw className="size-3.5 animate-spin text-neutral-400" />
                                                                            <span>Memuat transaksi mutasi...</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Sub-table Content */}
                                                                    {!isRowLoading && detail && (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-xs border-collapse">
                                                                                <thead>
                                                                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                                                        <th className="py-1.5 px-2 text-left w-28">Tanggal</th>
                                                                                        <th className="py-1.5 px-2 text-left w-36">No. Referensi</th>
                                                                                        <th className="py-1.5 px-2 text-left">Keterangan</th>
                                                                                        <th className="py-1.5 px-2 text-right w-28">Debet</th>
                                                                                        <th className="py-1.5 px-2 text-right w-28">Kredit</th>
                                                                                        <th className="py-1.5 px-2 text-right w-36">Saldo Berjalan</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-neutral-200/50 dark:divide-neutral-800/50">
                                                                                    {/* Saldo Awal Row */}
                                                                                    <tr className="text-neutral-600 dark:text-neutral-400 italic">
                                                                                        <td className="py-1.5 px-2 font-mono text-neutral-400">—</td>
                                                                                        <td className="py-1.5 px-2 font-mono text-neutral-400">—</td>
                                                                                        <td className="py-1.5 px-2 font-medium text-neutral-700 dark:text-neutral-300">
                                                                                            Saldo Awal Periode
                                                                                        </td>
                                                                                        <td className="py-1.5 px-2 text-right font-mono text-neutral-400">—</td>
                                                                                        <td className="py-1.5 px-2 text-right font-mono text-neutral-400">—</td>
                                                                                        <td className="py-1.5 px-2 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                                                            {formatRupiah(detail.saldo_awal)}
                                                                                        </td>
                                                                                    </tr>

                                                                                    {detail.transactions.length === 0 ? (
                                                                                        <tr>
                                                                                            <td
                                                                                                colSpan={6}
                                                                                                className="py-4 text-center text-neutral-400 italic"
                                                                                            >
                                                                                                Tidak ada mutasi transaksi pada periode ini.
                                                                                            </td>
                                                                                        </tr>
                                                                                    ) : (
                                                                                        detail.transactions.map((tx, txIdx) => {
                                                                                            const dDisplay = tx.tanggal_transaksi
                                                                                                ? new Date(tx.tanggal_transaksi).toLocaleDateString('id-ID', {
                                                                                                    day: '2-digit',
                                                                                                    month: 'short',
                                                                                                    year: 'numeric',
                                                                                                })
                                                                                                : '—';

                                                                                            const dNum = Number(tx.debit || 0);
                                                                                            const kNum = Number(tx.kredit || 0);

                                                                                            return (
                                                                                                <tr
                                                                                                    key={txIdx}
                                                                                                    className="hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30 transition-colors"
                                                                                                >
                                                                                                    <td className="py-1.5 px-2 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                                                                        {dDisplay}
                                                                                                    </td>
                                                                                                    <td className="py-1.5 px-2 whitespace-nowrap">
                                                                                                        <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                                                                                                            {tx.nomor_jurnal || '—'}
                                                                                                        </span>
                                                                                                    </td>
                                                                                                    <td className="py-1.5 px-2 text-neutral-700 dark:text-neutral-300">
                                                                                                        {tx.keterangan || '—'}
                                                                                                    </td>
                                                                                                    <td className="py-1.5 px-2 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                                                                                                        {dNum > 0 ? formatRupiah(dNum) : '—'}
                                                                                                    </td>
                                                                                                    <td className="py-1.5 px-2 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                                                                                                        {kNum > 0 ? formatRupiah(kNum) : '—'}
                                                                                                    </td>
                                                                                                    <td className="py-1.5 px-2 text-right font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                                                                                                        {formatRupiah(tx.saldo)}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        })
                                                                                    )}
                                                                                </tbody>
                                                                                <tfoot>
                                                                                    <tr className="border-t border-neutral-300 dark:border-neutral-700 font-bold text-neutral-900 dark:text-white text-[11px]">
                                                                                        <td colSpan={3} className="py-2 px-2 text-right uppercase tracking-wider text-[11px] text-neutral-500">
                                                                                            Total Mutasi & Saldo Akhir:
                                                                                        </td>
                                                                                        <td className="py-2 px-2 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                                                                                            {formatRupiah(detail.total_debit)}
                                                                                        </td>
                                                                                        <td className="py-2 px-2 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400">
                                                                                            {formatRupiah(detail.total_kredit)}
                                                                                        </td>
                                                                                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                                                                                            {formatRupiah(detail.saldo_akhir)}
                                                                                        </td>
                                                                                    </tr>
                                                                                </tfoot>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900 font-bold text-neutral-900 dark:text-white">
                                    <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Total Seluruh Akun:
                                    </td>
                                    <td className={cn("py-3 px-3 text-right font-mono tabular-nums", getAmountColor(totals.awal))}>
                                        {formatRupiah(totals.awal)}
                                    </td>
                                    <td className={cn("py-3 px-3 text-right font-mono tabular-nums font-semibold", totals.debet < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400")}>
                                        {formatRupiah(totals.debet)}
                                    </td>
                                    <td className={cn("py-3 px-3 text-right font-mono tabular-nums font-semibold", totals.kredit < 0 ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400")}>
                                        {formatRupiah(totals.kredit)}
                                    </td>
                                    <td className={cn("py-3 px-3 text-right font-mono tabular-nums", getAmountColor(totals.akhir))}>
                                        {formatRupiah(totals.akhir)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
