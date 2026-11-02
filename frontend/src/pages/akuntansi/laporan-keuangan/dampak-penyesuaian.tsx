import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { DampakPenyesuaianResponse, DampakAkunItem } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { formatRupiah, cn } from '@/lib/utils';
import {
    ArrowLeft,
    FileEdit,
    Calendar,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Scale,
    Building2,
    Wallet,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
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

export default function DampakPenyesuaianPage() {
    const navigate = useNavigate();

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [data, setData] = useState<DampakPenyesuaianResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Collapsible states
    const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());

    const fetchDampak = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/laporan/dampak-penyesuaian', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                },
            });
            setData(res.data?.data || null);
        } catch {
            toast.error('Gagal memuat laporan dampak jurnal penyesuaian');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchDampak();
    }, [fetchDampak]);

    const toggleAccount = (accountId: number) => {
        setExpandedAccounts((prev) => {
            const next = new Set(prev);
            if (next.has(accountId)) {
                next.delete(accountId);
            } else {
                next.add(accountId);
            }
            return next;
        });
    };

    const toggleAllAccounts = () => {
        if (!data?.dampak_per_jenis_akun) return;
        const allAccs: number[] = [];
        Object.values(data.dampak_per_jenis_akun).forEach((list) => {
            list.forEach((item) => allAccs.push(item.akun_id));
        });

        if (expandedAccounts.size === allAccs.length && allAccs.length > 0) {
            setExpandedAccounts(new Set());
        } else {
            setExpandedAccounts(new Set(allAccs));
        }
    };

    const breadcrumbs = [

        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Laporan Keuangan', href: '/akuntansi/laporan-keuangan' },
        { title: 'Dampak Penyesuaian' },
    ];

    const categories = [
        { key: 'pendapatan', label: '1. DAMPAK PENDAPATAN', icon: TrendingUp, color: 'text-emerald-700 dark:text-emerald-400' },
        { key: 'beban', label: '2. DAMPAK BEBAN OPERASIONAL', icon: TrendingDown, color: 'text-rose-700 dark:text-rose-400' },
        { key: 'aset', label: '3. DAMPAK ASET (AKTIVA)', icon: Building2, color: 'text-blue-700 dark:text-blue-400' },
        { key: 'kewajiban', label: '4. DAMPAK KEWAJIBAN (UTANG)', icon: Scale, color: 'text-amber-700 dark:text-amber-400' },
        { key: 'ekuitas', label: '5. DAMPAK EKUITAS (MODAL)', icon: Wallet, color: 'text-purple-700 dark:text-purple-400' },
    ];

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

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <FileEdit className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Laporan Dampak Jurnal Penyesuaian (AJP)
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                                        <span>Periode: {startDate} s/d {endDate}</span>
                                        <span>•</span>
                                        <span>{data?.total_jurnal_penyesuaian || 0} Jurnal Penyesuaian Posted</span>
                                        {loading && (
                                            <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleAllAccounts}
                                className="h-8 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 px-2.5 gap-1.5"
                            >
                                <ChevronsUpDown className="size-3.5" />
                                <span>Buka / Tutup Rincian</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchDampak}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                Rentang Periode Audit:
                            </span>
                            <div className="flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs">
                                <Calendar className="size-3.5 text-neutral-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none outline-none font-mono text-neutral-800 dark:text-neutral-200 text-xs cursor-pointer"
                                />
                                <span className="text-neutral-400">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none outline-none font-mono text-neutral-800 dark:text-neutral-200 text-xs cursor-pointer"
                                />
                            </div>
                        </div>

                        <span className="text-[11px] text-neutral-500">
                            Menghitung mutasi neto seluruh jurnal penyesuaian berstatus posted dalam periode
                        </span>
                    </div>

                    {/* 3. KPI Summary Strip (6 Divided Metrics) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-b border-neutral-200 dark:border-neutral-800 divide-x divide-y md:divide-y-0 divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                        {/* 1. Dampak Pendapatan */}
                        <div className="p-3">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                Dampak Pendapatan
                            </span>
                            <div className={cn("text-sm sm:text-base font-bold mt-1 font-mono tabular-nums", getAmountColor(data?.dampak_pendapatan || 0, "text-emerald-700 dark:text-emerald-400"))}>
                                {formatRupiah(data?.dampak_pendapatan || 0)}
                            </div>
                        </div>

                        {/* 2. Dampak Beban */}
                        <div className="p-3">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                Dampak Beban
                            </span>
                            <div className={cn("text-sm sm:text-base font-bold mt-1 font-mono tabular-nums", getAmountColor(data?.dampak_beban || 0, "text-amber-700 dark:text-amber-400"))}>
                                {formatRupiah(data?.dampak_beban || 0)}
                            </div>
                        </div>

                        {/* 3. Dampak Net Laba Rugi */}
                        <div className="p-3 bg-neutral-900 text-white dark:bg-neutral-800">
                            <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block">
                                Dampak Laba/Rugi
                            </span>
                            <div className={cn("text-sm sm:text-base font-bold mt-1 font-mono tabular-nums", Number(data?.dampak_laba_rugi || 0) < 0 ? "text-rose-400" : "text-emerald-400")}>
                                {formatRupiah(data?.dampak_laba_rugi || 0)}
                            </div>
                        </div>

                        {/* 4. Dampak Aset */}
                        <div className="p-3">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                Dampak Aset
                            </span>
                            <div className={cn("text-sm sm:text-base font-bold mt-1 font-mono tabular-nums", getAmountColor(data?.dampak_aset || 0, "text-blue-700 dark:text-blue-400"))}>
                                {formatRupiah(data?.dampak_aset || 0)}
                            </div>
                        </div>

                        {/* 5. Dampak Kewajiban */}
                        <div className="p-3">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                Dampak Kewajiban
                            </span>
                            <div className={cn("text-sm sm:text-base font-bold mt-1 font-mono tabular-nums", getAmountColor(data?.dampak_kewajiban || 0, "text-amber-700 dark:text-amber-400"))}>
                                {formatRupiah(data?.dampak_kewajiban || 0)}
                            </div>
                        </div>

                        {/* 6. Dampak Modal */}
                        <div className="p-3">
                            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                Dampak Ekuitas
                            </span>
                            <div className={cn("text-sm sm:text-base font-bold mt-1 font-mono tabular-nums", getAmountColor(data?.dampak_modal || 0, "text-purple-700 dark:text-purple-400"))}>
                                {formatRupiah(data?.dampak_modal || 0)}
                            </div>
                        </div>
                    </div>

                    {/* 4. Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-left w-8"></th>
                                    <th className="py-2.5 px-3 text-left w-28">Kode Akun</th>
                                    <th className="py-2.5 px-3 text-left">Nama Rekening / Akun Terdampak</th>
                                    <th className="py-2.5 px-3 text-right w-36">Total Debet</th>
                                    <th className="py-2.5 px-3 text-right w-36">Total Kredit</th>
                                    <th className="py-2.5 px-3 text-right w-40">Net Dampak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {loading && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-neutral-500">
                                            <RefreshCw className="size-4 animate-spin inline-block mr-2" />
                                            Memuat dampak jurnal penyesuaian...
                                        </td>
                                    </tr>
                                )}

                                {!loading && data?.total_jurnal_penyesuaian === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-neutral-500">
                                            Tidak ada transaksi jurnal penyesuaian berstatus posted pada periode ini.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    data &&
                                    categories.map((cat) => {
                                        const items: DampakAkunItem[] =
                                            data.dampak_per_jenis_akun?.[cat.key as keyof typeof data.dampak_per_jenis_akun] || [];

                                        if (items.length === 0) return null;

                                        const subDebit = items.reduce((sum, i) => sum + Number(i.total_debit || 0), 0);
                                        const subKredit = items.reduce((sum, i) => sum + Number(i.total_kredit || 0), 0);
                                        const subNet = items.reduce((sum, i) => sum + Number(i.net || 0), 0);

                                        return (
                                            <React.Fragment key={cat.key}>
                                                {/* Category Header Row */}
                                                <tr className="bg-neutral-100/70 dark:bg-neutral-900/80 font-bold border-y border-neutral-200 dark:border-neutral-800">
                                                    <td colSpan={3} className={cn("py-2 px-3 text-[11px] uppercase tracking-wider", cat.color)}>
                                                        {cat.label} ({items.length} Rekening)
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                                                        {formatRupiah(subDebit)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                                                        {formatRupiah(subKredit)}
                                                    </td>
                                                    <td className={cn("py-2 px-3 text-right font-mono tabular-nums font-bold", getAmountColor(subNet))}>
                                                        {formatRupiah(subNet)}
                                                    </td>
                                                </tr>

                                                {/* Account Items */}
                                                {items.map((item) => {
                                                    const isExpanded = expandedAccounts.has(item.akun_id);

                                                    return (
                                                        <React.Fragment key={item.akun_id}>
                                                            <tr
                                                                onClick={() => toggleAccount(item.akun_id)}
                                                                className={cn(
                                                                    'hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer select-none transition border-b border-neutral-100 dark:border-neutral-900',
                                                                    isExpanded && 'bg-neutral-50/60 dark:bg-neutral-900/40'
                                                                )}
                                                            >
                                                                <td className="py-2 px-3 text-center">
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="size-3.5 text-neutral-700 dark:text-neutral-300" />
                                                                    ) : (
                                                                        <ChevronRight className="size-3.5 text-neutral-400" />
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                                    {item.kode_akun}
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                                        {item.nama_akun}
                                                                    </div>
                                                                    <div className="text-[11px] text-neutral-400 font-mono">
                                                                        {item.jurnal_list?.length || 0} mutasi penyesuaian
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                                                                    {Number(item.total_debit) > 0 ? formatRupiah(item.total_debit) : '—'}
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                                                                    {Number(item.total_kredit) > 0 ? formatRupiah(item.total_kredit) : '—'}
                                                                </td>
                                                                <td className={cn("py-2 px-3 text-right font-mono tabular-nums font-bold", getAmountColor(item.net))}>
                                                                    {formatRupiah(item.net)}
                                                                </td>
                                                            </tr>

                                                            {/* Expandable Transactions */}
                                                            {isExpanded && (
                                                                <tr className="bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                                                    <td colSpan={6} className="py-2.5 px-6">
                                                                        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                                                                            Rincian Jurnal Penyesuaian: {item.nama_akun}
                                                                        </div>
                                                                        <table className="w-full text-[11px] border-collapse bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                                                                            <thead>
                                                                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900 text-[11px] font-semibold text-neutral-500 uppercase">
                                                                                    <th className="py-1 px-2 text-left w-24">Tanggal</th>
                                                                                    <th className="py-1 px-2 text-left w-36">No. Jurnal</th>
                                                                                    <th className="py-1 px-2 text-left">Keterangan</th>
                                                                                    <th className="py-1 px-2 text-right w-28">Debet</th>
                                                                                    <th className="py-1 px-2 text-right w-28">Kredit</th>
                                                                                    <th className="py-1 px-2 text-right w-32">Dampak Net</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                                                {item.jurnal_list?.map((j, jIdx) => (
                                                                                    <tr key={jIdx}>
                                                                                        <td className="py-1 px-2 font-mono text-neutral-600 dark:text-neutral-400">
                                                                                            {j.tanggal}
                                                                                        </td>
                                                                                        <td className="py-1 px-2 font-mono font-medium text-neutral-800 dark:text-neutral-200">
                                                                                            {j.nomor_jurnal}
                                                                                        </td>
                                                                                        <td className="py-1 px-2 text-neutral-700 dark:text-neutral-300">
                                                                                            {j.keterangan || '—'}
                                                                                        </td>
                                                                                        <td className="py-1 px-2 text-right font-mono tabular-nums">
                                                                                            {Number(j.debit) > 0 ? formatRupiah(j.debit) : '—'}
                                                                                        </td>
                                                                                        <td className="py-1 px-2 text-right font-mono tabular-nums">
                                                                                            {Number(j.kredit) > 0 ? formatRupiah(j.kredit) : '—'}
                                                                                        </td>
                                                                                        <td className={cn("py-1 px-2 text-right font-mono tabular-nums font-semibold", getAmountColor(j.net))}>
                                                                                            {formatRupiah(j.net)}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

