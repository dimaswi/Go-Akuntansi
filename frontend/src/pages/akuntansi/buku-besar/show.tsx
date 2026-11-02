import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { BukuBesarResponse } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Library, Filter, RefreshCw, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';

const badgeJenisAkun: Record<string, string> = {
    aset: 'border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    kewajiban: 'border-amber-200 bg-amber-50/50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    ekuitas: 'border-purple-200 bg-purple-50/50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    modal: 'border-purple-200 bg-purple-50/50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    pendapatan: 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    beban: 'border-rose-200 bg-rose-50/50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
};

export default function BukuBesarShow() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const now = new Date();
    const defaultStart = searchParams.get('start_date') || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = searchParams.get('end_date') || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [periodeDari, setPeriodeDari] = useState(defaultStart);
    const [periodeSampai, setPeriodeSampai] = useState(defaultEnd);

    const [ledger, setLedger] = useState<BukuBesarResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLedger = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.get(`/laporan/buku-besar/${id}`, {
                params: {
                    start_date: periodeDari,
                    end_date: periodeSampai,
                },
            });
            setLedger(res.data.data);
            setSearchParams({ start_date: periodeDari, end_date: periodeSampai });
        } catch {
            toast.error('Gagal memuat kartu buku besar');
            navigate('/akuntansi/buku-besar');
        } finally {
            setLoading(false);
        }
    }, [id, periodeDari, periodeSampai, navigate, setSearchParams]);

    useEffect(() => {
        fetchLedger();
    }, [id]);

    const breadcrumbs = [

        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Buku Besar', href: '/akuntansi/buku-besar' },
        { title: ledger ? `${ledger.akun.kode_akun} - ${ledger.akun.nama_akun}` : 'Kartu Buku Besar' },
    ];

    if (loading && !ledger) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="py-20 text-center text-sm text-neutral-500">
                    Memuat rincian buku besar...
                </div>
            </AppLayout>
        );
    }

    if (!ledger) return null;

    const badgeClass =
        badgeJenisAkun[ledger.akun.jenis_akun.toLowerCase()] ||
        'border-neutral-200 bg-neutral-100 text-neutral-700';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* ─── Unified Card Container: KOTAK (rounded-none border border-neutral-200) ─── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none">

                    {/* ─── Card Header: Kembali + Title (Left) & Actions (Right) ──────── */}
                    <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/akuntansi/buku-besar')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-none"
                                title="Kembali ke Buku Besar"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <Library className="h-5 w-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
                                <div>
                                    <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                        <span className="font-mono">{ledger.akun.kode_akun}</span> - {ledger.akun.nama_akun}
                                    </h1>
                                    <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'inline-block px-1.5 py-0.2 rounded-none text-[11px] font-semibold uppercase tracking-wider border',
                                                badgeClass
                                            )}
                                        >
                                            {ledger.akun.jenis_akun}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Saldo Normal: <strong className="text-neutral-700 dark:text-neutral-300 uppercase">{ledger.akun.saldo_normal}</strong>
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                        </div>
                    </div>

                    {/* ─── Periode Filter Section ───────────────────────────────────── */}
                    <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                        Dari:
                                    </label>
                                    <Input
                                        type="date"
                                        value={periodeDari}
                                        onChange={(e) => setPeriodeDari(e.target.value)}
                                        className="h-8 w-36 rounded-none border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs shadow-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                        Sampai:
                                    </label>
                                    <Input
                                        type="date"
                                        value={periodeSampai}
                                        onChange={(e) => setPeriodeSampai(e.target.value)}
                                        className="h-8 w-36 rounded-none border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs shadow-none"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={fetchLedger}
                                    disabled={loading}
                                    className="h-8 rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-3 gap-1 shadow-none"
                                >
                                    <Filter className="size-3" />
                                    Filter Periode
                                </Button>
                            </div>

                            <div className="text-xs text-neutral-500 font-mono">
                                Total {ledger.transactions?.length || 0} baris transaksi mutasi
                            </div>
                        </div>
                    </div>

                    {/* ─── 4 Metrics Cards ─────────────────────────────────────────── */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Saldo Awal */}
                            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-none border border-neutral-200 dark:border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                        Saldo Awal
                                    </span>
                                    <Calculator className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-base sm:text-lg font-bold mt-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                                    {formatRupiah(ledger.saldo_awal)}
                                </div>
                            </div>

                            {/* Mutasi Debet */}
                            <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-none border border-emerald-200/60 dark:border-emerald-800/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                        Total Mutasi Debet
                                    </span>
                                    <TrendingUp className="size-4 text-emerald-600" />
                                </div>
                                <div className="text-base sm:text-lg font-bold mt-1 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                    {formatRupiah(ledger.total_debit)}
                                </div>
                            </div>

                            {/* Mutasi Kredit */}
                            <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-none border border-amber-200/60 dark:border-amber-800/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                        Total Mutasi Kredit
                                    </span>
                                    <TrendingDown className="size-4 text-amber-600" />
                                </div>
                                <div className="text-base sm:text-lg font-bold mt-1 text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                    {formatRupiah(ledger.total_kredit)}
                                </div>
                            </div>

                            {/* Saldo Akhir */}
                            <div className="p-3.5 bg-neutral-900 text-white rounded-none border border-neutral-900 dark:bg-neutral-800 dark:border-neutral-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                                        Saldo Akhir
                                    </span>
                                    <Library className="size-4 text-neutral-400" />
                                </div>
                                <div className="text-base sm:text-lg font-bold mt-1 text-white font-mono tabular-nums">
                                    {formatRupiah(ledger.saldo_akhir)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Mutasi Transaksi Table ───────────────────────────────────── */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    <th className="py-2.5 px-3 w-32">Tanggal</th>
                                    <th className="py-2.5 px-3 w-40">No. Jurnal</th>
                                    <th className="py-2.5 px-3 min-w-[240px]">Keterangan Transaksi</th>
                                    <th className="py-2.5 px-3 text-right w-36">Debit (Rp)</th>
                                    <th className="py-2.5 px-3 text-right w-36">Kredit (Rp)</th>
                                    <th className="py-2.5 px-3 text-right w-44">Saldo Berjalan (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950 text-sm">
                                {/* Baris Saldo Awal */}
                                <tr className="bg-neutral-50/70 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 italic">
                                    <td className="py-2.5 px-3">-</td>
                                    <td className="py-2.5 px-3 font-mono">-</td>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-700 dark:text-neutral-300">
                                        Saldo Awal Periode
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono">-</td>
                                    <td className="py-2.5 px-3 text-right font-mono">-</td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums not-italic">
                                        {formatRupiah(ledger.saldo_awal)}
                                    </td>
                                </tr>

                                {ledger.transactions?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                                            Tidak ada transaksi mutasi dalam rentang tanggal yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    ledger.transactions?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                                            <td className="py-3 px-3 text-xs text-neutral-600 dark:text-neutral-400 align-middle">
                                                {item.tanggal_transaksi
                                                    ? new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-3 text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200 align-middle">
                                                {item.nomor_jurnal}
                                            </td>
                                            <td className="py-3 px-3 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 align-middle">
                                                {item.keterangan || '-'}
                                            </td>
                                            <td className="py-3 px-3 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right tabular-nums font-mono align-middle">
                                                {Number(item.debit) > 0 ? formatRupiah(item.debit) : '-'}
                                            </td>
                                            <td className="py-3 px-3 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right tabular-nums font-mono align-middle">
                                                {Number(item.kredit) > 0 ? formatRupiah(item.kredit) : '-'}
                                            </td>
                                            <td className="py-3 px-3 text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 text-right tabular-nums font-mono align-middle">
                                                {formatRupiah(item.saldo)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ─── Footer Info ────────────────────────────────────────────── */}
                    <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-500 flex items-center justify-between">
                        <div>
                            Akun:{' '}
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                                {ledger.akun.kode_akun}
                            </span>{' '}
                            - {ledger.akun.nama_akun}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                            Modul Keuangan & ERP Akuntansi Rumah Sakit
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
