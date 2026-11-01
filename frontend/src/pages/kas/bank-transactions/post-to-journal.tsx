import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { BankTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    FileCheck2,
    Plus,
    Trash2,
    Send,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Can } from '@/components/can';

interface JournalRow {
    id: string;
    daftar_akun_id: number | '';
    debit: number;
    kredit: number;
    catatan: string;
}

const breadcrumbs = [

    { title: 'Kas & Bank', href: '/kas/bank-transactions' },
    { title: 'Transaksi Bank', href: '/kas/bank-transactions' },
    { title: 'Posting Jurnal' },
];

export default function BankTransactionPostToJournal() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [transaksi, setTransaksi] = useState<BankTransaction | null>(null);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [tanggalPosting, setTanggalPosting] = useState('');
    const [keteranganJurnal, setKeteranganJurnal] = useState('');
    const [rows, setRows] = useState<JournalRow[]>([]);

    useEffect(() => {
        const load = async () => {
            setFetching(true);
            try {
                const [txRes, accRes] = await Promise.all([
                    api.get(`/kas/bank-transactions/${id}`),
                    api.get('/daftar-akun'),
                ]);

                const tx: BankTransaction = txRes.data.data;
                const accList: ChartOfAccount[] = accRes.data.data || [];
                setTransaksi(tx);
                setAccounts(accList);

                setTanggalPosting(
                    tx.tanggal_transaksi ? tx.tanggal_transaksi.split('T')[0] : new Date().toISOString().split('T')[0]
                );
                setKeteranganJurnal(tx.keterangan || `Transaksi Bank ${tx.nomor_transaksi}`);

                const bankCoaId = tx.bank_account?.daftar_akun_id || '';
                const lawanCoaId = tx.daftar_akun_lawan_id || '';
                const nominal = Number(tx.jumlah) || 0;

                if (tx.jurnal && tx.jurnal.details && tx.jurnal.details.length > 0) {
                    setRows(
                        tx.jurnal.details.map((d: any, idx: number) => ({
                            id: `row-${idx}`,
                            daftar_akun_id: d.daftar_akun_id,
                            debit: Number(d.jumlah_debit) || 0,
                            kredit: Number(d.jumlah_kredit) || 0,
                            catatan: d.keterangan || '',
                        }))
                    );
                } else if (tx.jenis_transaksi === 'setoran') {
                    // Setoran: Bank bertambah (Debit), Akun Lawan (Kredit)
                    setRows([
                        {
                            id: 'row-1',
                            daftar_akun_id: bankCoaId,
                            debit: nominal,
                            kredit: 0,
                            catatan: tx.keterangan || `Setoran Rekening ${tx.bank_account?.nama_bank}`,
                        },
                        {
                            id: 'row-2',
                            daftar_akun_id: lawanCoaId,
                            debit: 0,
                            kredit: nominal,
                            catatan: tx.keterangan || `Akun Lawan Setoran Bank`,
                        },
                    ]);
                } else {
                    // Penarikan / Transfer: Akun Lawan (Debit), Bank berkurang (Kredit)
                    setRows([
                        {
                            id: 'row-1',
                            daftar_akun_id: lawanCoaId,
                            debit: nominal,
                            kredit: 0,
                            catatan: tx.keterangan || `Akun Lawan Penarikan Bank`,
                        },
                        {
                            id: 'row-2',
                            daftar_akun_id: bankCoaId,
                            debit: 0,
                            kredit: nominal,
                            catatan: tx.keterangan || `Penarikan Rekening ${tx.bank_account?.nama_bank}`,
                        },
                    ]);
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Gagal memuat data');
                navigate('/kas/bank-transactions');
            } finally {
                setFetching(false);
            }
        };
        load();
    }, [id, navigate]);

    const isPosted = transaksi?.status === 'posted';

    const handleAddRow = () => {
        if (isPosted) return;
        setRows([
            ...rows,
            {
                id: `row-${Date.now()}`,
                daftar_akun_id: '',
                debit: 0,
                kredit: 0,
                catatan: '',
            },
        ]);
    };

    const handleRemoveRow = (rowId: string) => {
        if (isPosted || rows.length <= 2) {
            toast.error('Minimal harus ada 2 baris jurnal untuk keseimbangan debit dan kredit');
            return;
        }
        setRows(rows.filter((r) => r.id !== rowId));
    };

    const handleRowChange = (rowId: string, field: keyof JournalRow, value: any) => {
        if (isPosted) return;
        setRows(
            rows.map((r) => {
                if (r.id === rowId) {
                    return { ...r, [field]: value };
                }
                return r;
            })
        );
    };

    const totalDebit = rows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
    const totalKredit = rows.reduce((sum, r) => sum + (Number(r.kredit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01 && totalDebit > 0;

    const handlePost = async () => {
        if (isPosted) return;

        if (!isBalanced) {
            toast.error('Jurnal belum seimbang! Total Debit harus sama dengan Total Kredit');
            return;
        }

        const emptyAcc = rows.some((r) => !r.daftar_akun_id);
        if (emptyAcc) {
            toast.error('Semua baris jurnal wajib memilih akun perkiraan (COA)');
            return;
        }

        setLoading(true);
        try {
            await api.post(`/kas/bank-transactions/${id}/post-to-journal`, {
                tanggal_posting: tanggalPosting,
                keterangan: keteranganJurnal,
                items: rows.map((r) => ({
                    daftar_akun_id: Number(r.daftar_akun_id),
                    debit: Number(r.debit) || 0,
                    kredit: Number(r.kredit) || 0,
                    catatan: r.catatan,
                })),
            });

            toast.success('Transaksi bank berhasil diposting ke Jurnal Umum & Buku Besar');
            navigate('/kas/bank-transactions');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memposting transaksi');
        } finally {
            setLoading(false);
        }
    };

    if (fetching || !transaksi) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat data posting jurnal...
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
                                onClick={() => navigate('/kas/bank-transactions')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <FileCheck2 className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Posting Jurnal Bank: {transaksi.nomor_transaksi}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Penyesuaian ayat jurnal debit-kredit mutasi rekening bank ke Buku Besar
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Balance Status Badge */}
                        <div className="flex items-center gap-2">
                            {isPosted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-mono">
                                    <ShieldCheck className="size-3.5" /> Telah Diposting
                                </span>
                            ) : isBalanced ? (
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

                    {/* 2. Form Parameter Strip (Informasi Header) */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Tanggal Jurnal / Posting <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    value={tanggalPosting}
                                    onChange={(e) => setTanggalPosting(e.target.value)}
                                    disabled={isPosted}
                                    required
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 uppercase block font-semibold">Rekening Bank</span>
                                <span className="font-bold text-neutral-900 dark:text-white block mt-2">
                                    {transaksi.bank_account?.nama_bank} - {transaksi.bank_account?.nomor_rekening}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 uppercase block font-semibold">Jenis Mutasi</span>
                                <span className="font-bold text-neutral-900 dark:text-white block mt-2 uppercase">
                                    {transaksi.jenis_transaksi}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 uppercase block font-semibold">Nominal Mutasi</span>
                                <span className="font-bold text-neutral-900 dark:text-white block mt-2">
                                    {formatRupiah(transaksi.jumlah)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                Deskripsi Ayat Jurnal Umum
                            </label>
                            <Input
                                value={keteranganJurnal}
                                onChange={(e) => setKeteranganJurnal(e.target.value)}
                                disabled={isPosted}
                                placeholder="Uraian jurnal..."
                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60 font-sans"
                            />
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
                        {!isPosted && (
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
                        )}
                    </div>

                    {/* 4. Table Rows */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-mono">
                                    <th className="py-2.5 px-3 text-center w-10">No</th>
                                    <th className="py-2.5 px-3 text-left w-72 sm:w-80">Rekening Akun (COA) *</th>
                                    <th className="py-2.5 px-3 text-left">Deskripsi / Catatan</th>
                                    <th className="py-2.5 px-3 text-right w-40">Debit (Rp)</th>
                                    <th className="py-2.5 px-3 text-right w-40">Kredit (Rp)</th>
                                    {!isPosted && <th className="py-2.5 px-3 text-center w-12">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {rows.map((row, idx) => (
                                    <tr key={row.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                        <td className="py-2 px-3 font-mono text-neutral-500 text-center">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2 px-3">
                                            <SearchableAccountSelect
                                                accounts={accounts}
                                                value={row.daftar_akun_id}
                                                onValueChange={(val) =>
                                                    handleRowChange(row.id, 'daftar_akun_id', val ? Number(val) : '')
                                                }
                                                disabled={isPosted}
                                                placeholder="Pilih akun COA..."
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                value={row.catatan}
                                                onChange={(e) => handleRowChange(row.id, 'catatan', e.target.value)}
                                                disabled={isPosted}
                                                placeholder="Catatan baris..."
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={row.debit || ''}
                                                onChange={(e) =>
                                                    handleRowChange(row.id, 'debit', parseFloat(e.target.value) || 0)
                                                }
                                                disabled={isPosted}
                                                placeholder="0"
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono text-right disabled:opacity-60"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={row.kredit || ''}
                                                onChange={(e) =>
                                                    handleRowChange(row.id, 'kredit', parseFloat(e.target.value) || 0)
                                                }
                                                disabled={isPosted}
                                                placeholder="0"
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono text-right disabled:opacity-60"
                                            />
                                        </td>
                                        {!isPosted && (
                                            <td className="py-2 px-3 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveRow(row.id)}
                                                    className="h-7 w-7 p-0 rounded-none text-rose-500 hover:text-rose-700"
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </td>
                                        )}
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
                                    {!isPosted && <td></td>}
                                </tr>
                                {!isBalanced && (
                                    <tr className="bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono text-xs">
                                        <td colSpan={3} className="py-1.5 px-4 text-right font-bold uppercase">
                                            Selisih Debit - Kredit:
                                        </td>
                                        <td colSpan={!isPosted ? 3 : 2} className="py-1.5 px-3 font-bold tabular-nums">
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
                            onClick={() => navigate('/kas/bank-transactions')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                        >
                            Kembali
                        </Button>
                        {!isPosted && (
                            <Can permission={['kas.bank-transaction.post', 'kas.cash-management.daily-entry']}>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handlePost}
                                    disabled={loading || !isBalanced}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none disabled:opacity-50"
                                >
                                    <Send className="size-3.5" />
                                    <span>Posting ke Jurnal</span>
                                </Button>
                            </Can>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
