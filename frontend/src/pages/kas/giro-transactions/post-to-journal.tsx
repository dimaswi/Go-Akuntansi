import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { GiroTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    FileSpreadsheet,
    Plus,
    Trash2,
    CheckCircle2,
    FileCheck2,
    ShieldCheck,
    AlertTriangle,
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
    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Transaksi Giro', href: '/kas/giro-transactions' },
    { title: 'Posting Jurnal' },
];

export default function GiroTransactionPostToJournal() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [transaksi, setTransaksi] = useState<GiroTransaction | null>(null);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [tanggalPosting, setTanggalPosting] = useState('');
    const [keteranganJurnal, setKeteranganJurnal] = useState('');
    const [rows, setRows] = useState<JournalRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [txRes, accRes] = await Promise.all([
                    api.get(`/kas/giro-transactions/${id}`),
                    api.get('/daftar-akun'),
                ]);

                const tx: GiroTransaction = txRes.data?.data;
                const accList: ChartOfAccount[] = accRes.data?.data || [];
                setAccounts(accList);

                if (!tx) {
                    toast.error('Bilyet giro tidak ditemukan');
                    navigate('/kas/giro-transactions');
                    return;
                }

                setTransaksi(tx);
                setTanggalPosting(tx.tanggal_giro ? tx.tanggal_giro.split('T')[0] : (tx.tanggal_terima ? tx.tanggal_terima.split('T')[0] : ''));
                setKeteranganJurnal(`Posting Bilyet Giro: ${tx.nomor_giro} - ${tx.keterangan || (tx.jenis_giro === 'masuk' ? 'Giro Masuk' : 'Giro Keluar')}`);

                const nominal = Number(tx.jumlah) || 0;
                const bankCoaId = tx.bank_account?.daftar_akun_id || '';
                const giroCoaId = tx.daftar_akun_id || tx.daftar_akun_giro_id || '';

                if (tx.status === 'posted') {
                    setRows([
                        {
                            id: '1',
                            daftar_akun_id: tx.jenis_giro === 'masuk' ? (bankCoaId || '') : (giroCoaId || ''),
                            debit: nominal,
                            kredit: 0,
                            catatan: tx.keterangan || '',
                        },
                        {
                            id: '2',
                            daftar_akun_id: tx.jenis_giro === 'masuk' ? (giroCoaId || '') : (bankCoaId || ''),
                            debit: 0,
                            kredit: nominal,
                            catatan: tx.keterangan || '',
                        },
                    ]);
                } else {
                    const row1: JournalRow = {
                        id: 'row-1',
                        daftar_akun_id: tx.jenis_giro === 'masuk' ? (bankCoaId || '') : (giroCoaId || ''),
                        debit: nominal,
                        kredit: 0,
                        catatan: tx.keterangan || `Warkat Giro ${tx.nomor_giro}`,
                    };
                    const row2: JournalRow = {
                        id: 'row-2',
                        daftar_akun_id: tx.jenis_giro === 'masuk' ? (giroCoaId || '') : (bankCoaId || ''),
                        debit: 0,
                        kredit: nominal,
                        catatan: tx.keterangan || `Warkat Giro ${tx.nomor_giro}`,
                    };
                    setRows([row1, row2]);
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Gagal memuat data');
                navigate('/kas/giro-transactions');
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
        setRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                return { ...r, [field]: value };
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
            await api.post(`/kas/giro-transactions/${id}/post-to-journal`, {
                tanggal_posting: tanggalPosting,
                keterangan: keteranganJurnal,
                items: rows.map((r) => ({
                    daftar_akun_id: Number(r.daftar_akun_id),
                    debit: Number(r.debit) || 0,
                    kredit: Number(r.kredit) || 0,
                    catatan: r.catatan,
                })),
            });

            toast.success('Bilyet giro berhasil diposting ke Jurnal Umum & Buku Besar');
            navigate('/kas/giro-transactions');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memposting bilyet giro');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
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
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/giro-transactions')}
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
                                        Posting Jurnal Giro: {transaksi?.nomor_giro}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Penyesuaian ayat jurnal debit-kredit warkat giro ke Buku Besar
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isPosted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-mono">
                                <ShieldCheck className="size-3.5" /> Telah Diposting
                            </span>
                        )}
                    </div>

                    {/* Parameter Form Strip */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Uraian / Memo Jurnal
                                </label>
                                <Input
                                    value={keteranganJurnal}
                                    onChange={(e) => setKeteranganJurnal(e.target.value)}
                                    disabled={isPosted}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Section with "Tambah Baris" on top */}
                    <div className="p-4 bg-white dark:bg-neutral-950">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                Rincian Baris Jurnal Double-Entry
                            </h3>

                            {!isPosted && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddRow}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none gap-1.5"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Baris</span>
                                </Button>
                            )}
                        </div>

                        <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        <th className="py-2.5 px-3 text-left w-1/3">Akun COA (Bagan Akun)</th>
                                        <th className="py-2.5 px-3 text-left">Deskripsi / Catatan</th>
                                        <th className="py-2.5 px-3 text-right w-36">Debit (Rp)</th>
                                        <th className="py-2.5 px-3 text-right w-36">Kredit (Rp)</th>
                                        {!isPosted && <th className="py-2.5 px-3 text-center w-12">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td className="py-2 px-3">
                                                <SearchableAccountSelect
                                                    accounts={accounts}
                                                    value={row.daftar_akun_id ? String(row.daftar_akun_id) : ''}
                                                    onChange={(val) =>
                                                        handleRowChange(row.id, 'daftar_akun_id', val ? Number(val) : '')
                                                    }
                                                    disabled={isPosted}
                                                    placeholder="-- Pilih Akun COA --"
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
                                    <tr className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 font-mono text-xs font-bold">
                                        <td colSpan={2} className="py-2.5 px-3 text-right">
                                            Total:
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">
                                            {formatRupiah(totalDebit)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-400">
                                            {formatRupiah(totalKredit)}
                                        </td>
                                        {!isPosted && <td></td>}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Balance Strip */}
                        <div className={cn(
                            'mt-3 p-3 text-xs font-mono border flex items-center justify-between',
                            isBalanced
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        )}>
                            <div className="flex items-center gap-2">
                                {isBalanced ? (
                                    <>
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        <span>Status: SEIMBANG (BALANCED). Siap dibukukan ke Buku Besar.</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="size-4 text-rose-600" />
                                        <span>Status: BELUM SEIMBANG. Selisih: {formatRupiah(Math.abs(totalDebit - totalKredit))}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/kas/giro-transactions')}
                            className="h-8 text-xs font-semibold rounded-none border border-neutral-300 dark:border-neutral-700 px-3"
                        >
                            Kembali
                        </Button>
                        {!isPosted && (
                            <Can permission="kas.giro-transaction.post">
                                <Button
                                    type="button"
                                    disabled={!isBalanced || loading}
                                    onClick={handlePost}
                                    className="h-8 text-xs font-semibold rounded-none bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 px-4 gap-1.5 shadow-none"
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    <span>{loading ? 'Memposting...' : 'Konfirmasi Posting Jurnal'}</span>
                                </Button>
                            </Can>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
