import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Supplier } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    Truck,
    Plus,
    Eye,
    Edit3,
    Trash2,
    RefreshCw,
    Search,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

export const InventorySuppliersIndex: React.FC = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getSuppliers({ search });
            if (res.data?.success) {
                const raw: any = res.data.data;
                setSuppliers(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
            }
        } catch (err) {
            toast.error('Gagal memuat pemasok');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuppliers();
        }, 200);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await inventoryApi.deleteSupplier(deleteTarget.id);
            toast.success('Pemasok dihapus');
            setDeleteTarget(null);
            fetchSuppliers();
        } catch (err) {
            toast.error('Gagal menghapus pemasok');
        } finally {
            setDeleting(false);
        }
    };

    const suppList = Array.isArray(suppliers) ? suppliers : [];
    const totalPages = Math.max(1, Math.ceil(suppList.length / perPage));
    const paginated = suppList.slice((page - 1) * perPage, page * perPage);

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Truck className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Data Pemasok & Vendor (Suppliers)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {suppliers.length} Pemasok</span>
                                    <span>•</span>
                                    <span>Distributor & Vendor Rekanan</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {search !== '' && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchSuppliers}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="inventory.suppliers.create">
                                <Link to="/inventory/suppliers/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah Pemasok</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Nama / Telepon / Email Vendor
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari nama, telepon, atau email vendor..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">Kode Vendor</th>
                                    <th className="py-2.5 px-3">Nama Vendor / Pemasok</th>
                                    <th className="py-2.5 px-3 w-40 whitespace-nowrap">Telepon</th>
                                    <th className="py-2.5 px-3 w-48 whitespace-nowrap">Email</th>
                                    <th className="py-2.5 px-3">Alamat</th>
                                    <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 w-32 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat data vendor...
                                        </td>
                                    </tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map((s, idx) => (
                                        <tr
                                            key={s.id}
                                            onClick={() => navigate(`/inventory/suppliers/${s.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {s.code || `SUP-${String(s.id).padStart(3, '0')}`}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {s.name}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                                {s.phone || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[180px]">
                                                {s.email || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-500 max-w-sm truncate">
                                                {s.address || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-none">
                                                    Aktif
                                                </span>
                                            </td>
                                            <td
                                                className="py-2 px-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <Can permission="inventory.suppliers.view">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/inventory/suppliers/${s.id}`)}
                                                            className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    <Can permission="inventory.suppliers.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/inventory/suppliers/${s.id}/edit`)}
                                                            className="size-7 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                            title="Edit Pemasok"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    <Can permission="inventory.suppliers.delete">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                                                            className="size-7 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                                                            title="Hapus Pemasok"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada data pemasok yang sesuai filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Pagination Footer Bar */}
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
                                Menampilkan {paginated.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, suppliers.length)} dari {suppliers.length} data
                            </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
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
                                disabled={page >= totalPages}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
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
                title="Hapus Data Pemasok"
                description={`Apakah Anda yakin ingin menghapus pemasok "${deleteTarget?.name || ''}"?`}
                confirmText="Hapus Pemasok"
                variant="destructive"
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
};

export default InventorySuppliersIndex;
