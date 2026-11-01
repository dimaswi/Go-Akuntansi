import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, ClipboardList, CheckCircle2, Building2, Package, Clock } from 'lucide-react';
import { Can } from '@/components/can';

export const StockRequestShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await inventoryApi.getStockRequest(id);
            if (res.data?.success) {
                setRequest(res.data.data);
            } else {
                // Fallback from list
                const listRes = await inventoryApi.getStockRequests();
                const list = listRes.data?.data?.data || listRes.data?.data || [];
                const found = list.find((r: any) => String(r.id) === String(id));
                setRequest(found || null);
            }
        } catch {
            try {
                const listRes = await inventoryApi.getStockRequests();
                const list = listRes.data?.data?.data || listRes.data?.data || [];
                const found = list.find((r: any) => String(r.id) === String(id));
                if (found) {
                    setRequest(found);
                } else {
                    toast.error('Data permintaan stok tidak ditemukan');
                    navigate('/inventory/stock-requests');
                }
            } catch {
                toast.error('Gagal memuat rincian amprahan stok');
                navigate('/inventory/stock-requests');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleApprove = async () => {
        if (!id) return;
        try {
            setApproving(true);
            await inventoryApi.approveStockRequest(id);
            toast.success('Permintaan stok berhasil disetujui');
            setShowApproveConfirm(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyetujui permintaan stok');
        } finally {
            setApproving(false);
        }
    };

    const handleComplete = async () => {
        if (!id) return;
        try {
            setCompleting(true);
            await inventoryApi.completeStockRequest(id);
            toast.success('Barang berhasil diserahkan ke unit dan stok fisik unit telah bertambah.');
            setShowCompleteConfirm(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyelesaikan penyerahan barang');
        } finally {
            setCompleting(false);
        }
    };

    if (loading || !request) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat rincian permintaan stok...
                </div>
            </AppLayout>
        );
    }

    const statusLower = (request.status || '').toLowerCase();
    const isApproved = statusLower === 'approved';
    const isCompleted = statusLower === 'completed';
    const isSubmitted = statusLower === 'submitted';

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
                                onClick={() => navigate('/inventory/stock-requests')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <ClipboardList className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white font-mono">
                                            {request.request_number}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            isCompleted
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300'
                                                : isApproved
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-300'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200'
                                        }`}>
                                            {isCompleted ? 'Selesai (Diserahkan)' : isApproved ? 'Disetujui (Menunggu Penyerahan)' : request.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Unit: {request.department?.name || 'Departemen'}</span>
                                        <span>•</span>
                                        <span>Prioritas: {request.priority?.toUpperCase()}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isSubmitted && (
                                <Can permission={['inventory.stock-requests.approve', 'inventory.stock-requests.create', 'inventory.stock-requests.view']}>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowApproveConfirm(true)}
                                        disabled={approving}
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>{approving ? 'Memproses...' : 'Setujui Permintaan'}</span>
                                    </Button>
                                </Can>
                            )}

                            {isApproved && (
                                <Can permission={['inventory.stock-requests.complete', 'inventory.stock-requests.approve', 'inventory.stock-requests.view']}>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowCompleteConfirm(true)}
                                        disabled={completing}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Package className="size-3.5" />
                                        <span>{completing ? 'Memproses...' : 'Serahkan Barang ke Unit'}</span>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* Content Details */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                            <div className="p-4 space-y-2 text-xs">
                                <h3 className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
                                    <Building2 className="size-3.5" /> Unit & Waktu Pengajuan
                                </h3>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Unit Pemohon:</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">{request.department?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Tanggal Pengajuan:</span>
                                    <span className="font-mono">{request.request_date?.split('T')[0]}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-neutral-500">Prioritas:</span>
                                    <span className="font-mono uppercase font-semibold text-neutral-800 dark:text-neutral-200">{request.priority}</span>
                                </div>
                            </div>

                            <div className="p-4 space-y-2 text-xs">
                                <h3 className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3">
                                    Tujuan & Status
                                </h3>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Keperluan:</span>
                                    <span className="font-medium text-neutral-900 dark:text-white">{request.purpose || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Catatan:</span>
                                    <span>{request.notes || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-neutral-500">Status Alur:</span>
                                    <span className="font-semibold uppercase">{request.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="w-full">
                            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                    <Package className="size-3.5" />
                                    <span>Daftar Barang yang Diajukan ({request.items?.length || 0})</span>
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                                            <th className="py-2.5 px-3 w-36">Kode SKU</th>
                                            <th className="py-2.5 px-3">Nama Barang</th>
                                            <th className="py-2.5 px-3 w-36 text-right">Stok Gudang Pusat</th>
                                            <th className="py-2.5 px-3 w-32 text-right">Kuantiti Diminta</th>
                                            <th className="py-2.5 px-3">Catatan Khusus</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {(request.items || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-6 text-center text-neutral-500 font-mono">
                                                    Tidak ada rincian baris barang.
                                                </td>
                                            </tr>
                                        ) : (
                                            request.items.map((it: any, idx: number) => {
                                                const centralStock = Number(it.item?.total_stock ?? 0);
                                                const isLow = centralStock < Number(it.quantity_requested || 0);

                                                return (
                                                    <tr key={it.id || idx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                        <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">{idx + 1}</td>
                                                        <td className="py-2 px-3">
                                                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                                {it.item?.code || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">{it.item?.name || `Item #${it.item_id}`}</td>
                                                        <td className="py-2 px-3 text-right font-mono">
                                                            <span className={`px-2 py-0.5 text-xs font-semibold ${isLow ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                                                {centralStock} {it.item?.unit_of_measure || ''}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4 text-right font-mono font-bold text-neutral-900 dark:text-white">
                                                            {Number(it.quantity_requested)} {it.item?.unit_of_measure || ''}
                                                        </td>
                                                        <td className="py-2 px-4 text-neutral-600 dark:text-neutral-400">{it.notes || '-'}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showApproveConfirm}
                onOpenChange={setShowApproveConfirm}
                title="Setujui Permintaan Stok"
                description="Apakah Anda yakin ingin menyetujui pengajuan permintaan stok unit ini?"
                confirmText="Setujui Permintaan"
                variant="default"
                onConfirm={handleApprove}
                loading={approving}
            />

            <ConfirmDialog
                open={showCompleteConfirm}
                onOpenChange={setShowCompleteConfirm}
                title="Serahkan Barang ke Unit Pemohon"
                description={`Apakah Anda yakin ingin menyerahkan fisik barang permintaan ini ke unit "${request.department?.name || 'pemohon'}"? Saldo stok Gudang Pusat akan dipotong dan saldo stok fisik unit akan langsung bertambah.`}
                confirmText="Ya, Serahkan Barang"
                variant="default"
                onConfirm={handleComplete}
                loading={completing}
            />
        </AppLayout>
    );
};
export default StockRequestShow;
