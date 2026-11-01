import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, StockTransfer } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, ArrowRightLeft, CheckCircle2, Building2, Package, ArrowRight } from 'lucide-react';
import { Can } from '@/components/can';

export const StockTransferShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [transfer, setTransfer] = useState<StockTransfer | null>(null);
    const [loading, setLoading] = useState(true);
    const [receiving, setReceiving] = useState(false);
    const [showReceiveConfirm, setShowReceiveConfirm] = useState(false);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const listRes = await inventoryApi.getStockTransfers({ per_page: 200 });
            const list = listRes.data?.data?.data || listRes.data?.data || [];
            const found = (Array.isArray(list) ? list : []).find((t: any) => String(t.id) === String(id));
            if (found) {
                setTransfer(found);
            } else {
                const res = await inventoryApi.getStockTransfer(id);
                if (res.data?.success) {
                    setTransfer(res.data.data);
                } else {
                    toast.error('Data transfer stok tidak ditemukan');
                    navigate('/inventory/stock-transfers');
                }
            }
        } catch {
            toast.error('Gagal memuat rincian transfer stok');
            navigate('/inventory/stock-transfers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleReceive = async () => {
        if (!id) return;
        try {
            setReceiving(true);
            await inventoryApi.receiveStockTransfer(id);
            toast.success('Penerimaan mutasi stok berhasil dikonfirmasi');
            setShowReceiveConfirm(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengonfirmasi penerimaan barang');
        } finally {
            setReceiving(false);
        }
    };

    if (loading || !transfer) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat rincian bukti transfer stok...
                </div>
            </AppLayout>
        );
    }

    const isDone = transfer.status === 'received';

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/inventory/stock-transfers')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <ArrowRightLeft className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white font-mono">
                                            {transfer.nomor_transfer}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            isDone
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200'
                                        }`}>
                                            {transfer.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Tanggal: {transfer.tanggal_transfer?.split('T')[0]}</span>
                                        <span>•</span>
                                        <span>Mutasi Stok Antar Unit Kerja</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isDone && (
                                <Can permission="inventory.stock-transfers.receive">
                                    <Button
                                        size="sm"
                                        onClick={() => setShowReceiveConfirm(true)}
                                        disabled={receiving}
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>{receiving ? 'Menyimpan...' : 'Konfirmasi Penerimaan Barang'}</span>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* Content Details */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        {/* Units Transfer Route Banner */}
                        <div className="p-4 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-800">
                                    <Building2 className="size-5 text-neutral-600 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">Unit Pengirim</span>
                                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                        {transfer.from_department?.name || 'Gudang Pusat / Logistik'}
                                    </span>
                                </div>
                            </div>

                            <ArrowRight className="size-5 text-neutral-400 shrink-0 hidden md:block" />

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 dark:bg-neutral-800">
                                    <Building2 className="size-5 text-neutral-600 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">Unit Penerima</span>
                                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                        {transfer.to_department?.name || 'Departemen Terpilih'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="p-4 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                <Package className="size-3.5" />
                                <span>Rincian Barang yang Dimutasi</span>
                            </h3>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Nama Barang:</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">
                                        {transfer.item?.name || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Kode Barang:</span>
                                    <span className="font-mono">{transfer.item?.code || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500 font-semibold">Kuantitas Transfer:</span>
                                    <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                                        {Number(transfer.quantity)} {transfer.item?.unit_of_measure || 'Unit'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Status Fisik:</span>
                                    <span className="font-semibold uppercase text-xs">
                                        {isDone ? 'Sudah Diterima di Tujuan' : 'Dalam Proses Mutasi / Transit'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-neutral-500">Keterangan / Keperluan:</span>
                                    <span className="font-medium">{transfer.keterangan || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showReceiveConfirm}
                onOpenChange={setShowReceiveConfirm}
                title="Konfirmasi Penerimaan Transfer Stok"
                description="Apakah Anda yakin barang ini telah sampai dan diterima secara fisik oleh unit tujuan?"
                confirmText="Terima Barang"
                variant="default"
                onConfirm={handleReceive}
                loading={receiving}
            />
        </AppLayout>
    );
};
export default StockTransferShow;
