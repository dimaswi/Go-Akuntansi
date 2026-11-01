import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Purchase } from '@/api/inventory';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Save } from 'lucide-react';
import { Can } from '@/components/can';

export const PurchasePaymentCreate: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedPoId = searchParams.get('purchase_id');

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedPoId, setSelectedPoId] = useState<number | ''>(preselectedPoId ? Number(preselectedPoId) : '');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
    const [bankAccountId, setBankAccountId] = useState<number | ''>('');
    const [amount, setAmount] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const [poRes, bankRes] = await Promise.all([
                    inventoryApi.getPurchases({ per_page: 100 }),
                    api.get('/kas/bank-accounts'),
                ]);

                if (poRes.data?.success) {
                    const list = (poRes.data.data || []).filter(
                        (p: Purchase) => p.status !== 'draft' && p.status !== 'cancelled' && Number(p.ap_outstanding || 0) > 0,
                    );
                    setPurchases(list);

                    if (preselectedPoId) {
                        const target = list.find((p: Purchase) => String(p.id) === String(preselectedPoId));
                        if (target) {
                            setSelectedPoId(target.id);
                            setAmount(Number(target.ap_outstanding || 0));
                        }
                    }
                }

                if (bankRes.data?.success) {
                    setBankAccounts(bankRes.data.data || []);
                    if (bankRes.data.data?.length > 0) {
                        setBankAccountId(bankRes.data.data[0].id);
                    }
                }
            } catch {
                toast.error('Gagal memuat data pendukung pembayaran');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [preselectedPoId]);

    const activePo = purchases.find((p) => p.id === Number(selectedPoId));

    const handlePoChange = (idVal: number) => {
        setSelectedPoId(idVal);
        const p = purchases.find((x) => x.id === idVal);
        if (p) {
            setAmount(Number(p.ap_outstanding || 0));
        } else {
            setAmount(0);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPoId) {
            toast.error('Silakan pilih nomor Purchase Order yang akan dibayar');
            return;
        }
        if (!amount || amount <= 0) {
            toast.error('Jumlah nominal pembayaran harus lebih besar dari 0');
            return;
        }
        if (activePo && amount > Number(activePo.ap_outstanding || 0)) {
            toast.error('Nominal bayar melebihi sisa hutang PO (' + formatCurrency(Number(activePo.ap_outstanding || 0)) + ')');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                purchase_id: Number(selectedPoId),
                payment_date: paymentDate,
                payment_method: paymentMethod,
                bank_account_id: bankAccountId ? Number(bankAccountId) : null,
                amount: Number(amount),
                notes,
            };

            await inventoryApi.createPayment(payload);
            toast.success('Pembayaran PO berhasil dicatat');
            navigate('/inventory/purchase-payments');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan pembayaran PO');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data pembayaran...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <form onSubmit={handleSubmit} className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/inventory/purchase-payments')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <CreditCard className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Catat Pembayaran Hutang Pembelian (PO)
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Pengeluaran Kas/Bank untuk Pelunasan Invoice Supplier</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        {/* Section 1: Choose PO */}
                        <div className="p-4 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                1. Pilih Dokumen Tagihan (Purchase Order)
                            </h3>
                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Nomor Purchase Order <span className="text-red-500">*</span>
                                </Label>
                                <NativeSearchableSelect
                                    value={selectedPoId}
                                    onChange={(e) => handlePoChange(Number(e.target.value))}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 text-neutral-900 dark:text-white focus:outline-none"
                                    required
                                >
                                    <option value="">-- Pilih PO dengan Sisa Hutang --</option>
                                    {purchases.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.purchase_number} — {p.supplier?.name} (Sisa Hutang: {formatCurrency(Number(p.ap_outstanding || 0))})
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            {activePo && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-800 text-xs">
                                    <div>
                                        <span className="text-neutral-500 block text-[11px]">Supplier:</span>
                                        <span className="font-semibold text-neutral-900 dark:text-white">{activePo.supplier?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 block text-[11px]">Total Tagihan PO:</span>
                                        <span className="font-mono font-medium">{formatCurrency(Number(activePo.total_amount || 0))}</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 block text-[11px]">Sisa Hutang Berjalan:</span>
                                        <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(Number(activePo.ap_outstanding || 0))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Payment Details */}
                        <div className="p-4 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                2. Rincian Penarikan Kas / Bank
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Tanggal Bayar <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Metode Pembayaran
                                    </Label>
                                    <NativeSearchableSelect
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                    >
                                        <option value="bank_transfer">Transfer Bank</option>
                                        <option value="cash">Kas Tunai (Petty Cash)</option>
                                        <option value="giro">Giro / Cek</option>
                                    </NativeSearchableSelect>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Rekening Kas/Bank Sumber
                                    </Label>
                                    <NativeSearchableSelect
                                        value={bankAccountId}
                                        onChange={(e) => setBankAccountId(Number(e.target.value))}
                                        className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                    >
                                        <option value="">-- Pilih Rekening Kas/Bank --</option>
                                        {bankAccounts.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.bank_name} - {b.account_number} ({b.account_name})
                                            </option>
                                        ))}
                                    </NativeSearchableSelect>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Jumlah Bayar (Rp) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="mt-1.5 h-8 text-xs font-mono font-bold text-neutral-900 dark:text-white rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                        required
                                    />
                                    {amount > 0 && (
                                        <p className="text-[11px] text-neutral-500 font-mono mt-1">
                                            Terbilang: {formatCurrency(amount)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Catatan / Keterangan Pembayaran
                                    </Label>
                                    <Input
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Nomor bukti transfer, referensi kwitansi..."
                                        className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer: Actions */}
                    <div className="px-4 py-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/inventory/purchase-payments')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission={['inventory.purchases.create-payment', 'inventory.purchase-payments.create', 'inventory.purchases.view-ap']}>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submitting}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};
export default PurchasePaymentCreate;