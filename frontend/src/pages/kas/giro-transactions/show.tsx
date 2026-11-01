import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { GiroTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    FileSpreadsheet,
    Edit3,
    CheckCircle2,
    Send,
    CheckCheck,
    Ban,
    FileCheck2,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Transaksi Giro', href: '/kas/giro-transactions' },
    { title: 'Rincian Giro' },
];

export default function GiroTransactionShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [transaksi, setTransaksi] = useState<GiroTransaction | null>(null);
    const [loading, setLoading] = useState(true);

    const [actionTarget, setActionTarget] = useState<'submit' | 'cair' | 'tolak' | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [alasanTolak, setAlasanTolak] = useState('');

    const fetchDetail = async () => {
        try {
            const res = await api.get(`/kas/giro-transactions/${id}`);
            setTransaksi(res.data?.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat detail bilyet giro');
            navigate('/kas/giro-transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleConfirmAction = async () => {
        if (!transaksi || !actionTarget) return;
        setActionLoading(true);
        try {
            if (actionTarget === 'submit') {
                await api.post(`/kas/giro-transactions/${transaksi.id}/submit`);
                toast.success('Bilyet giro diserahkan ke bank untuk kliring');
            } else if (actionTarget === 'cair') {
                await api.post(`/kas/giro-transactions/${transaksi.id}/cair`);
                toast.success('Bilyet giro berhasil dicairkan (Cleared)');
            } else if (actionTarget === 'tolak') {
                await api.post(`/kas/giro-transactions/${transaksi.id}/tolak`, {
                    alasan: alasanTolak || 'Giro ditolak oleh bank',
                });
                toast.success('Bilyet giro telah ditolak (Bounced)');
            }
            setActionTarget(null);
            setAlasanTolak('');
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memproses aksi bilyet giro');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat data bilyet giro...
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!transaksi) return null;

    const isDraft = transaksi.status === 'draft';
    const isCair = transaksi.status_giro === 'cair';

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
                                    <FileSpreadsheet className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Rincian Warkat Giro: {transaksi.nomor_giro}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Jenis: {transaksi.jenis_giro === 'masuk' ? 'Giro Masuk' : 'Giro Keluar'} • Jatuh Tempo: {transaksi.tanggal_jatuh_tempo ? new Date(transaksi.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Lifecycle & Navigation Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {transaksi.status_giro === 'diterima' && (
                                <Can permission="kas.giro-transaction.clear">
                                    <Button
                                        size="sm"
                                        onClick={() => setActionTarget('submit')}
                                        className="h-8 text-xs font-semibold rounded-none bg-blue-600 hover:bg-blue-700 text-white px-3 gap-1.5 shadow-none"
                                    >
                                        <Send className="size-3.5" />
                                        <span>Serahkan ke Bank</span>
                                    </Button>
                                </Can>
                            )}

                            {(transaksi.status_giro === 'diterima' || transaksi.status_giro === 'diserahkan_ke_bank') && (
                                <>
                                    <Can permission="kas.giro-transaction.clear">
                                        <Button
                                            size="sm"
                                            onClick={() => setActionTarget('cair')}
                                            className="h-8 text-xs font-semibold rounded-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 gap-1.5 shadow-none"
                                        >
                                            <CheckCheck className="size-3.5" />
                                            <span>Cairkan Giro</span>
                                        </Button>
                                    </Can>
                                    <Can permission="kas.giro-transaction.reject">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setActionTarget('tolak')}
                                            className="h-8 text-xs font-semibold rounded-none border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 px-3 gap-1.5 shadow-none"
                                        >
                                            <Ban className="size-3.5" />
                                            <span>Tolak Giro</span>
                                        </Button>
                                    </Can>
                                </>
                            )}

                            {isDraft ? (
                                <>
                                    {!isCair && (
                                        <Can permission="kas.giro-transaction.edit">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/kas/giro-transactions/${transaksi.id}/edit`)}
                                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none gap-1.5"
                                            >
                                                <Edit3 className="size-3.5" />
                                                <span>Edit</span>
                                            </Button>
                                        </Can>
                                    )}
                                    <Can permission="kas.giro-transaction.post">
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/kas/giro-transactions/${transaksi.id}/post-to-journal`)}
                                            className="h-8 text-xs font-semibold rounded-none bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 px-3 gap-1.5 shadow-none"
                                        >
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Posting ke Jurnal</span>
                                        </Button>
                                    </Can>
                                </>
                            ) : (
                                <Can permission="akuntansi.jurnal.view">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none gap-1.5"
                                    >
                                        <Link to={`/kas/giro-transactions/${transaksi.id}/post-to-journal`}>
                                            <FileCheck2 className="size-3.5 text-emerald-600" />
                                            <span>Lihat Jurnal</span>
                                        </Link>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* Detail Grid */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Nomor Bilyet Giro</span>
                                <span className="font-bold font-mono text-neutral-900 dark:text-white text-base">{transaksi.nomor_giro}</span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Jenis Transaksi Giro</span>
                                <span className="font-semibold uppercase text-neutral-900 dark:text-white text-sm">
                                    {transaksi.jenis_giro === 'masuk' ? 'Giro Masuk (Penerimaan)' : 'Giro Keluar (Penerbitan)'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Tanggal Jatuh Tempo</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                                    {transaksi.tanggal_jatuh_tempo
                                        ? new Date(transaksi.tanggal_jatuh_tempo).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })
                                        : '-'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Nominal Warkat Giro</span>
                                <span className={cn('font-bold font-mono text-lg', transaksi.jenis_giro === 'keluar' ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400')}>
                                    {formatRupiah(Number(transaksi.jumlah) || 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detail Rows */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Rekening Bank Tujuan</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                                    {transaksi.bank_account?.nama_bank} - {transaksi.bank_account?.nomor_rekening}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Pihak Penerbit</span>
                                <span className="text-neutral-900 dark:text-white font-medium text-sm">{transaksi.penerbit || transaksi.nama_penerbit || '-'}</span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Pihak Penerima</span>
                                <span className="text-neutral-900 dark:text-white font-medium text-sm">{transaksi.penerima || '-'}</span>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1">Status Kliring Warkat</span>
                                <span className="font-semibold uppercase text-neutral-900 dark:text-white text-sm">
                                    {transaksi.status_giro.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Keterangan & Audit */}
                    <div className="p-4 bg-neutral-50/40 dark:bg-neutral-900/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1.5">Catatan / Uraian Keperluan</span>
                                <p className="text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">{transaksi.keterangan || 'Tidak ada catatan.'}</p>
                            </div>
                            <div>
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block mb-1.5">Akun COA Kliring Buku Besar</span>
                                <p className="text-neutral-800 dark:text-neutral-200 text-sm">
                                    {transaksi.daftar_akun ? `${transaksi.daftar_akun.kode_akun} - ${transaksi.daftar_akun.nama_akun}` : 'Belum dihubungkan ke akun buku besar'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog Lifecycle */}
            <ConfirmDialog
                open={actionTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !actionLoading) {
                        setActionTarget(null);
                        setAlasanTolak('');
                    }
                }}
                title={
                    actionTarget === 'submit'
                        ? 'Serahkan Giro ke Bank'
                        : actionTarget === 'cair'
                            ? 'Konfirmasi Pencairan Giro (Cair)'
                            : 'Konfirmasi Tolak Giro (Bounced)'
                }
                description={
                    actionTarget === 'submit'
                        ? `Bilyet giro ${transaksi.nomor_giro} akan diubah statusnya menjadi "Diserahkan ke Bank" untuk kliring.`
                        : actionTarget === 'cair'
                            ? `Bilyet giro ${transaksi.nomor_giro} senilai ${formatRupiah(Number(transaksi.jumlah) || 0)} telah dinyatakan Cair oleh bank.`
                            : `Bilyet giro ${transaksi.nomor_giro} ditolak oleh bank.`
                }
                confirmText="Konfirmasi"
                cancelText="Batal"
                variant={actionTarget === 'tolak' ? 'destructive' : 'default'}
                loading={actionLoading}
                onConfirm={handleConfirmAction}
            />
        </AppLayout>
    );
}
