import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, StockAdjustment } from '@/api/inventory';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Sliders, CheckCircle2, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { Can } from '@/components/can';

export const StockAdjustmentShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    // Form posting/approval
    const [debitAccountId, setDebitAccountId] = useState<number | ''>('');
    const [creditAccountId, setCreditAccountId] = useState<number | ''>('');

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [listRes, accRes] = await Promise.all([
                inventoryApi.getStockAdjustments({ per_page: 200 }),
                api.get('/daftar-akun'),
            ]);

            if (accRes.data?.success) {
                setAccounts(accRes.data.data || []);
            }

            const list = listRes.data?.data?.data || listRes.data?.data || [];
            const found = (Array.isArray(list) ? list : []).find((a: any) => String(a.id) === String(id));
            if (found) {
                setAdjustment(found);
            } else {
                const adjRes = await inventoryApi.getStockAdjustment(id);
                if (adjRes.data?.success) {
                    setAdjustment(adjRes.data.data);
                } else {
                    toast.error('Data stock adjustment tidak ditemukan');
                    navigate('/inventory/stock-adjustments');
                }
            }
        } catch {
            toast.error('Gagal memuat rincian penyesuaian');
            navigate('/inventory/stock-adjustments');
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
            const payload: any = {};
            if (debitAccountId) payload.debit_account_id = Number(debitAccountId);
            if (creditAccountId) payload.credit_account_id = Number(creditAccountId);

            await inventoryApi.approveStockAdjustment(id, payload);
            toast.success('Stock adjustment disetujui');
            setShowApproveConfirm(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyetujui penyesuaian stok');
        } finally {
            setApproving(false);
        }
    };

    if (loading || !adjustment) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat rincian stock adjustment...
                </div>
            </AppLayout>
        );
    }

    const formatCurrency = (val: number | string | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    const isDecrease = adjustment.tipe_adjustment === 'decrease' || adjustment.tipe_adjustment as any === 'shortage';

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
                                onClick={() => navigate('/inventory/stock-adjustments')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Sliders className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white font-mono">
                                            {adjustment.nomor_adjustment}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            adjustment.status === 'approved'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200'
                                        }`}>
                                            {adjustment.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Tanggal: {adjustment.tanggal_adjustment?.split('T')[0]}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            {isDecrease ? (
                                                <TrendingDown className="size-3 text-red-500" />
                                            ) : (
                                                <TrendingUp className="size-3 text-emerald-500" />
                                            )}
                                            {isDecrease ? 'Pengurangan (Shortage)' : 'Penambahan (Overage)'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {adjustment.status === 'draft' && (
                                <Can permission={['inventory.stock-adjustments.approve', 'inventory.stock-adjustments.post-to-journal']}>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowApproveConfirm(true)}
                                        disabled={approving}
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>{approving ? 'Memproses...' : 'Setujui & Posting Jurnal'}</span>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                            {/* Section 1: Barang */}
                            <div className="p-4 space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                    <Package className="size-3.5" />
                                    <span>Barang yang Disesuaikan</span>
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Nama Barang:</span>
                                        <span className="font-semibold text-neutral-900 dark:text-white">
                                            {adjustment.item?.name || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Kode Barang:</span>
                                        <span className="font-mono">{adjustment.item?.code || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Satuan:</span>
                                        <span>{adjustment.item?.unit_of_measure || 'Unit'}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-neutral-500">Keterangan / Alasan:</span>
                                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                            {adjustment.keterangan || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Perhitungan Nilai */}
                            <div className="p-4 space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Kuantiti & Nilai Penyesuaian
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Kuantiti:</span>
                                        <span className="font-mono font-bold text-neutral-900 dark:text-white">
                                            {Number(adjustment.quantity)} {adjustment.item?.unit_of_measure || 'Unit'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Harga Satuan:</span>
                                        <span className="font-mono">{formatCurrency(adjustment.unit_price)}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500 font-semibold">Total Nilai Finansial:</span>
                                        <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                                            {formatCurrency(adjustment.total_amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-neutral-500">Status Jurnal:</span>
                                        <span className={`font-mono text-xs font-semibold ${
                                            adjustment.jurnal_posted
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-amber-600 dark:text-amber-400'
                                        }`}>
                                            {adjustment.jurnal_posted ? 'SUDAH TERPOSTING' : 'DRAFT (BELUM POSTING)'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Approval Accounts Selection if Draft */}
                        {adjustment.status === 'draft' && (
                            <div className="p-4 space-y-3 bg-neutral-50/30 dark:bg-neutral-900/20">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Opsi Akun Jurnal Penyesuaian
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                                            Akun Debit (Beban Selisih / Persediaan)
                                        </label>
                                        <NativeSearchableSelect
                                            value={debitAccountId}
                                            onChange={(e) => setDebitAccountId(Number(e.target.value))}
                                            className="w-full h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                        >
                                            <option value="">-- Gunakan Akun Default Sistem --</option>
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.kode_akun} - {a.nama_akun}
                                                </option>
                                            ))}
                                        </NativeSearchableSelect>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                                            Akun Kredit (Persediaan / Beban Selisih)
                                        </label>
                                        <NativeSearchableSelect
                                            value={creditAccountId}
                                            onChange={(e) => setCreditAccountId(Number(e.target.value))}
                                            className="w-full h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                        >
                                            <option value="">-- Gunakan Akun Default Sistem --</option>
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.kode_akun} - {a.nama_akun}
                                                </option>
                                            ))}
                                        </NativeSearchableSelect>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showApproveConfirm}
                onOpenChange={setShowApproveConfirm}
                title="Setujui Penyesuaian Stok"
                description="Apakah Anda yakin ingin menyetujui penyesuaian stok ini dan menyelaraskan saldo stok fisik gudang?"
                confirmText="Setujui & Posting"
                variant="default"
                onConfirm={handleApprove}
                loading={approving}
            />
        </AppLayout>
    );
};
export default StockAdjustmentShow;
