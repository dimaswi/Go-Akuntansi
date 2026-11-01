import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { CashTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Receipt,
    Edit3,
    Send,
    BookOpen,
    ArrowDownLeft,
    ArrowUpRight,
    Lock,
    Clock,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Transaksi Kas', href: '/kas/cash-transactions' },
    { title: 'Rincian Kas' },
];

export default function CashTransactionShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tx, setTx] = useState<CashTransaction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/kas/cash-transactions/${id}`)
            .then((res) => setTx(res.data.data))
            .catch(() => {
                toast.error('Gagal memuat rincian transaksi kas');
                navigate('/kas/cash-transactions');
            })
            .finally(() => setLoading(false));
    }, [id, navigate]);

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

    const isMasuk = tx.jenis_transaksi === 'penerimaan';
    const isPosted = tx.status === 'posted';

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
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-base font-bold font-mono uppercase tracking-tight text-neutral-900 dark:text-white">
                                            {tx.nomor_transaksi}
                                        </h1>
                                        <span className={cn(
                                            'text-xs font-mono uppercase px-2 py-0.5 border font-semibold rounded-none',
                                            isPosted
                                                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                        )}>
                                            {tx.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Tanggal: {tx.tanggal_transaksi ? tx.tanggal_transaksi.split('T')[0] : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons on Right */}
                        <div className="flex flex-wrap items-center gap-2">
                            {!isPosted && (
                                <>
                                    <Can permission={['kas.cash-transaction.edit', 'kas.cash-management.daily-entry']}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/kas/cash-transactions/${tx.id}/edit`)}
                                            className="h-8 text-xs font-semibold rounded-none border border-neutral-200 dark:border-neutral-800 gap-1.5 shadow-none px-3"
                                        >
                                            <Edit3 className="size-3.5" />
                                            <span>Edit</span>
                                        </Button>
                                    </Can>

                                    <Can permission={['kas.cash-transaction.post', 'kas.cash-management.daily-entry']}>
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/kas/cash-transactions/${tx.id}/post-to-journal`)}
                                            className="h-8 text-xs font-semibold rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 gap-1.5 shadow-none px-3"
                                        >
                                            <Send className="size-3.5" />
                                            <span>Posting ke Jurnal</span>
                                        </Button>
                                    </Can>
                                </>
                            )}

                            {isPosted && tx.jurnal && (
                                <Can permission="akuntansi.jurnal.view">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none gap-1.5"
                                    >
                                        <Link to={`/akuntansi/jurnal/${tx.jurnal.id}`}>
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
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Jenis Kas</span>
                                <span className={cn(
                                    'inline-flex items-center gap-1.5 font-bold text-sm',
                                    isMasuk ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                )}>
                                    {isMasuk ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                                    {isMasuk ? 'Kas Masuk (BKM)' : 'Kas Keluar (BKK)'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Kategori</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-sm capitalize block">
                                    {tx.kategori_transaksi || '-'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Nomor Referensi</span>
                                <span className="font-mono font-medium text-neutral-900 dark:text-white text-sm block">
                                    {tx.referensi || '-'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Nominal Kas</span>
                                <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white block">
                                    {formatRupiah(tx.jumlah)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Account & Counterparty Details Strip */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Rekening Kas</span>
                                <div className="font-bold text-neutral-900 dark:text-white text-sm">
                                    {tx.daftar_akun_kas?.nama_akun || '-'}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Kode: {tx.daftar_akun_kas?.kode_akun || '-'}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Rekening Lawan</span>
                                <div className="font-bold text-neutral-900 dark:text-white text-sm">
                                    {tx.daftar_akun_lawan?.nama_akun || 'Belum Ditentukan'}
                                </div>
                                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Kode: {tx.daftar_akun_lawan?.kode_akun || '-'}
                                </div>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Pihak Terkait</span>
                                <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                                    {tx.pihak_terkait || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Keterangan & Jurnal Terkait Strip */}
                    <div className="p-4 bg-neutral-50/40 dark:bg-neutral-900/30">
                        <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1.5">Keterangan / Uraian Transaksi</span>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                            {tx.keterangan || '-'}
                        </p>

                        {tx.jurnal && (
                            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-xs">
                                <BookOpen className="size-4 text-blue-600" />
                                <span className="text-neutral-600 dark:text-neutral-400">
                                    Tercatat pada Jurnal Umum No:
                                </span>
                                <Link
                                    to={`/akuntansi/jurnal/${tx.jurnal.id}`}
                                    className="font-bold font-mono text-blue-600 hover:underline"
                                >
                                    {tx.jurnal.nomor_jurnal}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
