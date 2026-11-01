import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetTransfer } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import { ArrowRightLeft, ArrowLeft, Edit, CheckCircle2, RefreshCw } from 'lucide-react';

export const AssetTransferShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [transfer, setTransfer] = useState<AssetTransfer | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [approving, setApproving] = useState<boolean>(false);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await assetApi.getTransfer(id);
            if (res.data?.success) {
                setTransfer(res.data.data);
            }
        } catch (err) {
            toast.error('Gagal memuat catatan mutasi aset');
            navigate('/aset/transfers');
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
            await assetApi.approveTransfer(Number(id));
            toast.success('Mutasi aset disetujui');
            setIsConfirmOpen(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyetujui mutasi');
        } finally {
            setApproving(false);
        }
    };

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Transfer', href: '/aset/transfers' },
        { title: transfer ? transfer.transfer_number : 'Detail Mutasi' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat rincian mutasi aset...
                </div>
            </AppLayout>
        );
    }

    if (!transfer) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Catatan mutasi aset tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/aset/transfers">
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
                                <ArrowRightLeft className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Mutasi: {transfer.transfer_number}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                            transfer.status === 'APPROVED'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                : transfer.status === 'REJECTED'
                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                        )}
                                    >
                                        {transfer.status}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Tanggal Mutasi: {transfer.transfer_date?.slice(0, 10)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {transfer.status === 'PENDING' && (
                                <Can permission="aset.transfers.approve">
                                    <Button
                                        size="sm"
                                        onClick={() => setIsConfirmOpen(true)}
                                        className="h-8 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-none px-3 gap-1.5 shadow-none"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Setujui Mutasi</span>
                                    </Button>
                                </Can>
                            )}
                            <Can permission="aset.transfers.edit">
                                <Link to={`/aset/transfers/${transfer.id}/edit`}>
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
                                Lokasi Asal
                            </span>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {transfer.from_department?.name || 'Pusat'}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                                {transfer.from_location || '-'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Lokasi Tujuan Baru
                            </span>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {transfer.to_department?.name || 'Tujuan'}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                                {transfer.to_location || '-'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Petugas Penerima (PIC)
                            </span>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {transfer.received_by || '-'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Status Mutasi
                            </span>
                            <div className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                                {transfer.status}
                            </div>
                        </div>
                    </div>

                    {/* Details Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <ArrowRightLeft className="size-3.5 text-neutral-600" />
                                    <span>Informasi Aset & Perpindahan Lokasi</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Aset Terkait
                                    </span>
                                    <Link
                                        to={`/aset/assets/${transfer.asset_id}`}
                                        className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline block"
                                    >
                                        {transfer.asset?.code || `AST-${transfer.asset_id}`}
                                    </Link>
                                    <div className="font-medium text-neutral-900 dark:text-white">
                                        {transfer.asset?.name || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Tanggal Mutasi
                                    </span>
                                    <div className="font-mono font-medium text-neutral-900 dark:text-white">
                                        {transfer.transfer_date?.slice(0, 10)}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Penerima Fisik (PIC)
                                    </span>
                                    <div className="font-medium text-neutral-900 dark:text-white">
                                        {transfer.received_by || '-'}
                                    </div>
                                </div>
                            </div>

                            {transfer.reason && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Alasan Mutasi
                                    </span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        {transfer.reason}
                                    </p>
                                </div>
                            )}

                            {transfer.notes && (
                                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Catatan
                                    </span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        {transfer.notes}
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
                title="Persetujuan Mutasi Aset"
                description={`Apakah Anda yakin ingin menyetujui mutasi aset "${transfer.asset?.name || ''}" ke "${transfer.to_location}"?`}
                confirmText="Setujui Mutasi"
                onConfirm={handleApprove}
                loading={approving}
            />
        </AppLayout>
    );
};

export default AssetTransferShow;
