import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit3, Eye, Package, Tag } from 'lucide-react';
import { Can } from '@/components/can';

export const CategoryShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [category, setCategory] = useState<any | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [catRes, itemsRes] = await Promise.all([
                    inventoryApi.getCategories(),
                    inventoryApi.getItems({ category_id: Number(id), per_page: 200 }),
                ]);
                if (catRes.data?.success) {
                    const found = (catRes.data.data || []).find((c: any) => String(c.id) === String(id));
                    setCategory(found || null);
                }
                if (itemsRes.data?.success) {
                    const allItems = Array.isArray(itemsRes.data.data)
                        ? itemsRes.data.data
                        : itemsRes.data.data?.items || [];
                    setItems(allItems);
                }
            } catch {
                toast.error('Gagal memuat rincian kategori');
                navigate('/inventory/categories');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    if (loading || !category) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data kategori...
                </div>
            </AppLayout>
        );
    }

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
                                onClick={() => navigate('/inventory/categories')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Tag className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            {category.name}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            category.is_active !== false
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300'
                                        }`}>
                                            {category.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Kode: {category.code}</span>
                                        <span>•</span>
                                        <span>{items.length} Barang Terdaftar</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="inventory.categories.edit">
                                <Link to={`/inventory/categories/${category.id}/edit`}>
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Edit3 className="size-3.5" />
                                        <span>Edit Kategori</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="p-4 text-xs space-y-2">
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                <span className="text-neutral-500">Kode Kategori:</span>
                                <span className="font-mono font-bold text-neutral-900 dark:text-white">{category.code}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                <span className="text-neutral-500">Nama Kategori:</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">{category.name}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-neutral-500">Deskripsi / Keterangan:</span>
                                <span className="text-neutral-700 dark:text-neutral-300">{category.description || '-'}</span>
                            </div>
                        </div>

                        {/* Items in this category */}
                        <div>
                            <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                    <Package className="size-3.5" /> Barang dalam Kategori Ini ({items.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                                            <th className="py-2.5 px-3 w-36">Kode SKU</th>
                                            <th className="py-2.5 px-3">Nama Barang</th>
                                            <th className="py-2.5 px-3 w-28">Satuan</th>
                                            <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-neutral-400 text-xs italic font-mono">
                                                    Belum ada barang terdaftar di kategori ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item, idx) => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => navigate(`/inventory/items/${item.id}`)}
                                                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                                >
                                                    <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                            {item.code}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">
                                                        {item.name}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono uppercase text-neutral-500">
                                                        {item.unit_of_measure || 'PCS'}
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
                                                                    onClick={() => navigate(`/inventory/items/${item.id}`)}
                                                                    className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                                    title="Lihat Detail Barang"
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
export default CategoryShow;
