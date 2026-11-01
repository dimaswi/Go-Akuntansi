import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetDisposal } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import { Trash2, ArrowLeft, Edit, CheckCircle2, RefreshCw } from 'lucide-react';

export const AssetDisposalShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [disposal, setDisposal] = useState<AssetDisposal | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [approving, setApproving] = useState<boolean>(false);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await assetApi.getDisposal(id);
            if (res.data?.success) {
                setDisposal(res.data.data);
            }
        } catch (err) {
            toast.error('Gagal memuat catatan pelepasan aset');
            navigate('/aset/disposals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id, navigate]);

    const handleApprove = async () => {
        if (!id) return;
        try {
            setApproving(true);
            await assetApi.approveDisposal(Number(id));
            toast.success('Pelepasan aset disetujui');
            setIsConfirmOpen(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyetujui pelepasan');
        } finally {
            setApproving(false);
        }
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

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Disposal', href: '/aset/disposals' },
        { title: disposal ? disposal.disposal_number : 'Detail Pelepasan' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat rincian pelepasan aset...
                </div>
            </AppLayout>
        );
    }

    if (!disposal) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Catatan pelepasan aset tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    const gainLoss = Number(disposal.gain_loss || (Number(disposal.sale_proceeds || 0) - Number(disposal.book_value || 0)));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/aset/disposals">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Trash2 className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Pelepasan: {disposal.disposal_number}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                            disposal.status === 'APPROVED'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                : disposal.status === 'REJECTED'
                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                        )}
                                    >
                                        {disposal.status}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Metode: {disposal.disposal_type} • Tanggal: {disposal.disposal_date?.slice(0, 10)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {disposal.status === 'DRAFT' && (
                                <Can permission="aset.disposals.approve">
                                    <Button
                                        size="sm"
                                        onClick={() => setIsConfirmOpen(true)}
                                        className="h-8 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-none px-3 gap-1.5 shadow-none"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Setujui Pelepasan</span>
                                    </Button>
                                </Can>
                            )}
                            <Can permission="aset.disposals.edit">
                                <Link to={`/aset/disposals/${disposal.id}/edit`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 gap-1.5 shadow-none"
                                    >
                                        <Edit className="size-3.5" />
                                        <span>Ubah Data</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Metadata Overview Strip */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Nilai Buku Aset
                            </span>
                            <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                {formatCurrency(disposal.book_value)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Hasil Pelepasan / Jual
                            </span>
                            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(disposal.sale_proceeds)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Laba / (Rugi) Pelepasan
                            </span>
                            <div
                                className={cn(
                                    'text-sm font-bold font-mono',
                                    gainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                )}
                            >
                                {formatCurrency(gainLoss)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Penerima / Pembeli
                            </span>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {disposal.recipient || '-'}
                            </div>
                        </div>
                    </div>

                    {/* Details Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Trash2 className="size-3.5 text-neutral-600" />
                                    <span>Informasi Lengkap Pelepasan</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Aset Terkait
                                    </span>
                                    <Link
                                        to={`/aset/assets/${disposal.asset_id}`}
                                        className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline block"
                                    >
                                        {disposal.asset?.code || `AST-${disposal.asset_id}`}
                                    </Link>
                                    <div className="font-medium text-neutral-900 dark:text-white">
                                        {disposal.asset?.name || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Metode Pelepasan
                                    </span>
                                    <div className="font-semibold text-neutral-900 dark:text-white uppercase font-mono">
                                        {disposal.disposal_type}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Tanggal Dokumen
                                    </span>
                                    <div className="font-mono font-medium text-neutral-900 dark:text-white">
                                        {disposal.disposal_date?.slice(0, 10)}
                                    </div>
                                </div>
                            </div>

                            {disposal.reason && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Alasan Pelepasan
                                    </span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        {disposal.reason}
                                    </p>
                                </div>
                            )}

                            {disposal.notes && (
                                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Catatan / No. SK
                                    </span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        {disposal.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Persetujuan Pelepasan Aset"
                description={`Apakah Anda yakin ingin menyetujui pelepasan aset "${disposal.asset?.name || ''}"? Status aset akan diubah menjadi DISPOSED.`}
                confirmText="Setujui Pelepasan"
                onConfirm={handleApprove}
                loading={approving}
            />
        </AppLayout>
    );
};

export default AssetDisposalShow;
