import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ArusKasResponse } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah, cn } from '@/lib/utils';
import {
    ArrowLeft,
    Activity,
    TrendingUp,
    TrendingDown,
    DollarSign,
    RefreshCw,
    ChevronsUpDown,
    ChevronDown,
    ChevronRight,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Laporan Keuangan', href: '/akuntansi/laporan-keuangan' },
    { title: 'Arus Kas' },
];

export default function LaporanArusKas() {
    const navigate = useNavigate();

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [includePenyesuaian, setIncludePenyesuaian] = useState(true);
    const [data, setData] = useState<ArusKasResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Collapsible rows for account transactions
    const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());

    const toggleAccount = (id: number) => {
        setExpandedAccounts((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAllAccounts = (allIds: number[]) => {
        const allAreExpanded = allIds.length > 0 && allIds.every((id) => expandedAccounts.has(id));
        if (allAreExpanded) {
            setExpandedAccounts(new Set());
        } else {
            setExpandedAccounts(new Set(allIds));
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/laporan/arus-kas', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    include_penyesuaian: includePenyesuaian,
                },
            });
            setData(res.data?.data || null);
        } catch {
            toast.error('Gagal memuat laporan arus kas');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, includePenyesuaian]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const accounts = data?.accounts || [];
    const allAccountIds = useMemo(() => accounts.map((a) => a.akun.id), [accounts]);
    const isAllExpanded = allAccountIds.length > 0 && allAccountIds.every((id) => expandedAccounts.has(id));

    const totalSaldoAwal = Number(data?.total_saldo_awal || 0);
    const totalMasuk = Number(data?.total_kas_masuk || 0);
    const totalKeluar = Number(data?.total_kas_keluar || 0);
    const netArusKas = Number(data?.net_arus_kas || 0);
    const totalSaldoAkhir = Number(data?.total_saldo_akhir || 0);

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
                                <Activity className="size-4" />
                            </div>

                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Laporan Arus Kas (Statement of Cash Flows)
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
                            {accounts.length > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleAllAccounts(allAccountIds)}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 gap-1.5 shadow-none"
                                    title={isAllExpanded ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}
                                >
                                    <ChevronsUpDown className="size-3.5" />
                                    <span>{isAllExpanded ? 'Tutup Semua' : 'Buka Semua'}</span>
                                </Button>
                            )}

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
                                Memasukkan saldo penyesuaian akhir periode
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
                            {/* Saldo Awal */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Saldo Awal Kas
                                    </span>
                                    <Wallet className="size-3.5 text-neutral-400" />
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    totalSaldoAwal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-neutral-100'
                                )}>
                                    {formatRupiah(totalSaldoAwal)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Sebelum {formattedStartDate}
                                </span>
                            </div>

                            {/* Kas Masuk */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Total Kas Masuk
                                    </span>
                                    <TrendingUp className="size-3.5 text-emerald-600" />
                                </div>
                                <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {formatRupiah(totalMasuk)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Mutasi penerimaan kas
                                </span>
                            </div>

                            {/* Kas Keluar */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Total Kas Keluar
                                    </span>
                                    <TrendingDown className="size-3.5 text-rose-600" />
                                </div>
                                <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                                    {formatRupiah(totalKeluar)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Mutasi pengeluaran kas
                                </span>
                            </div>

                            {/* Net Arus Kas */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                                <div className="flex items-center justify-between text-neutral-500 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Net Arus Kas
                                    </span>
                                    <Activity className={cn('size-3.5', netArusKas >= 0 ? 'text-emerald-600' : 'text-rose-600')} />
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    netArusKas < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                )}>
                                    {formatRupiah(netArusKas)}
                                </div>
                                <span className="text-[11px] font-mono block mt-0.5">
                                    {netArusKas >= 0 ? (
                                        <span className="text-emerald-600 font-semibold">SURPLUS ARUS KAS</span>
                                    ) : (
                                        <span className="text-rose-600 font-semibold">DEFISIT ARUS KAS</span>
                                    )}
                                </span>
                            </div>

                            {/* Saldo Akhir */}
                            <div className="p-3 border border-neutral-900 dark:border-neutral-700 bg-neutral-900 text-white dark:bg-neutral-900">
                                <div className="flex items-center justify-between text-neutral-400 mb-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                                        Saldo Akhir Kas
                                    </span>
                                    <DollarSign className="size-3.5 text-emerald-400" />
                                </div>
                                <div className={cn(
                                    'text-sm font-bold font-mono',
                                    totalSaldoAkhir < 0 ? 'text-rose-400 font-semibold' : 'text-white'
                                )}>
                                    {formatRupiah(totalSaldoAkhir)}
                                </div>
                                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                    Per {formattedEndDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Table Section: Breakdown Arus Kas per Rekening */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-3 px-4 text-left w-12">#</th>
                                    <th className="py-3 px-4 text-left w-40">Kode Akun</th>
                                    <th className="py-3 px-4 text-left">Nama Rekening Kas / Bank</th>
                                    <th className="py-3 px-4 text-right w-36">Saldo Awal</th>
                                    <th className="py-3 px-4 text-right w-36">Kas Masuk</th>
                                    <th className="py-3 px-4 text-right w-36">Kas Keluar</th>
                                    <th className="py-3 px-4 text-right w-36">Net Arus Kas</th>
                                    <th className="py-3 px-4 text-right w-36">Saldo Akhir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-14 text-center text-neutral-500 text-sm">
                                            <RefreshCw className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                                            Menghitung arus kas transaksi...
                                        </td>
                                    </tr>
                                ) : accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-14 text-center text-neutral-500 text-sm">
                                            Tidak ada transaksi pada rekening kas atau bank selama periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map((group, idx) => {
                                        const isExpanded = expandedAccounts.has(group.akun.id);
                                        const saldoAwalNum = Number(group.saldo_awal || 0);
                                        const masukNum = Number(group.total_masuk || 0);
                                        const keluarNum = Number(group.total_keluar || 0);
                                        const netNum = Number(group.net || 0);
                                        const saldoAkhirNum = Number(group.saldo_akhir || 0);
                                        const transaksiList = group.transaksi || [];

                                        return (
                                            <React.Fragment key={group.akun.id}>
                                                <tr
                                                    onClick={() => toggleAccount(group.akun.id)}
                                                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none bg-white dark:bg-neutral-950"
                                                >
                                                    <td className="py-3 px-4 font-mono text-neutral-400 text-xs">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                            {group.akun.kode_akun}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? (
                                                                <ChevronDown className="size-4 text-neutral-400" />
                                                            ) : (
                                                                <ChevronRight className="size-4 text-neutral-400" />
                                                            )}
                                                            <span>{group.akun.nama_akun}</span>
                                                            <span className="text-[11px] font-mono text-neutral-400 font-normal">
                                                                ({transaksiList.length} mutasi)
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={cn(
                                                        'py-3 px-4 text-right font-mono font-medium tabular-nums',
                                                        saldoAwalNum < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                                                    )}>
                                                        {formatRupiah(saldoAwalNum)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                                                        {masukNum > 0 ? formatRupiah(masukNum) : '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                                                        {keluarNum > 0 ? formatRupiah(keluarNum) : '—'}
                                                    </td>
                                                    <td className={cn(
                                                        'py-3 px-4 text-right font-mono font-bold tabular-nums',
                                                        netNum < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'
                                                    )}>
                                                        {formatRupiah(netNum)}
                                                    </td>
                                                    <td className={cn(
                                                        'py-3 px-4 text-right font-mono font-bold tabular-nums',
                                                        saldoAkhirNum < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-neutral-900 dark:text-white'
                                                    )}>
                                                        {formatRupiah(saldoAkhirNum)}
                                                    </td>
                                                </tr>

                                                {/* Expanded Transaction Details */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={8} className="p-0 bg-neutral-50/50 dark:bg-neutral-900/30">
                                                            <div className="px-6 py-3 border-y border-neutral-200 dark:border-neutral-800">
                                                                <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                                                                    Rincian Mutasi Kas: {group.akun.kode_akun} - {group.akun.nama_akun}
                                                                </div>
                                                                <table className="w-full text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                                                    <thead>
                                                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                                                            <th className="py-2 px-3 text-left w-28">Tanggal</th>
                                                                            <th className="py-2 px-3 text-left w-44">No. Jurnal</th>
                                                                            <th className="py-2 px-3 text-left">Keterangan Transaksi</th>
                                                                            <th className="py-2 px-3 text-right w-36">Kas Masuk (Rp)</th>
                                                                            <th className="py-2 px-3 text-right w-36">Kas Keluar (Rp)</th>
                                                                            <th className="py-2 px-3 text-right w-36">Net (Rp)</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                                                        {transaksiList.length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan={6} className="py-5 text-center text-neutral-400 italic font-mono text-[11px]">
                                                                                    Tidak ada transaksi mutasi kas/bank pada akun ini selama periode yang dipilih.
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            transaksiList.map((tx, tIdx) => {
                                                                                const txNet = Number(tx.net || 0);
                                                                                return (
                                                                                    <tr key={tIdx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                                                                        <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                                                            {tx.tanggal ? tx.tanggal.split('T')[0] : '—'}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 font-mono font-medium text-neutral-800 dark:text-neutral-200">
                                                                                            {tx.referensi || '—'}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200">
                                                                                            {tx.keterangan || '—'}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                                                                                            {Number(tx.kas_masuk) > 0 ? formatRupiah(tx.kas_masuk) : '—'}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-right font-mono text-rose-700 dark:text-rose-400">
                                                                                            {Number(tx.kas_keluar) > 0 ? formatRupiah(tx.kas_keluar) : '—'}
                                                                                        </td>
                                                                                        <td className={cn(
                                                                                            'py-2 px-3 text-right font-mono font-semibold',
                                                                                            txNet < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                                                                                        )}>
                                                                                            {formatRupiah(txNet)}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                            {accounts.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900 font-bold text-sm text-neutral-900 dark:text-white">
                                        <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs tracking-wider">
                                            Total Arus Kas:
                                        </td>
                                        <td className={cn(
                                            'py-3 px-4 text-right font-mono tabular-nums',
                                            totalSaldoAwal < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
                                        )}>
                                            {formatRupiah(totalSaldoAwal)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                                            {formatRupiah(totalMasuk)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 dark:text-rose-400">
                                            {formatRupiah(totalKeluar)}
                                        </td>
                                        <td className={cn(
                                            'py-3 px-4 text-right font-mono tabular-nums',
                                            netArusKas < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'
                                        )}>
                                            {formatRupiah(netArusKas)}
                                        </td>
                                        <td className={cn(
                                            'py-3 px-4 text-right font-mono tabular-nums',
                                            totalSaldoAkhir < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
                                        )}>
                                            {formatRupiah(totalSaldoAkhir)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

