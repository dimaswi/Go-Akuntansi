import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit3, Eye, Mail, MapPin, Phone, ShoppingCart, Truck, User } from 'lucide-react';
import { Can } from '@/components/can';

export const SupplierShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState<any | null>(null);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [supRes, poRes] = await Promise.all([
                    inventoryApi.getSuppliers(),
                    inventoryApi.getPurchases({ per_page: 100 }),
                ]);
                if (supRes.data?.success) {
                    const list = Array.isArray(supRes.data.data) ? supRes.data.data : [];
                    const found = list.find((s: any) => String(s.id) === String(id));
                    if (found) {
                        setSupplier(found);
                    } else {
                        toast.error('Data pemasok tidak ditemukan');
                        navigate('/inventory/suppliers');
                        return;
                    }
                }
                if (poRes.data?.success) {
                    const allPo = Array.isArray(poRes.data.data)
                        ? poRes.data.data
                        : poRes.data.data?.items || [];
                    setPurchases(allPo.filter((p: any) => Number(p.supplier_id || p.supplier?.id) === Number(id)));
                }
            } catch {
                toast.error('Gagal memuat rincian pemasok');
                navigate('/inventory/suppliers');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    if (loading || !supplier) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data pemasok...
                </div>
            </AppLayout>
        );
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

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
                                onClick={() => navigate('/inventory/suppliers')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Truck className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            {supplier.name}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            supplier.is_active !== false
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300'
                                        }`}>
                                            {supplier.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Kode Vendor: {supplier.code || `SUP-${String(supplier.id).padStart(3, '0')}`}</span>
                                        <span>•</span>
                                        <span>Termin: {supplier.payment_terms || 30} Hari</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="inventory.suppliers.edit">
                                <Link to={`/inventory/suppliers/${supplier.id}/edit`}>
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Edit3 className="size-3.5" />
                                        <span>Edit Pemasok</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                            <div className="p-4 space-y-2.5 text-xs">
                                <h3 className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3">
                                    Informasi Kontak & Alamat
                                </h3>
                                <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500 flex items-center gap-1.5"><User className="size-3.5" /> PIC / Kontak:</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">{supplier.contact_person || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500 flex items-center gap-1.5"><Phone className="size-3.5" /> Telepon:</span>
                                    <span className="font-mono">{supplier.phone || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500 flex items-center gap-1.5"><Mail className="size-3.5" /> Email:</span>
                                    <span className="font-mono">{supplier.email || '-'}</span>
                                </div>
                                <div className="flex items-start justify-between py-1">
                                    <span className="text-neutral-500 flex items-center gap-1.5"><MapPin className="size-3.5" /> Alamat:</span>
                                    <span className="text-right max-w-xs">{supplier.address || '-'}</span>
                                </div>
                            </div>

                            <div className="p-4 space-y-2.5 text-xs">
                                <h3 className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3">
                                    Ketentuan Keuangan & Pajak
                                </h3>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Nomor NPWP:</span>
                                    <span className="font-mono">{supplier.npwp || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Termin Pembayaran (TOP):</span>
                                    <span className="font-mono font-semibold">{supplier.payment_terms || 30} Hari</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-neutral-500">Status Kemitraan:</span>
                                    <span className="font-semibold">{supplier.is_active !== false ? 'Vendor Aktif' : 'Nonaktif'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Purchase History */}
                        <div>
                            <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                    <ShoppingCart className="size-3.5" /> Riwayat Pesanan Pembelian (PO) Terakhir
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                                            <th className="py-2.5 px-3 w-40">Nomor PO</th>
                                            <th className="py-2.5 px-3 w-36">Tanggal</th>
                                            <th className="py-2.5 px-3 text-right">Total Nilai</th>
                                            <th className="py-2.5 px-3 w-32 text-center">Status</th>
                                            <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {purchases.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs italic font-mono">
                                                    Belum ada riwayat pembelian untuk pemasok ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            purchases.map((po, idx) => (
                                                <tr
                                                    key={po.id}
                                                    onClick={() => navigate(`/inventory/purchases/${po.id}`)}
                                                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                                >
                                                    <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                            {po.purchase_number}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-neutral-500">
                                                        {po.purchase_date ? new Date(po.purchase_date).toLocaleDateString('id-ID') : '-'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                                                        {formatCurrency(po.total_amount)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center uppercase font-mono text-[10px]">
                                                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-semibold">
                                                            {po.status}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="py-2 px-3 text-right whitespace-nowrap"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Can permission="inventory.purchases.view">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => navigate(`/inventory/purchases/${po.id}`)}
                                                                    className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                                    title="Lihat Detail PO"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};
export default SupplierShow;
