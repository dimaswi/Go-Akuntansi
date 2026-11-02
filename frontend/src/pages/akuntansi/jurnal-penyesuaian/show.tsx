import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Journal } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { formatRupiah, cn } from '@/lib/utils';
import { Can } from '@/components/can';
import {
    ArrowLeft,
    BookOpenCheck,
    CheckCircle2,
    RotateCcw,
    Undo2,
    Edit3,
    Trash2,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';

export default function JurnalPenyesuaianShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [journal, setJournal] = useState<Journal | null>(null);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [actionDialog, setActionDialog] = useState<{
        type: 'post' | 'unpost' | 'reverse' | 'delete' | null;
        open: boolean;
        loading: boolean;
    }>({ type: null, open: false, loading: false });

    const fetchJournal = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.get(`/jurnal/${id}`);
            setJournal(res.data?.data || null);
        } catch {
            toast.error('Gagal memuat rincian jurnal penyesuaian');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchJournal();
    }, [fetchJournal]);

    const handleActionConfirm = async () => {
        if (!journal || !actionDialog.type) return;

        setActionDialog((p) => ({ ...p, loading: true }));
        try {
            switch (actionDialog.type) {
                case 'post':
                    await api.post(`/jurnal/${journal.id}/post`);
                    toast.success('Jurnal penyesuaian berhasil diposting!');
                    break;
                case 'unpost':
                    await api.post(`/jurnal/${journal.id}/unpost`);
                    toast.success('Posting jurnal penyesuaian berhasil dibatalkan (kembali ke draft)!');
                    break;
                case 'reverse':
                    await api.post(`/jurnal/${journal.id}/reverse`, {
                        alasan: 'Reversal koreksi penyesuaian',
                    });
                    toast.success('Jurnal pembalik berhasil dibuat dan jurnal ini telah di-reverse!');
                    break;
                case 'delete':
                    await api.delete(`/jurnal/${journal.id}`);
                    toast.success('Jurnal penyesuaian berhasil dihapus!');
                    navigate('/akuntansi/jurnal-penyesuaian');
                    return;
            }

            setActionDialog({ type: null, open: false, loading: false });
            fetchJournal();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memproses aksi');
            setActionDialog((p) => ({ ...p, loading: false }));
        }
    };

    const breadcrumbs = [

        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Jurnal Penyesuaian', href: '/akuntansi/jurnal-penyesuaian' },
        { title: journal ? journal.nomor_jurnal : 'Detail Penyesuaian' },
    ];

    if (loading && !journal) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full p-8 text-center text-xs text-neutral-500">
                    <RefreshCw className="size-4 animate-spin inline-block mr-2" />
                    Memuat rincian jurnal penyesuaian...
                </div>
            </AppLayout>
        );
    }

    if (!journal) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full p-8 text-center text-xs text-neutral-500">
                    Data jurnal penyesuaian tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

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
                                onClick={() => navigate('/akuntansi/jurnal-penyesuaian')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <BookOpenCheck className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        {journal.nomor_jurnal}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-2">
                                        <span>Tanggal: {journal.tanggal_transaksi?.split('T')[0]}</span>
                                        <span>•</span>
                                        <span
                                            className={cn(
                                                'inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border',
                                                journal.status === 'posted'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                    : journal.status === 'reversed'
                                                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                        : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                                            )}
                                        >
                                            {journal.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="flex flex-wrap items-center gap-2">
                            {journal.status === 'draft' && (
                                <>
                                    <Can permission="akuntansi.jurnal-penyesuaian.edit">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 gap-1.5 shadow-none"
                                        >
                                            <Link to={`/akuntansi/jurnal-penyesuaian/${journal.id}/edit`}>
                                                <Edit3 className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                <span>Edit</span>
                                            </Link>
                                        </Button>
                                    </Can>

                                    <Can permission="akuntansi.jurnal-penyesuaian.delete">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setActionDialog({ type: 'delete', open: true, loading: false })}
                                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 shadow-none"
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span>Hapus</span>
                                        </Button>
                                    </Can>

                                    <Can permission="akuntansi.jurnal-penyesuaian.post">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setActionDialog({ type: 'post', open: true, loading: false })}
                                            className="h-8 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 gap-1.5 shadow-none"
                                        >
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Posting Sekarang</span>
                                        </Button>
                                    </Can>
                                </>
                            )}

                            {journal.status === 'posted' && (
                                <>
                                    <Can permission="akuntansi.jurnal-penyesuaian.post">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setActionDialog({ type: 'unpost', open: true, loading: false })}
                                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 gap-1.5 shadow-none text-neutral-700 dark:text-neutral-300"
                                            title="Kembalikan status ke draft agar dapat diedit"
                                        >
                                            <Undo2 className="size-3.5" />
                                            <span>Batalkan Posting</span>
                                        </Button>
                                    </Can>

                                    <Can permission="akuntansi.jurnal-penyesuaian.post">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setActionDialog({ type: 'reverse', open: true, loading: false })}
                                            className="h-8 rounded-none border border-rose-200 dark:border-rose-900 text-xs px-3 gap-1.5 shadow-none text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            title="Buat jurnal pembalik (reversing entry) otomatis"
                                        >
                                            <RotateCcw className="size-3.5" />
                                            <span>Reverse (Buat Pembalik)</span>
                                        </Button>
                                    </Can>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 2. Metadata Strip */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block">
                                    No. Referensi / Memo:
                                </span>
                                <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                                    {journal.nomor_referensi || '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block">
                                    Jenis Referensi:
                                </span>
                                <span className="capitalize text-neutral-800 dark:text-neutral-200 font-medium">
                                    {journal.jenis_referensi || 'manual'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block">
                                    Total Mutasi Debet/Kredit:
                                </span>
                                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                                    {formatRupiah(journal.total_debit)}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block">
                                    Kategori Jurnal:
                                </span>
                                <span className="uppercase font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                    {journal.jenis_jurnal}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 text-xs">
                            <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider block mb-0.5">
                                Keterangan Transaksi:
                            </span>
                            <p className="text-neutral-800 dark:text-neutral-200">
                                {journal.keterangan || '—'}
                            </p>
                        </div>
                    </div>

                    {/* 3. Table of Details */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-left w-10">No</th>
                                    <th className="py-2.5 px-3 text-left w-32">Kode Akun</th>
                                    <th className="py-2.5 px-3 text-left w-64">Nama Rekening</th>
                                    <th className="py-2.5 px-3 text-left">Keterangan Baris</th>
                                    <th className="py-2.5 px-3 text-right w-36">Debet (Rp)</th>
                                    <th className="py-2.5 px-3 text-right w-36">Kredit (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {journal.details?.map((detail, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                        <td className="py-2.5 px-3 font-mono text-neutral-500 text-center">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {detail.daftar_akun?.kode_akun || detail.daftar_akun_id}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-neutral-800 dark:text-neutral-200">
                                            {detail.daftar_akun?.nama_akun || '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                                            {detail.keterangan || journal.keterangan || '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                                            {Number(detail.jumlah_debit) > 0 ? formatRupiah(detail.jumlah_debit) : '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                                            {Number(detail.jumlah_kredit) > 0 ? formatRupiah(detail.jumlah_kredit) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-900 font-bold text-neutral-900 dark:text-white">
                                    <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                                        Total Mutasi:
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                                        {formatRupiah(journal.total_debit)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400">
                                        {formatRupiah(journal.total_kredit)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Action Confirmation Dialog */}
            <ConfirmDialog
                open={actionDialog.open}
                onOpenChange={(open) => !open && setActionDialog({ type: null, open: false, loading: false })}
                title={
                    actionDialog.type === 'post'
                        ? 'Posting Jurnal Penyesuaian'
                        : actionDialog.type === 'unpost'
                            ? 'Batalkan Posting Jurnal Penyesuaian'
                            : actionDialog.type === 'reverse'
                                ? 'Reverse (Balik) Jurnal Penyesuaian'
                                : 'Hapus Jurnal Penyesuaian'
                }
                description={
                    actionDialog.type === 'post'
                        ? 'Apakah Anda yakin ingin memposting jurnal penyesuaian ini? Transaksi yang diposting akan mempengaruhi saldo buku besar dan neraca.'
                        : actionDialog.type === 'unpost'
                            ? 'Apakah Anda yakin ingin membatalkan posting? Jurnal akan dikembalikan ke status draft dan saldo di buku besar akan dinetralkan.'
                            : actionDialog.type === 'reverse'
                                ? 'Sistem akan membuat jurnal pembalik otomatis (reversal entry) dengan menukar debit dan kredit untuk menetralkan mutasi ini. Lanjutkan?'
                                : 'Apakah Anda yakin ingin menghapus jurnal penyesuaian ini? Tindakan ini tidak dapat dibatalkan.'
                }
                confirmText={
                    actionDialog.type === 'post'
                        ? 'Ya, Posting'
                        : actionDialog.type === 'unpost'
                            ? 'Ya, Batalkan Posting'
                            : actionDialog.type === 'reverse'
                                ? 'Ya, Buat Jurnal Pembalik'
                                : 'Ya, Hapus'
                }
                onConfirm={handleActionConfirm}
                loading={actionDialog.loading}
                variant={actionDialog.type === 'delete' ? 'destructive' : 'default'}
            />
        </AppLayout>
    );
}

