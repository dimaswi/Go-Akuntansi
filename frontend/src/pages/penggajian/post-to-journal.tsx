import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { salaryApi, SalaryBatch, JournalPreviewEntry, PostJournalDetail } from '@/api/salary';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Banknote,
    ArrowLeft,
    Send,
    Plus,
    Trash2,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

interface AccountOption {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface DetailRow {
    id: string;
    daftar_akun_id: string;
    keterangan: string;
    jumlah_debit: number;
    jumlah_kredit: number;
}

export const SalaryPostToJournal: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [batch, setBatch] = useState<SalaryBatch | null>(null);
    const [accounts, setAccounts] = useState<AccountOption[]>([]);
    const [details, setDetails] = useState<DetailRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                let accPromise: Promise<any>;
                try {
                    accPromise = api.get('/daftar-akun');
                } catch {
                    accPromise = api.get('/accounts');
                }

                const [batchRes, accRes, previewRes] = await Promise.all([
                    salaryApi.getBatch(id),
                    accPromise,
                    salaryApi.getJournalPreview([id]),
                ]);

                const bData = batchRes.data?.data;
                const aData: AccountOption[] = accRes.data?.data || accRes.data || [];
                const pData: JournalPreviewEntry[] = previewRes.data?.data || [];

                setBatch(bData);
                setAccounts(aData);

                // Build initial detail journal rows from preview
                const initialRows: DetailRow[] = [];

                // 1. Debits (Expenses)
                pData
                    .filter((e) => e.type === 'debit' && e.amount > 0)
                    .forEach((entry, idx) => {
                        // Attempt to fuzzy match account name
                        const matchedAcc = aData.find(
                            (a) =>
                                a.nama_akun.toLowerCase() === entry.account_name.toLowerCase() ||
                                a.nama_akun.toLowerCase().includes(entry.account_name.toLowerCase().replace('beban ', ''))
                        );

                        initialRows.push({
                            id: `debit-${idx}`,
                            daftar_akun_id: matchedAcc ? String(matchedAcc.id) : '',
                            keterangan: entry.account_name,
                            jumlah_debit: entry.amount,
                            jumlah_kredit: 0,
                        });
                    });

                // 2. Credit for Gaji Bersih (mapped to batch payment_account)
                if (bData) {
                    initialRows.push({
                        id: `credit-salary-net`,
                        daftar_akun_id: String(bData.payment_account_id || bData.payment_account?.id || ''),
                        keterangan: `Pembayaran Gaji Karyawan - ${bData.batch_number}`,
                        jumlah_debit: 0,
                        jumlah_kredit: Number(bData.total_gaji_bersih || 0),
                    });
                }

                // 3. Other Credits from preview (deductions / liabilities)
                pData
                    .filter((e) => e.type === 'credit' && e.amount > 0 && e.account_name !== 'Hutang Gaji Karyawan')
                    .forEach((entry, idx) => {
                        const matchedAcc = aData.find((a) =>
                            a.nama_akun.toLowerCase().includes(entry.account_name.toLowerCase().replace('hutang ', ''))
                        );

                        initialRows.push({
                            id: `credit-${idx}`,
                            daftar_akun_id: matchedAcc ? String(matchedAcc.id) : '',
                            keterangan: entry.account_name,
                            jumlah_debit: 0,
                            jumlah_kredit: entry.amount,
                        });
                    });

                setDetails(initialRows);
            } catch (err: any) {
                toast.error('Gagal memuat pratinjau jurnal penggajian');
                navigate('/penggajian');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id]);

    const handleAddRow = () => {
        setDetails((prev) => [
            ...prev,
            {
                id: `custom-${Date.now()}`,
                daftar_akun_id: '',
                keterangan: 'Penyesuaian Gaji',
                jumlah_debit: 0,
                jumlah_kredit: 0,
            },
        ]);
    };

    const handleRemoveRow = (idx: number) => {
        if (details.length <= 2) {
            toast.error('Minimal harus ada 2 baris jurnal (Debit & Kredit)');
            return;
        }
        setDetails((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleRowChange = (idx: number, field: keyof DetailRow, val: any) => {
        setDetails((prev) => {
            const next = [...prev];
            next[idx] = {
                ...next[idx],
                [field]: val,
            };
            return next;
        });
    };

    const formatCurrency = (val: number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    // Calculate totals & balance
    const totals = useMemo(() => {
        const debit = details.reduce((sum, d) => sum + Number(d.jumlah_debit || 0), 0);
        const kredit = details.reduce((sum, d) => sum + Number(d.jumlah_kredit || 0), 0);
        const isBalanced = Math.abs(debit - kredit) < 0.01 && debit > 0;
        return { debit, kredit, isBalanced, diff: Math.abs(debit - kredit) };
    }, [details]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !batch) return;

        if (!totals.isBalanced) {
            toast.error('Total debit dan kredit harus seimbang (balance) sebelum posting.');
            return;
        }

        // Validate that all accounts are chosen
        const unselected = details.some((d) => !d.daftar_akun_id || d.daftar_akun_id === '');
        if (unselected) {
            toast.error('Pilih akun buku besar (COA) untuk semua baris jurnal');
            return;
        }

        const payloadDetails: PostJournalDetail[] = details.map((d) => ({
            daftar_akun_id: Number(d.daftar_akun_id),
            keterangan: d.keterangan,
            jumlah_debit: Number(d.jumlah_debit || 0),
            jumlah_kredit: Number(d.jumlah_kredit || 0),
        }));

        try {
            setSubmitting(true);
            const res = await salaryApi.postToJournal({
                batch_ids: [Number(id)],
                detail_jurnal: payloadDetails,
            });

            toast.success(res.data?.message || 'Batch gaji berhasil diposting ke jurnal akuntansi!');
            navigate('/penggajian');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal memposting ke jurnal');
        } finally {
            setSubmitting(false);
        }
    };

    const accountOptions = [
        { value: '', label: '-- Pilih Akun Buku Besar (COA) --' },
        ...accounts.map((a) => ({
            value: String(a.id),
            label: `${a.kode_akun} - ${a.nama_akun} (${a.jenis_akun?.toUpperCase() || ''})`,
        })),
    ];

    const breadcrumbs = [
        { title: 'Penggajian', href: '/penggajian' },
        { title: 'Daftar Batch Gaji', href: '/penggajian' },
        { title: batch ? `Posting: ${batch.batch_number}` : 'Post ke Jurnal' },
    ];

    if (loading && !batch) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Menyiapkan integrasi jurnal gaji...
                </div>
            </AppLayout>
        );
    }

    if (!batch) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Batch gaji tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <form
                    onSubmit={handleSubmit}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none"
                >
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/penggajian">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Send className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Posting Batch Gaji ke Jurnal Akuntansi
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Batch: {batch.batch_number} • Periode: {batch.period_display} • Total Karyawan: {batch.total_employees}
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRow}
                            className="h-8 text-xs border border-neutral-200 dark:border-neutral-800 gap-1 rounded-none shadow-none"
                        >
                            <Plus className="size-3.5" />
                            <span>Tambah Baris Jurnal</span>
                        </Button>
                    </div>

                    {/* Balance Status Banner */}
                    <div
                        className={cn(
                            'px-4 py-2.5 border-b text-xs font-mono flex flex-wrap items-center justify-between gap-3',
                            totals.isBalanced
                                ? 'bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                                : 'bg-rose-50/70 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                        )}
                    >
                        <div className="flex items-center gap-2 font-sans font-semibold">
                            {totals.isBalanced ? (
                                <>
                                    <CheckCircle2 className="size-4 text-emerald-600" />
                                    <span>Jurnal Seimbang (Balance). Siap diposting ke Buku Besar.</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="size-4 text-rose-600" />
                                    <span>
                                        Jurnal Belum Seimbang! Selisih: {formatCurrency(totals.diff)}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-6">
                            <div>
                                <span>TOTAL DEBIT: </span>
                                <span className="font-bold">{formatCurrency(totals.debit)}</span>
                            </div>
                            <div>
                                <span>TOTAL KREDIT: </span>
                                <span className="font-bold">{formatCurrency(totals.kredit)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Details */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-sans">
                                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                                    <th className="py-2.5 px-3 w-80">Akun Buku Besar (COA)</th>
                                    <th className="py-2.5 px-3">Keterangan Baris</th>
                                    <th className="py-2.5 px-3 w-40 text-right">Debit (Rp)</th>
                                    <th className="py-2.5 px-3 w-40 text-right">Kredit (Rp)</th>
                                    <th className="py-2.5 px-2 w-12 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                {details.map((row, idx) => (
                                    <tr key={row.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                        <td className="py-2 px-3 text-center text-neutral-400">
                                            {idx + 1}
                                        </td>
                                        <td className="py-1.5 px-3">
                                            <SearchableSelect
                                                value={row.daftar_akun_id}
                                                onChange={(val) => handleRowChange(idx, 'daftar_akun_id', val)}
                                                options={accountOptions}
                                                placeholder="-- Pilih Akun COA --"
                                                className="h-8 text-xs rounded-none w-full font-mono"
                                            />
                                        </td>
                                        <td className="py-1.5 px-3">
                                            <Input
                                                type="text"
                                                value={row.keterangan}
                                                onChange={(e) => handleRowChange(idx, 'keterangan', e.target.value)}
                                                className="h-8 text-xs font-sans rounded-none"
                                                required
                                            />
                                        </td>
                                        <td className="py-1.5 px-3 text-right">
                                            <Input
                                                type="number"
                                                value={row.jumlah_debit}
                                                onChange={(e) =>
                                                    handleRowChange(idx, 'jumlah_debit', parseFloat(e.target.value) || 0)
                                                }
                                                className="h-8 text-xs text-right font-mono rounded-none"
                                            />
                                        </td>
                                        <td className="py-1.5 px-3 text-right">
                                            <Input
                                                type="number"
                                                value={row.jumlah_kredit}
                                                onChange={(e) =>
                                                    handleRowChange(idx, 'jumlah_kredit', parseFloat(e.target.value) || 0)
                                                }
                                                className="h-8 text-xs text-right font-mono rounded-none"
                                            />
                                        </td>
                                        <td className="py-1.5 px-2 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveRow(idx)}
                                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-none"
                                                title="Hapus Baris"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Form Footer Bar */}
                    <div className="px-4 py-3 bg-neutral-50/70 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="text-xs text-neutral-500 font-mono">
                            Jurnal akan diterbitkan dengan nomor referensi <strong>JGA/YYYY/MM/XXXX</strong> dan langsung diposting ke Buku Besar.
                        </div>

                        <div className="flex items-center gap-2">
                            <Link to="/penggajian">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                                >
                                    Batal
                                </Button>
                            </Link>
                            <Can permission="penggajian.post-to-journal">
                                <Button
                                    type="submit"
                                    disabled={submitting || !totals.isBalanced}
                                    size="sm"
                                    className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Send className="size-3.5" />
                                    <span>{submitting ? 'Memproses Posting...' : 'Posting Sekarang ke Jurnal'}</span>
                                </Button>
                            </Can>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default SalaryPostToJournal;

