import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { BankAccount, GiroReportResponse, GiroTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    FileSpreadsheet,
    RefreshCw,
    Search,
    RotateCcw,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Laporan Giro', href: '/kas/reports/giro' },
];

export default function GiroReport() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [bankAccountId, setBankAccountId] = useState('all');
    const [statusGiro, setStatusGiro] = useState('all');
    const [loading, setLoading] = useState(false);

    const [report, setReport] = useState<GiroReportResponse | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (bankAccountId !== 'all') params.bank_account_id = bankAccountId;
            if (statusGiro !== 'all') params.status_giro = statusGiro;

            const [repRes, bankRes] = await Promise.all([
                api.get('/kas/reports/giro', { params }),
                api.get('/kas/bank-accounts'),
            ]);

            setReport(repRes.data?.data || null);
            setBankAccounts(bankRes.data?.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat laporan giro');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [bankAccountId, statusGiro]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReport();
    };

    const handleReset = () => {
        setStartDate(firstDay);
        setEndDate(lastDay);
        setBankAccountId('all');
        setStatusGiro('all');
    };

    const summary = report?.summary;
    const transactions: GiroTransaction[] = report?.data || [];

    const bankOptions = [
        { value: 'all', label: 'Semua Rekening Bank' },
        ...bankAccounts.map((b) => ({
            value: String(b.id),
            label: `${b.nama_bank} - ${b.nomor_rekening}`,
            description: `A/N: ${b.nama_rekening}`,
        })),
    ];

    const hasActiveFilters =
        startDate !== firstDay ||
        endDate !== lastDay ||
        bankAccountId !== 'all' ||
        statusGiro !== 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* Satu Kontainer Card Utuh (Single Unified Card Container) */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <FileSpreadsheet className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Laporan Mutasi & Jatuh Tempo Giro
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                                    <span>Periode: {startDate} s/d {endDate}</span>
                                    <span>•</span>
                                    <span>{transactions.length} Total Warkat</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                    title="Reset filter ke default"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fetchReport()}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <form onSubmit={handleFilterSubmit} className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Dari Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Sampai Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Rekening Bank
                                </label>
                                <SearchableSelect
                                    options={bankOptions}
                                    value={bankAccountId}
                                    onChange={(val) => setBankAccountId(val)}
                                    placeholder="Semua Rekening Bank"
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Status Warkat Giro
                                </label>
                                <NativeSearchableSelect
                                    value={statusGiro}
                                    onChange={(e) => setStatusGiro(e.target.value)}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Status Warkat</option>
                                    <option value="diterima">Diterima</option>
                                    <option value="diserahkan_ke_bank">Diserahkan ke Bank</option>
                                    <option value="cair">Cair</option>
                                    <option value="tolak">Ditolak</option>
                                </NativeSearchableSelect>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    className="w-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold shadow-none"
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* 3. Summary KPI Line (Flat strip matching financial reporting) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-200 dark:divide-neutral-800 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs font-mono">
                        <div className="p-3">
                            <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Total Giro Masuk</div>
                            <div className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {formatRupiah(summary?.masuk?.total || 0)}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                                {summary?.masuk?.count || 0} warkat diterima
                            </div>
                        </div>

                        <div className="p-3">
                            <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Total Giro Keluar</div>
                            <div className="font-bold text-sm text-rose-600 dark:text-rose-400 mt-0.5">
                                {formatRupiah(summary?.keluar?.total || 0)}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                                {summary?.keluar?.count || 0} warkat diterbitkan
                            </div>
                        </div>

                        <div className="p-3">
                            <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Giro Telah Cair</div>
                            <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-0.5">
                                {formatRupiah(summary?.cair?.total || 0)}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                                {summary?.cair?.count || 0} warkat kliring
                            </div>
                        </div>

                        <div className="p-3">
                            <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Giro Outstanding</div>
                            <div className="font-bold text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                                {formatRupiah(summary?.outstanding?.total || 0)}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                                {summary?.outstanding?.count || 0} warkat berjalan
                            </div>
                        </div>
                    </div>

                    {/* 4. Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-3 px-4 text-left w-12">No</th>
                                    <th className="py-3 px-4 text-left w-40">No. Giro</th>
                                    <th className="py-3 px-4 text-left w-28">Tgl Terbit</th>
                                    <th className="py-3 px-4 text-left w-28">Jatuh Tempo</th>
                                    <th className="py-3 px-4 text-left">Bank Tujuan</th>
                                    <th className="py-3 px-4 text-center w-28">Jenis</th>
                                    <th className="py-3 px-4 text-left">Penerbit / Penerima</th>
                                    <th className="py-3 px-4 text-right w-36">Nominal (Rp)</th>
                                    <th className="py-3 px-4 text-center w-28">Status Giro</th>
                                    <th className="py-3 px-4 text-center w-24">Jurnal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {loading && transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-14 text-center text-neutral-500 text-sm">
                                            <RefreshCw className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                                            Memuat rekapitulasi warkat giro...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-14 text-center text-neutral-500 text-sm">
                                            Tidak ada data warkat giro pada periode yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx, idx) => (
                                        <tr key={tx.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 select-none">
                                            <td className="py-3 px-4 font-mono text-neutral-500 text-xs">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {tx.nomor_giro}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                                {tx.tanggal_giro || tx.tanggal_terima
                                                    ? new Date(tx.tanggal_giro || tx.tanggal_terima || '').toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100 font-mono font-semibold text-xs">
                                                {tx.tanggal_jatuh_tempo
                                                    ? new Date(tx.tanggal_jatuh_tempo).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                                                    {tx.bank_account?.nama_bank || '-'}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 font-mono">
                                                    {tx.bank_account?.nomor_rekening || '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-block px-2 py-0.5 rounded-none text-[11px] font-semibold uppercase tracking-wider border',
                                                        tx.jenis_giro === 'masuk'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                    )}
                                                >
                                                    {tx.jenis_giro === 'masuk' ? 'Giro Masuk' : 'Giro Keluar'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 text-xs max-w-xs truncate">
                                                {tx.jenis_giro === 'masuk' ? tx.penerbit || tx.nama_penerbit || '-' : tx.penerima || '-'}
                                            </td>
                                            <td
                                                className={cn(
                                                    'py-3 px-4 text-right font-mono font-bold text-sm tabular-nums',
                                                    tx.jenis_giro === 'keluar'
                                                        ? 'text-rose-600 dark:text-rose-400'
                                                        : 'text-emerald-700 dark:text-emerald-400'
                                                )}
                                            >
                                                {formatRupiah(Number(tx.jumlah) || 0)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-block px-2 py-0.5 rounded-none text-[11px] font-semibold uppercase tracking-wider border',
                                                        tx.status_giro === 'cair'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : tx.status_giro === 'diserahkan_ke_bank'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                                : tx.status_giro === 'tolak'
                                                                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                    )}
                                                >
                                                    {tx.status_giro.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-block px-2 py-0.5 rounded-none text-[11px] font-semibold uppercase tracking-wider border',
                                                        tx.status === 'posted'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                                                    )}
                                                >
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Footer Section */}
                    <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                        <div>
                            Menampilkan <strong>{transactions.length}</strong> warkat bilyet giro
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
