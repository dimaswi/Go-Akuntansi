import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { BankTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Landmark,
    Edit3,
    Send,
    BookOpen,
    ArrowDownLeft,
    ArrowUpRight,
    Repeat,
    CheckCheck,
    CheckCircle2,
    Lock,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Kas & Bank', href: '/kas/bank-transactions' },
    { title: 'Transaksi Bank', href: '/kas/bank-transactions' },
    { title: 'Voucher Bank' },
];

export default function BankTransactionShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [transaksi, setTransaksi] = useState<BankTransaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [reconciling, setReconciling] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/kas/bank-transactions/${id}`);
            setTransaksi(res.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat rincian transaksi bank');
            navigate('/kas/bank-transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const handleReconcileToggle = async () => {
        if (!transaksi) return;
        setReconciling(true);
        try {
            await api.post(`/kas/bank-transactions/${transaksi.id}/reconcile`);
            toast.success(
                transaksi.is_reconciled
                    ? 'Tanda rekonsiliasi koran dibatalkan'
                    : 'Transaksi berhasil ditandai cocok dengan rekening koran'
            );
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengubah status rekonsiliasi');
        } finally {
            setReconciling(false);
        }
    };

    if (loading || !transaksi) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat rincian voucher bank...
                    </div>
                </div>
            </AppLayout>
        );
    }

    const isPosted = transaksi.status === 'posted';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* Satu Kontainer Card Utuh */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar */}
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
                                    <Landmark className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            {transaksi.nomor_transaksi}
                                        </h1>
                                        <span className={cn(
                                            'text-[11px] font-mono uppercase px-2 py-0.5 border font-semibold',
                                            isPosted
                                                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                        )}>
                                            {transaksi.status}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Tanggal: {transaksi.tanggal_transaksi ? transaksi.tanggal_transaksi.split('T')[0] : '-'} • Rekening: {transaksi.bank_account?.nama_bank} ({transaksi.bank_account?.nomor_rekening})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons on Right */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Can permission={['kas.bank-transaction.reconcile', 'kas.cash-management.reconcile']}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReconcileToggle}
                                    disabled={reconciling}
                                    className={cn(
                                        'h-8 text-xs font-semibold rounded-none border px-2.5 gap-1.5 shadow-none',
                                        transaksi.is_reconciled
                                            ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40'
                                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                                    )}
                                >
                                    <CheckCheck className="size-3.5" />
                                    <span>{transaksi.is_reconciled ? 'Telah Cocok Koran' : 'Cocokkan Rek. Koran'}</span>
                                </Button>
                            </Can>

                            {!isPosted && (
                                <>
                                    <Can permission={['kas.bank-transaction.edit', 'kas.cash-management.daily-entry']}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/kas/bank-transactions/${transaksi.id}/edit`)}
                                            className="h-8 text-xs font-semibold rounded-none border border-neutral-200 dark:border-neutral-800 gap-1.5 shadow-none px-3"
                                        >
                                            <Edit3 className="size-3.5" />
                                            <span>Edit</span>
                                        </Button>
                                    </Can>

                                    <Can permission={['kas.bank-transaction.post', 'kas.cash-management.daily-entry']}>
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/kas/bank-transactions/${transaksi.id}/post-to-journal`)}
                                            className="h-8 text-xs font-semibold rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 gap-1.5 shadow-none px-3"
                                        >
                                            <Send className="size-3.5" />
                                            <span>Posting ke Jurnal</span>
                                        </Button>
                                    </Can>
                                </>
                            )}

                            {isPosted && (
                                <Can permission="akuntansi.jurnal.view">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none gap-1.5"
                                    >
                                        <Link to={`/kas/bank-transactions/${transaksi.id}/post-to-journal`}>
                                            <BookOpen className="size-3.5 text-blue-600" />
                                            <span>Lihat Jurnal Buku Besar</span>
                                        </Link>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* 2. Top Parameter Strip */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Jenis Mutasi</span>
                                <span className={cn(
                                    'inline-flex items-center gap-1 font-bold text-sm uppercase',
                                    transaksi.jenis_transaksi === 'setoran'
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-rose-700 dark:text-rose-400'
                                )}>
                                    {transaksi.jenis_transaksi === 'setoran' ? (
                                        <ArrowDownLeft className="size-4" />
                                    ) : transaksi.jenis_transaksi === 'penarikan' ? (
                                        <ArrowUpRight className="size-4" />
                                    ) : (
                                        <Repeat className="size-4" />
                                    )}
                                    {transaksi.jenis_transaksi}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Kategori</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-sm capitalize block">
                                    {transaksi.kategori_transaksi || '-'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Nomor Referensi</span>
                                <span className="font-mono font-medium text-neutral-900 dark:text-white text-sm block">
                                    {transaksi.referensi || '-'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Nominal Mutasi Bank</span>
                                <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white block">
                                    {formatRupiah(transaksi.jumlah)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Account Details Strip */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Rekening Bank</span>
                                <div className="font-bold text-neutral-900 dark:text-white text-sm">
                                    {transaksi.bank_account?.nama_bank} - {transaksi.bank_account?.nomor_rekening}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    A/N: {transaksi.bank_account?.nama_rekening}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Akun Lawan COA</span>
                                <div className="font-bold text-neutral-900 dark:text-white text-sm">
                                    {transaksi.daftar_akun_lawan?.nama_akun || 'Belum Ditentukan'}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Kode: {transaksi.daftar_akun_lawan?.kode_akun || '-'}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Pihak Terkait</span>
                                <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                                    {transaksi.pihak_terkait || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Keterangan & Jurnal Strip */}
                    <div className="p-4 bg-neutral-50/40 dark:bg-neutral-900/30">
                        <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1.5">Keterangan / Uraian Transaksi</span>
                        <p className="text-neutral-800 dark:text-neutral-200 mt-1 font-sans leading-relaxed">
                            {transaksi.keterangan || '-'}
                        </p>

                        {transaksi.jurnal && (
                            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-xs">
                                <BookOpen className="size-4 text-blue-600" />
                                <span className="text-neutral-600 dark:text-neutral-400">
                                    Tercatat pada Jurnal Umum No:
                                </span>
                                <Link
                                    to={`/akuntansi/jurnal/${transaksi.jurnal.id}`}
                                    className="font-bold font-mono text-blue-600 hover:underline"
                                >
                                    {transaksi.jurnal.nomor_jurnal}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
