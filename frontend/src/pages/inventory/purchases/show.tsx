import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Purchase } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/api/client';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    ShoppingCart,
    ArrowLeft,
    CheckCircle2,
    Truck,
    BookOpenCheck,
    CreditCard,
    DollarSign,
    RefreshCw,
    X,
    Building2,
    Calendar,
    Edit,
} from 'lucide-react';

export const InventoryPurchaseShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Modals
    const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
    const [receiveInputs, setReceiveInputs] = useState<any[]>([]);
    const [showApproveConfirm, setShowApproveConfirm] = useState<boolean>(false);
    const [approving, setApproving] = useState<boolean>(false);

    const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [debitAccountId, setDebitAccountId] = useState<string>('');
    const [creditAccountId, setCreditAccountId] = useState<string>('');

    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank');
    const [kasAccountId, setKasAccountId] = useState<string>('');
    const [refNumber, setRefNumber] = useState<string>('');
    const [paymentNotes, setPaymentNotes] = useState<string>('');

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await inventoryApi.getPurchase(id);
            if (res.data?.success) {
                const poData = res.data.data;
                let cachedMap: Record<number, number> = {};
                try {
                    const cached = sessionStorage.getItem(`po_received_${id}`);
                    if (cached) cachedMap = JSON.parse(cached);
                } catch {
                    // ignore
                }
                const lines = (poData.items || []).map((it: any) => {
                    const dbRec = Number(it.quantity_received || 0);
                    const cachedRec = Number(cachedMap[it.id] || 0);
                    const orderedQty = Number(it.quantity_ordered || 0);
                    const effectiveRec =
                        poData.status === 'received' || poData.status === 'completed'
                            ? Math.max(dbRec, cachedRec, orderedQty)
                            : Math.max(dbRec, cachedRec);
                    return {
                        ...it,
                        quantity_received: effectiveRec,
                    };
                });
                setPurchase({ ...poData, items: lines });
                // Inisialisasi receive inputs
                setReceiveInputs(
                    lines.map((it: any) => ({
                        purchase_item_id: it.id,
                        name: it.item?.name,
                        unit: it.item?.unit_of_measure,
                        ordered: Number(it.quantity_ordered),
                        already_received: Number(it.quantity_received || 0),
                        quantity_received: Math.max(0, Number(it.quantity_ordered) - Number(it.quantity_received || 0)),
                        batch_number: it.batch_number || '',
                        expiry_date: '',
                    }))
                );
                setPaymentAmount(Number(poData.ap_outstanding || 0));
            }
        } catch (err) {
            toast.error('Gagal memuat detail pengadaan');
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/daftar-akun');
            if (res.data?.success) {
                setAccounts(res.data.data || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchDetail();
        fetchAccounts();
    }, [id]);

    const handleApprove = async () => {
        if (!id) return;
        try {
            setApproving(true);
            const res = await inventoryApi.approvePurchase(id);
            if (res.data?.success) {
                toast.success('Purchase Order disetujui');
                setShowApproveConfirm(false);
                fetchDetail();
            }
        } catch (err: any) {
            toast.error('Gagal menyetujui PO');
        } finally {
            setApproving(false);
        }
    };

    const handleReceiveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        try {
            const itemsToReceive = receiveInputs
                .filter((r) => r.quantity_received > 0)
                .map((r) => ({
                    purchase_item_id: r.purchase_item_id,
                    quantity_received: Number(r.quantity_received),
                    batch_number: r.batch_number,
                    expiry_date: r.expiry_date || null,
                }));

            if (itemsToReceive.length === 0) {
                toast.error('Harap masukkan kuantiti barang yang diterima');
                return;
            }

            const res = await inventoryApi.receivePurchase(id, { items: itemsToReceive });
            if (res.data?.success) {
                try {
                    const cached = sessionStorage.getItem(`po_received_${id}`);
                    const cachedMap: Record<number, number> = cached ? JSON.parse(cached) : {};
                    receiveInputs.forEach((r) => {
                        if (Number(r.quantity_received) > 0) {
                            const prev = Math.max(Number(r.already_received || 0), Number(cachedMap[r.purchase_item_id] || 0));
                            cachedMap[r.purchase_item_id] = prev + Number(r.quantity_received);
                        }
                    });
                    sessionStorage.setItem(`po_received_${id}`, JSON.stringify(cachedMap));
                } catch {
                    // ignore
                }
                toast.success('Penerimaan barang berhasil diproses & stok gudang telah diperbarui');
                setShowReceiveModal(false);
                fetchDetail();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memproses penerimaan');
        }
    };

    const handleJournalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !debitAccountId || !creditAccountId) {
            toast.error('Harap pilih Akun Persediaan dan Akun Hutang');
            return;
        }

        try {
            const res = await inventoryApi.postPurchaseToJournal(id, {
                debit_account_id: Number(debitAccountId),
                credit_account_id: Number(creditAccountId),
            });
            if (res.data?.success) {
                toast.success('Pengadaan berhasil diposting ke Jurnal Umum');
                setShowJournalModal(false);
                fetchDetail();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal posting jurnal');
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || paymentAmount <= 0) {
            toast.error('Nominal pembayaran harus lebih besar dari 0');
            return;
        }

        try {
            const res = await inventoryApi.createPayment({
                purchase_id: Number(id),
                payment_date: new Date().toISOString().split('T')[0],
                amount: paymentAmount,
                payment_method: paymentMethod,
                daftar_akun_kas_id: kasAccountId ? Number(kasAccountId) : null,
                reference_number: refNumber,
                notes: paymentNotes,
            });
            if (res.data?.success) {
                toast.success('Pembayaran hutang PO berhasil dicatat');
                setShowPaymentModal(false);
                fetchDetail();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mencatat pembayaran');
        }
    };

    const formatCurrency = (val: string | number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full p-8 text-center text-xs text-neutral-500">
                    Memuat data detail pengadaan barang...
                </div>
            </AppLayout>
        );
    }

    if (!purchase) {
        return (
            <AppLayout>
                <div className="w-full p-8 text-center text-xs text-red-500">
                    Pengadaan barang tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/inventory/purchases">
                                <Button variant="outline" size="sm" className="size-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800">
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <ShoppingCart className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white font-mono">
                                        {purchase.purchase_number}
                                    </h1>
                                    <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${purchase.status === 'received' || purchase.status === 'completed'
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                            : purchase.status === 'ordered'
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200'
                                                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300'
                                        }`}>
                                        {purchase.status}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Pemasok: {purchase.supplier?.name}</span>
                                    <span>•</span>
                                    <span>Tanggal: {purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '-'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {purchase.status === 'draft' && (
                                <>
                                    <Can permission="inventory.purchases.edit">
                                        <Link to={`/inventory/purchases/${purchase.id}/edit`}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-none h-8 text-xs font-medium border-neutral-300 dark:border-neutral-700"
                                            >
                                                <Edit className="size-3.5 mr-1.5" />
                                                Edit PO
                                            </Button>
                                        </Link>
                                    </Can>
                                    <Can permission="inventory.purchases.approve">
                                        <Button
                                            size="sm"
                                            onClick={() => setShowApproveConfirm(true)}
                                            className="rounded-none h-8 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <CheckCircle2 className="size-3.5 mr-1.5" />
                                            Setujui PO (Order)
                                        </Button>
                                    </Can>
                                </>
                            )}

                            {purchase.status === 'ordered' && (
                                <Can permission="inventory.purchases.receive">
                                    <Button
                                        size="sm"
                                        onClick={() => setShowReceiveModal(true)}
                                        className="rounded-none h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Truck className="size-3.5 mr-1.5" />
                                        Penerimaan Barang (Gudang)
                                    </Button>
                                </Can>
                            )}

                            {purchase.status !== 'draft' && !purchase.jurnal_posted && (
                                <Can permission="inventory.purchases.post-to-journal">
                                    <Button
                                        size="sm"
                                        onClick={() => setShowJournalModal(true)}
                                        className="rounded-none h-8 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900"
                                    >
                                        <BookOpenCheck className="size-3.5 mr-1.5" />
                                        Posting ke Jurnal
                                    </Button>
                                </Can>
                            )}

                            {purchase.status !== 'draft' && Number(purchase.ap_outstanding || 0) > 0 && (
                                <Can permission={['inventory.purchases.create-payment', 'inventory.purchases.view-ap']}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowPaymentModal(true)}
                                        className="rounded-none h-8 text-xs font-medium border-neutral-300"
                                    >
                                        <CreditCard className="size-3.5 mr-1.5" />
                                        Bayar Hutang
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 p-4 sm:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 gap-4 text-xs">
                        <div>
                            <span className="text-neutral-400 uppercase text-[11px] font-semibold block mb-0.5">Syarat Pembayaran</span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{purchase.payment_terms || 'Tempo'}</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 uppercase text-[11px] font-semibold block mb-0.5">Target Pengiriman</span>
                            <span className="font-mono text-neutral-800 dark:text-neutral-200">{purchase.expected_delivery_date ? purchase.expected_delivery_date.split('T')[0] : '-'}</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 uppercase text-[11px] font-semibold block mb-0.5">Status Akuntansi</span>
                            {purchase.jurnal_posted ? (
                                <span className="font-semibold text-emerald-600">TERPOSTING KE JURNAL</span>
                            ) : (
                                <span className="text-neutral-400">Belum diposting</span>
                            )}
                        </div>
                        <div>
                            <span className="text-neutral-400 uppercase text-[11px] font-semibold block mb-0.5">Sisa Hutang (AP)</span>
                            {purchase.status === 'draft' ? (
                                <span className="font-mono font-bold text-neutral-500 dark:text-neutral-400 text-sm">
                                    {formatCurrency(0)}
                                </span>
                            ) : (
                                <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                                    {formatCurrency(purchase.ap_outstanding)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                Daftar Rincian Item Barang
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                                        <th className="py-2.5 px-3">Kode SKU</th>
                                        <th className="py-2.5 px-3">Nama Barang</th>
                                        <th className="py-2.5 px-3 text-right">Stok Gudang</th>
                                        <th className="py-2.5 px-3 text-right">Dipesan</th>
                                        <th className="py-2.5 px-3 text-right">Diterima</th>
                                        <th className="py-2.5 px-3 text-right">Sisa Belum Kirim</th>
                                        <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                                        <th className="py-2.5 px-3 text-right">Total Nilai</th>
                                        <th className="py-2.5 px-3 text-center">Status Item</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                    {purchase.items && purchase.items.length > 0 ? (
                                        purchase.items.map((it, idx) => {
                                            const ordered = Number(it.quantity_ordered);
                                            const rawReceived = Number(it.quantity_received || 0);
                                            const received =
                                                (purchase.status === 'received' || purchase.status === 'completed') && rawReceived === 0
                                                    ? ordered
                                                    : rawReceived;
                                            const remaining = Math.max(0, ordered - received);
                                            const itemStatus =
                                                received >= ordered || purchase.status === 'received' || purchase.status === 'completed'
                                                    ? 'received'
                                                    : received > 0
                                                      ? 'partial'
                                                      : purchase.status === 'ordered'
                                                        ? 'ordered'
                                                        : 'draft';

                                            return (
                                                <tr key={it.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                            {it.item?.code || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {it.item?.name}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
                                                        <span className="font-semibold">{Number(it.item?.total_stock ?? 0)}</span> {it.item?.unit_of_measure || ''}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-semibold">
                                                        {ordered} {it.item?.unit_of_measure}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {received} {it.item?.unit_of_measure}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-500">
                                                        {remaining} {it.item?.unit_of_measure}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
                                                        {formatCurrency(it.unit_price)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                        {formatCurrency(it.total_price)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase ${itemStatus === 'received'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : itemStatus === 'partial'
                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    : itemStatus === 'ordered'
                                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                        : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                                                            }`}>
                                                            {itemStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="text-center py-4 text-neutral-500">Tidak ada item.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Totals */}
                        <div className="flex justify-end p-4 bg-neutral-50/30 dark:bg-neutral-900/20">
                            <div className="w-72 space-y-2 text-xs">
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>Subtotal:</span>
                                    <span className="font-mono font-semibold">{formatCurrency(purchase.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>PPN (Pajak):</span>
                                    <span className="font-mono">{formatCurrency(purchase.tax_amount)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>Biaya Kirim:</span>
                                    <span className="font-mono">{formatCurrency(purchase.shipping_cost)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>Diskon:</span>
                                    <span className="font-mono text-red-500">-{formatCurrency(purchase.discount_amount)}</span>
                                </div>
                                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                    <span>Total Tagihan:</span>
                                    <span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(purchase.total_amount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* MODAL 1: Penerimaan Barang Fisik (Goods Receiving) */}
                {showReceiveModal && (() => {
                    const updateRow = (idx: number, patch: Record<string, any>) =>
                        setReceiveInputs((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
                    return (
                        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
                                {/* Header Bar */}
                                <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shrink-0">
                                            <Truck className="size-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                                Proses Penerimaan Barang Gudang
                                            </h2>
                                            <p className="text-[11px] text-neutral-500 font-mono">
                                                No. PO: {purchase?.purchase_number} • Pemasok: {purchase?.supplier?.name || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowReceiveModal(false)}
                                        className="size-8 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>

                                <form onSubmit={handleReceiveSubmit} className="flex flex-col min-h-0 flex-1">
                                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead className="bg-neutral-100/80 dark:bg-neutral-900/80 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
                                                <tr>
                                                    <th className="py-2.5 px-3 w-10 text-center whitespace-nowrap">No</th>
                                                    <th className="py-2.5 px-3 min-w-[180px] whitespace-nowrap">Nama Barang</th>
                                                    <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">Dipesan</th>
                                                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">Sudah Diterima</th>
                                                    <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">Sisa</th>
                                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Terima Sekarang</th>
                                                    <th className="py-2.5 px-3 w-44 whitespace-nowrap">No. Batch</th>
                                                    <th className="py-2.5 px-3 w-44 whitespace-nowrap">Tgl. Expired</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                                {receiveInputs.map((r, idx) => {
                                                    const remaining = Math.max(0, r.ordered - r.already_received);
                                                    const overLimit = Number(r.quantity_received) > remaining;
                                                    return (
                                                        <tr key={idx} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40">
                                                            <td className="py-2.5 px-3 text-center font-mono text-neutral-500">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                                {r.name}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap">
                                                                {r.ordered} {r.unit}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                                {r.already_received} {r.unit}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                                {remaining} {r.unit}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={remaining}
                                                                    value={r.quantity_received}
                                                                    onChange={(e) => updateRow(idx, { quantity_received: Number(e.target.value) })}
                                                                    className={`h-8 text-xs text-right font-mono rounded-none shadow-none ${overLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                                />
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <Input
                                                                    placeholder="Contoh: BATCH-01"
                                                                    value={r.batch_number}
                                                                    onChange={(e) => updateRow(idx, { batch_number: e.target.value })}
                                                                    className="h-8 text-xs rounded-none font-mono shadow-none"
                                                                />
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <Input
                                                                    type="date"
                                                                    value={r.expiry_date}
                                                                    onChange={(e) => updateRow(idx, { expiry_date: e.target.value })}
                                                                    className="h-8 text-xs rounded-none font-mono shadow-none"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer Bar */}
                                    <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowReceiveModal(false)}
                                            className="rounded-none h-8 px-4 text-xs shadow-none"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="rounded-none h-8 px-4 text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-none"
                                        >
                                            Konfirmasi Terima Barang &amp; Update Stok
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    );
                })()}

                {/* MODAL 2: Posting Jurnal Integrasi Akuntansi */}
                {showJournalModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none w-full max-w-lg shadow-xl overflow-hidden">
                            <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shrink-0">
                                        <BookOpenCheck className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            Posting Jurnal Pengadaan Barang
                                        </h2>
                                        <p className="text-[11px] text-neutral-500 font-mono">
                                            No. PO: {purchase.purchase_number}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowJournalModal(false)}
                                    className="size-8 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>

                            <form onSubmit={handleJournalSubmit} className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                            Akun Persediaan Barang (Debit) <span className="text-red-500">*</span>
                                        </label>
                                        <NativeSearchableSelect
                                            required
                                            value={debitAccountId}
                                            onChange={(e) => setDebitAccountId(e.target.value)}
                                            className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none focus:outline-none"
                                        >
                                            <option value="">Pilih Akun Persediaan (113... / 114...)</option>
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.kode_akun} - {acc.nama_akun}
                                                </option>
                                            ))}
                                        </NativeSearchableSelect>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                            Akun Hutang Usaha / Vendor (Kredit) <span className="text-red-500">*</span>
                                        </label>
                                        <NativeSearchableSelect
                                            required
                                            value={creditAccountId}
                                            onChange={(e) => setCreditAccountId(e.target.value)}
                                            className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none focus:outline-none"
                                        >
                                            <option value="">Pilih Akun Hutang Dagang (211...)</option>
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.kode_akun} - {acc.nama_akun}
                                                </option>
                                            ))}
                                        </NativeSearchableSelect>
                                    </div>

                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
                                        <span className="font-semibold text-neutral-600 dark:text-neutral-400 uppercase text-[11px]">
                                            Nominal Jurnal yang Diposting:
                                        </span>
                                        <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                            {formatCurrency(purchase.total_amount)}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-end gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowJournalModal(false)} className="rounded-none h-8 px-4 text-xs shadow-none">
                                        Batal
                                    </Button>
                                    <Button type="submit" size="sm" className="rounded-none h-8 px-4 text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-none">
                                        Posting ke Jurnal Umum
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 3: Pembayaran Hutang PO */}
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none w-full max-w-lg shadow-xl overflow-hidden">
                            <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shrink-0">
                                        <CreditCard className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            Pembayaran Hutang Pengadaan PO
                                        </h2>
                                        <p className="text-[11px] text-neutral-500 font-mono">
                                            No. PO: {purchase.purchase_number} • Sisa AP: {formatCurrency(purchase.ap_outstanding)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="size-8 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                <div className="p-4 space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                            Jumlah Pembayaran (Rp) <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            required
                                            min={1}
                                            max={Number(purchase.ap_outstanding || 0)}
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                            className="h-8 text-xs font-mono rounded-none shadow-none"
                                        />
                                        <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                                            Maksimal sisa hutang: {formatCurrency(purchase.ap_outstanding)}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                            Metode Pembayaran
                                        </label>
                                        <NativeSearchableSelect
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none"
                                        >
                                            <option value="Transfer Bank">Transfer Bank</option>
                                            <option value="Kas Tunai">Kas Tunai</option>
                                            <option value="Bilyet Giro">Bilyet Giro</option>
                                        </NativeSearchableSelect>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                            Sumber Akun Kas / Bank
                                        </label>
                                        <NativeSearchableSelect
                                            value={kasAccountId}
                                            onChange={(e) => setKasAccountId(e.target.value)}
                                            className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none"
                                        >
                                            <option value="">Pilih Akun Kas/Bank (111... / 112...)</option>
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.kode_akun} - {acc.nama_akun}
                                                </option>
                                            ))}
                                        </NativeSearchableSelect>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                            Nomor Referensi Bukti Bayar
                                        </label>
                                        <Input
                                            value={refNumber}
                                            onChange={(e) => setRefNumber(e.target.value)}
                                            placeholder="Contoh: BKK/2026/10/012"
                                            className="h-8 text-xs rounded-none font-mono shadow-none"
                                        />
                                    </div>
                                </div>

                                <div className="px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-end gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentModal(false)} className="rounded-none h-8 px-4 text-xs shadow-none">
                                        Batal
                                    </Button>
                                    <Button type="submit" size="sm" className="rounded-none h-8 px-4 text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-none">
                                        Simpan Pembayaran
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>

            <ConfirmDialog
                open={showApproveConfirm}
                onOpenChange={setShowApproveConfirm}
                title="Setujui Purchase Order (PO)"
                description='Apakah Anda yakin ingin menyetujui Purchase Order ini menjadi "ORDERED"?'
                confirmText="Setujui PO"
                variant="default"
                onConfirm={handleApprove}
                loading={approving}
            />
        </AppLayout>
    );
};

export default InventoryPurchaseShow;
