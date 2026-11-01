import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Item } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Package, Edit2, AlertTriangle, Building2, Truck, Tag } from 'lucide-react';
import { Can } from '@/components/can';

export const InventoryItemShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await inventoryApi.getItem(id);
                if (res.data?.success) {
                    setItem(res.data.data);
                }
            } catch {
                toast.error('Gagal memuat rincian barang');
                navigate('/inventory/items');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id, navigate]);

    const formatCurrency = (val: string | number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    if (loading || !item) {
        return (
            <AppLayout>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat rincian master barang...
                    </div>
                </div>
            </AppLayout>
        );
    }

    const currentStock = Number(item.total_stock || 0);
    const reorderLevel = Number(item.reorder_level || 0);
    const isLow = currentStock <= reorderLevel;

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
                                onClick={() => navigate('/inventory/items')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Package className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white font-mono">
                                            {item.code} — {item.name}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            item.is_active
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300'
                                        }`}>
                                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Satuan: {item.unit_of_measure}</span>
                                        <span>•</span>
                                        <span>Kategori: {item.category?.name || 'Tanpa Kategori'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="inventory.items.edit">
                                <Link to={`/inventory/items/${item.id}/edit`}>
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Edit2 className="size-3.5" />
                                        <span>Edit Barang</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Content Details */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        {/* Flat Divided Info Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/20">
                            <div className="p-4">
                                <span className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Total Stok Fisik Saat Ini
                                </span>
                                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                                    {currentStock.toLocaleString('id-ID')} <span className="text-xs font-normal text-neutral-500 font-sans">{item.unit_of_measure}</span>
                                </div>
                                <div className="mt-1">
                                    {isLow ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                            <AlertTriangle className="size-3" />
                                            Di bawah batas minimum ({reorderLevel})
                                        </span>
                                    ) : (
                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                            Stok dalam posisi aman
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4">
                                <span className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Harga Standar (Cost)
                                </span>
                                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                                    {formatCurrency(item.standard_cost)}
                                </div>
                                <span className="text-[11px] text-neutral-500 block mt-1">Estimasi biaya perolehan</span>
                            </div>

                            <div className="p-4">
                                <span className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Harga Beli Terakhir (PO)
                                </span>
                                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                                    {formatCurrency(item.last_purchase_cost)}
                                </div>
                                <span className="text-[11px] text-neutral-500 block mt-1">Riwayat faktur vendor terbaru</span>
                            </div>

                            <div className="p-4">
                                <span className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Total Valuasi Nilai Stok
                                </span>
                                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(item.stock_value)}
                                </div>
                                <span className="text-[11px] text-neutral-500 block mt-1">Kuantiti fisik × biaya per unit</span>
                            </div>
                        </div>

                        {/* Specification Grid */}
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/60 font-semibold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                Informasi Master & Parameter Batas
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800 text-xs">
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                                        <span className="text-neutral-500">Kategori Barang</span>
                                        <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                            <Tag className="size-3.5 text-neutral-400" />
                                            {item.category?.name || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                                        <span className="text-neutral-500">Vendor / Pemasok Default</span>
                                        <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                            <Truck className="size-3.5 text-neutral-400" />
                                            {item.supplier?.name || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                                        <span className="text-neutral-500">Unit / Departemen Pengelola</span>
                                        <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                            <Building2 className="size-3.5 text-neutral-400" />
                                            Gudang Pusat Logistik
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-neutral-500">Deskripsi / Spesifikasi</span>
                                        <span className="text-neutral-700 dark:text-neutral-300">{item.description || '-'}</span>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                                        <span className="text-neutral-500">Reorder Level (Batas Beli Kembali)</span>
                                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{Number(item.reorder_level || 0)} {item.unit_of_measure}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                                        <span className="text-neutral-500">Safety Stock (Stok Pengaman)</span>
                                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{Number(item.safety_stock || 0)} {item.unit_of_measure}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                                        <span className="text-neutral-500">Maksimum Kapasitas Gudang</span>
                                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{Number(item.max_level || 0)} {item.unit_of_measure}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-neutral-500">Tipe Inventaris</span>
                                        <span className="font-mono uppercase font-semibold text-neutral-800 dark:text-neutral-200">{item.inventory_type || 'General'}</span>
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
export default InventoryItemShow;

