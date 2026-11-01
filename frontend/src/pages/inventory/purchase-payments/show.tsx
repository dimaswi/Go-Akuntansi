import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, ShoppingCart, Calendar, CheckCircle2 } from 'lucide-react';
import { Can } from '@/components/can';

export const PurchasePaymentShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [payment, setPayment] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const listRes = await inventoryApi.getPayments();
                const list = Array.isArray(listRes.data?.data) ? listRes.data.data : [];
                const found = list.find((p: any) => String(p.id) === String(id));
                if (found) {
                    setPayment(found);
                } else {
                    toast.error('Pembayaran tidak ditemukan');
                    navigate('/inventory/purchase-payments');
                }
            } catch {
                toast.error('Gagal memuat rincian pembayaran');
                navigate('/inventory/purchase-payments');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    if (loading || !payment) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat rincian bukti pembayaran...
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
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white font-mono">
                                            {payment.payment_number || `PAY-PO-${payment.id}`}
                                        </h1>
                                        <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 className="size-3" /> Berhasil
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Tanggal: {payment.payment_date?.split('T')[0]}</span>
                                        <span>•</span>
                                        <span>Metode: {payment.payment_method?.toUpperCase()}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {payment.purchase_id && (
                                <Can permission="inventory.purchases.view">
                                    <Link to={`/inventory/purchases/${payment.purchase_id}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none gap-1.5"
                                        >
                                            <ShoppingCart className="size-3.5" />
                                            <span>Lihat Purchase Order</span>
                                        </Button>
                                    </Link>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* Content Details */}
                    <div className="w-full max-w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                            <div className="p-4 space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Informasi Pembayaran
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Nomor Bukti:</span>
                                        <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                                            {payment.payment_number || `PAY-${payment.id}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Tanggal Bayar:</span>
                                        <span className="font-mono">{payment.payment_date?.split('T')[0]}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Metode Bayar:</span>
                                        <span className="font-medium uppercase">{payment.payment_method}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-neutral-500">Catatan / Ref:</span>
                                        <span>{payment.notes || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    PO & Nominal Pelunasan
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Terkait PO:</span>
                                        <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                                            {payment.purchase?.purchase_number || `#${payment.purchase_id}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500">Pemasok / Vendor:</span>
                                        <span className="font-medium">{payment.purchase?.supplier?.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                                        <span className="text-neutral-500 font-semibold">Nominal Dibayar:</span>
                                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-neutral-500">Status Posting Jurnal:</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                            TERPOSTING KE BUKU BESAR
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};
export default PurchasePaymentShow;
