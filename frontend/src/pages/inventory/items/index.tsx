import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Item, ItemCategory } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    Package,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit3,
    Trash2,
    RotateCcw,
    Tag,
    Truck,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

export const InventoryItemsIndex: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<ItemCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category_id') || '');
    const [stockFilter, setStockFilter] = useState<string>(searchParams.get('low_stock') === 'true' ? 'low' : 'all');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const hasActiveFilters = search !== '' || selectedCategory !== '' || stockFilter !== 'all';

    const fetchCategories = async () => {
        try {
            const res = await inventoryApi.getCategories();
            if (res.data?.success) {
                const raw = res.data.data;
                setCategories(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
            }
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);
            const params: any = {
                page,
                per_page: perPage,
                search,
                low_stock: stockFilter === 'low',
            };
            if (selectedCategory) {
                params.category_id = Number(selectedCategory);
            }
            const res = await inventoryApi.getItems(params);
            if (res.data?.success) {
                const raw = res.data.data;
                setItems(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
                if (res.data.meta) {
                    setTotalPages(res.data.meta.last_page || 1);
                    setTotalItems(res.data.meta.total || 0);
                }
            }
        } catch (err: any) {
            console.error('Failed to load items', err);
            toast.error('Gagal memuat data barang');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [page, perPage, selectedCategory, stockFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) {
                fetchItems();
            } else {
                setPage(1);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [search]);

    const handleReset = () => {
        setSearch('');
        setSelectedCategory('');
        setStockFilter('all');
        setPage(1);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            const res = await inventoryApi.deleteItem(deleteTarget.id);
            if (res.data?.success) {
                toast.success('Barang berhasil dihapus');
                setDeleteTarget(null);
                fetchItems();
            }
        } catch (err: any) {
            toast.error('Gagal menghapus barang');
        } finally {
            setDeleting(false);
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

    const totalStockValue = items.reduce((acc, it) => acc + Number(it.stock_value || 0), 0);
    const lowStockCount = items.filter((it) => Number(it.total_stock || 0) <= Number(it.reorder_level || 0)).length;

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                {/* Enterprise Unified Single Card Container */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Package className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Master Data Barang & Inventaris
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {totalItems} Barang</span>
                                    <span>•</span>
                                    <span>Halaman {page} dari {totalPages}</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                    title="Reset semua filter ke default"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchItems}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="inventory.categories.view">
                                <Link to="/inventory/categories">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none font-medium"
                                    >
                                        <Tag className="size-3.5 mr-1.5" />
                                        Kategori
                                    </Button>
                                </Link>
                            </Can>

                            <Can permission="inventory.suppliers.view">
                                <Link to="/inventory/suppliers">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none font-medium"
                                    >
                                        <Truck className="size-3.5 mr-1.5" />
                                        Supplier
                                    </Button>
                                </Link>
                            </Can>

                            <Can permission="inventory.items.create">
                                <Link to="/inventory/items/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah Barang</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Search */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Kode SKU / Nama Barang
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari kode atau nama barang..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            {/* Kategori Filter */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Kategori Barang
                                </label>
                                <NativeSearchableSelect
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            {/* Status Stok Filter */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Status Ketersediaan Stok
                                </label>
                                <NativeSearchableSelect
                                    value={stockFilter}
                                    onChange={(e) => {
                                        setStockFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Status Stok</option>
                                    <option value="low">Stok Kritis / di Bawah Reorder</option>
                                </NativeSearchableSelect>
                            </div>
                        </div>
                    </div>

                    {/* 3. Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">Kode SKU</th>
                                    <th className="py-2.5 px-3">Nama Barang</th>
                                    <th className="py-2.5 px-3 w-44">Kategori</th>
                                    <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Satuan</th>
                                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">Stok Fisik</th>
                                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">Reorder Level</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Biaya Standar</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Total Nilai</th>
                                    <th className="py-2.5 px-3 text-center w-24 whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 text-right w-32 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && (!Array.isArray(items) || items.length === 0) ? (
                                    <tr>
                                        <td colSpan={11} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat data master barang...
                                        </td>
                                    </tr>
                                ) : (!Array.isArray(items) || items.length === 0) ? (
                                    <tr>
                                        <td colSpan={11} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Tidak ada data barang yang sesuai kriteria pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((it, idx) => {
                                        const stockQty = Number(it.total_stock || 0);
                                        const reorder = Number(it.reorder_level || 0);
                                        const isLow = stockQty <= reorder;

                                        return (
                                            <tr
                                                key={it.id}
                                                onClick={() => navigate(`/inventory/items/${it.id}`)}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                            >
                                                <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                    {(page - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                        {it.code}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs leading-snug">
                                                        {it.name}
                                                    </div>
                                                    {it.description && (
                                                        <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                                                            {it.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 font-medium">
                                                    {it.category?.name || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono uppercase text-neutral-700 dark:text-neutral-300 font-semibold">
                                                    {it.unit_of_measure}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                                                    <span className={isLow ? 'text-amber-600 dark:text-amber-500' : 'text-neutral-900 dark:text-neutral-100'}>
                                                        {stockQty.toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-neutral-500 tabular-nums whitespace-nowrap">
                                                    {reorder.toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-neutral-700 dark:text-neutral-300 tabular-nums whitespace-nowrap">
                                                    {formatCurrency(it.standard_cost || it.last_purchase_cost)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                                                    {formatCurrency(it.stock_value)}
                                                </td>
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    {isLow ? (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-none">
                                                            Kritis
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-none">
                                                            Aman
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    className="py-2 px-3 text-right whitespace-nowrap"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Can permission="inventory.items.view">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                                title="Lihat Detail"
                                                                onClick={() => navigate(`/inventory/items/${it.id}`)}
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                        <Can permission="inventory.items.edit">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                                title="Edit Barang"
                                                                onClick={() => navigate(`/inventory/items/${it.id}/edit`)}
                                                            >
                                                                <Edit3 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                        <Can permission="inventory.items.delete">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                                                                title="Hapus Barang"
                                                                onClick={() => setDeleteTarget({ id: it.id, name: it.name })}
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Pagination Footer Bar */}
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <span>Baris per halaman:</span>
                            <NativeSearchableSelect
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 text-xs rounded-none shadow-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </NativeSearchableSelect>
                            <span className="font-mono text-neutral-400 ml-2">
                                Menampilkan {items.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, totalItems)} dari {totalItems} data
                            </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1 || loading}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                                title="Halaman Pertama"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                                title="Halaman Sebelumnya"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>

                            <span className="px-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                Hal {page} dari {totalPages}
                            </span>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                                title="Halaman Selanjutnya"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages || loading}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                                title="Halaman Terakhir"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>

                </div>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Hapus Master Barang"
                description={`Apakah Anda yakin ingin menghapus barang "${deleteTarget?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus Barang"
                variant="destructive"
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
};

export default InventoryItemsIndex;
