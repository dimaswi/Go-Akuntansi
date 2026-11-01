import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { CashTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Receipt,
    Plus,
    Trash2,
    Send,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Can } from '@/components/can';

interface JournalRow {
    daftar_akun_id: number;
    keterangan: string;
    jumlah_debit: number;
    jumlah_kredit: number;
}

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Transaksi Kas', href: '/kas/cash-transactions' },
    { title: 'Posting ke Jurnal' },
];

export default function CashTransactionPostToJournal() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [tx, setTx] = useState<CashTransaction | null>(null);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [tanggalPosting, setTanggalPosting] = useState('');
    const [rows, setRows] = useState<JournalRow[]>([]);

    useEffect(() => {
        Promise.all([
            api.get(`/kas/cash-transactions/${id}`),
            api.get('/daftar-akun'),
        ])
            .then(([txRes, accRes]) => {
                const txData: CashTransaction = txRes.data.data;
                const accData: ChartOfAccount[] = accRes.data.data || [];
                setTx(txData);
                setAccounts(accData);

                setTanggalPosting(
                    txData.tanggal_transaksi ? txData.tanggal_transaksi.split('T')[0] : new Date().toISOString().split('T')[0]
                );

                const nominal = Number(txData.jumlah) || 0;
                const ket = txData.keterangan || `Transaksi Kas ${txData.nomor_transaksi}`;

                const initialRows: JournalRow[] = [];
                if (txData.jenis_transaksi === 'penerimaan') {
                    // Kas Masuk: Kas (Debit), Akun Lawan / Pendapatan (Kredit)
                    initialRows.push({
                        daftar_akun_id: txData.daftar_akun_kas_id || 0,
                        keterangan: ket,
                        jumlah_debit: nominal,
                        jumlah_kredit: 0,
                    });
                    initialRows.push({
                        daftar_akun_id: txData.daftar_akun_lawan_id || 0,
                        keterangan: ket,
                        jumlah_debit: 0,
                        jumlah_kredit: nominal,
                    });
                } else {
                    // Kas Keluar: Beban / Akun Lawan (Debit), Kas (Kredit)
                    initialRows.push({
                        daftar_akun_id: txData.daftar_akun_lawan_id || 0,
                        keterangan: ket,
                        jumlah_debit: nominal,
                        jumlah_kredit: 0,
                    });
                    initialRows.push({
                        daftar_akun_id: txData.daftar_akun_kas_id || 0,
                        keterangan: ket,
                        jumlah_debit: 0,
                        jumlah_kredit: nominal,
                    });
                }
                setRows(initialRows);
            })
            .catch(() => {
                toast.error('Gagal memuat data transaksi kas');
                navigate('/kas/cash-transactions');
            })
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const totalDebit = rows.reduce((sum, r) => sum + (Number(r.jumlah_debit) || 0), 0);
    const totalKredit = rows.reduce((sum, r) => sum + (Number(r.jumlah_kredit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01 && totalDebit > 0;

    const handleAddRow = () => {
        setRows([
            ...rows,
            {
                daftar_akun_id: 0,
                keterangan: tx?.keterangan || '',
                jumlah_debit: 0,
                jumlah_kredit: 0,
            },
        ]);
    };

    const handleRemoveRow = (idx: number) => {
        if (rows.length <= 2) {
            toast.error('Jurnal minimal memiliki 2 baris akun');
            return;
        }
        setRows(rows.filter((_, i) => i !== idx));
    };

    const handleRowChange = (idx: number, field: keyof JournalRow, val: any) => {
        const next = [...rows];
        next[idx] = { ...next[idx], [field]: val };
        setRows(next);
    };

    const handlePost = async () => {
        if (!isBalanced) {
            toast.error('Jurnal belum seimbang (balance). Total debit harus sama dengan total kredit.');
            return;
        }

        const hasInvalidAccount = rows.some((r) => !r.daftar_akun_id || r.daftar_akun_id === 0);
        if (hasInvalidAccount) {
            toast.error('Seluruh baris akun rekening wajib dipilih');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/kas/cash-transactions/${id}/post-to-journal`, {
                tanggal_posting: tanggalPosting,
                keterangan: tx?.keterangan || `Posting Kas ${tx?.nomor_transaksi}`,
                items: rows.map((r) => ({
                    daftar_akun_id: r.daftar_akun_id,
                    keterangan: r.keterangan || tx?.keterangan || '',
                    jumlah_debit: Number(r.jumlah_debit) || 0,
                    jumlah_kredit: Number(r.jumlah_kredit) || 0,
                })),
            });
            toast.success('Transaksi kas berhasil diposting ke Jurnal Akuntansi');
            navigate('/kas/cash-transactions');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal memposting ke jurnal');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !tx) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat rincian transaksi kas...
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* Satu Kontainer Card Utuh */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar: Icon-Only Back Button + Title on Left */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/cash-transactions')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Receipt className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Posting Kas ke Jurnal: {tx.nomor_transaksi}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Review alokasi akun debit & kredit sebelum dibukukan ke jurnal umum
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Balance Status Badge */}
                        <div className="flex items-center gap-2">
                            {isBalanced ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-mono">
                                    <CheckCircle2 className="size-3.5" /> Seimbang (Balance)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-mono">
                                    <AlertCircle className="size-3.5" /> Belum Seimbang
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 2. Form Parameter Strip (Info Transaksi) */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                            <div>
                                <span className="text-[11px] text-neutral-500 uppercase block font-semibold">Tanggal Posting Jurnal</span>
                                <Input
                                    type="date"
                                    value={tanggalPosting}
                                    onChange={(e) => setTanggalPosting(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono mt-1"
                                />
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 uppercase block font-semibold">Jenis Kas</span>
                                <span className="font-bold text-neutral-900 dark:text-white block mt-2 uppercase">
                                    {tx.jenis_transaksi === 'penerimaan' ? 'Kas Masuk (BKM)' : 'Kas Keluar (BKK)'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 uppercase block font-semibold">Nominal Kas</span>
                                <span className="font-bold text-neutral-900 dark:text-white block mt-2">
                                    {formatRupiah(tx.jumlah)}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 uppercase block font-semibold">Pihak / Referensi</span>
                                <span className="font-medium text-neutral-900 dark:text-white block mt-2 truncate">
                                    {tx.pihak_terkait || tx.referensi || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Subheader: Action Tambah Baris (Placed Above Table) */}
                    <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                Alokasi Akun Debit & Kredit Jurnal
                            </span>
                            <p className="text-[11px] text-neutral-500 font-mono">
                                {rows.length} Baris Jurnal
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRow}
                            className="h-7 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 px-3 gap-1.5 shadow-none"
                        >
                            <Plus className="size-3.5" />
                            <span>Tambah Baris Akun</span>
                        </Button>
                    </div>

                    {/* 4. Table Rows */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-mono">
                                    <th className="py-2.5 px-3 text-center w-10">No</th>
                                    <th className="py-2.5 px-3 text-left w-72 sm:w-80">Rekening Akun *</th>
                                    <th className="py-2.5 px-3 text-left">Keterangan Baris</th>
                                    <th className="py-2.5 px-3 text-right w-40">Debet (Rp)</th>
                                    <th className="py-2.5 px-3 text-right w-40">Kredit (Rp)</th>
                                    <th className="py-2.5 px-3 text-center w-12">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                        <td className="py-2 px-3 font-mono text-neutral-500 text-center">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2 px-3">
                                            <SearchableAccountSelect
                                                accounts={accounts}
                                                value={row.daftar_akun_id}
                                                onValueChange={(val) => handleRowChange(idx, 'daftar_akun_id', val ? Number(val) : 0)}
                                                placeholder="Pilih rekening akun..."
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="text"
                                                value={row.keterangan}
                                                onChange={(e) => handleRowChange(idx, 'keterangan', e.target.value)}
                                                placeholder="Keterangan baris jurnal..."
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={row.jumlah_debit || ''}
                                                onChange={(e) => handleRowChange(idx, 'jumlah_debit', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono text-right"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={row.jumlah_kredit || ''}
                                                onChange={(e) => handleRowChange(idx, 'jumlah_kredit', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono text-right"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveRow(idx)}
                                                className="h-7 w-7 p-0 rounded-none text-rose-500 hover:text-rose-700"
                                                title="Hapus baris"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 font-mono text-xs font-bold">
                                    <td colSpan={3} className="py-2 px-4 text-right uppercase text-neutral-600">
                                        Total:
                                    </td>
                                    <td className="py-2 px-3 text-right tabular-nums text-neutral-900 dark:text-white">
                                        {formatRupiah(totalDebit)}
                                    </td>
                                    <td className="py-2 px-3 text-right tabular-nums text-neutral-900 dark:text-white">
                                        {formatRupiah(totalKredit)}
                                    </td>
                                    <td></td>
                                </tr>
                                {!isBalanced && (
                                    <tr className="bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono text-xs">
                                        <td colSpan={3} className="py-1.5 px-4 text-right font-bold uppercase">
                                            Selisih Debit - Kredit:
                                        </td>
                                        <td colSpan={3} className="py-1.5 px-3 font-bold tabular-nums">
                                            {formatRupiah(Math.abs(totalDebit - totalKredit))} (Jurnal belum seimbang)
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>

                    {/* 5. Bottom Action Bar */}
                    <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/kas/cash-transactions')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission={['kas.cash-transaction.post', 'kas.cash-management.daily-entry']}>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handlePost}
                                disabled={submitting || !isBalanced}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none disabled:opacity-50"
                            >
                                <Send className="size-3.5" />
                                <span>Posting ke Jurnal</span>
                            </Button>
                        </Can>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
