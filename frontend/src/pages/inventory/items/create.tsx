import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, ItemCategory, Supplier } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Package, ArrowLeft, Save } from 'lucide-react';
import { Can } from '@/components/can';

export const InventoryItemCreate: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ItemCategory[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState({
        code: '',
        name: '',
        category_id: '',
        supplier_id: '',
        unit_of_measure: 'PCS',
        description: '',
        reorder_level: 10,
        max_level: 100,
        safety_stock: 5,
        standard_cost: 0,
        last_purchase_cost: 0,
        is_active: true,
    });

    useEffect(() => {
        const initData = async () => {
            try {
                const [catRes, supRes] = await Promise.all([
                    inventoryApi.getCategories(),
                    inventoryApi.getSuppliers(),
                ]);
                if (catRes.data?.success) setCategories(catRes.data.data);
                if (supRes.data?.success) setSuppliers(supRes.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        initData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Nama barang wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const payload: any = {
                ...form,
                category_id: form.category_id ? Number(form.category_id) : null,
                supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
                reorder_level: Number(form.reorder_level),
                max_level: Number(form.max_level),
                safety_stock: Number(form.safety_stock),
                standard_cost: Number(form.standard_cost),
                last_purchase_cost: Number(form.last_purchase_cost),
            };

            const res = await inventoryApi.createItem(payload);
            if (res.data?.success) {
                toast.success('Barang berhasil ditambahkan');
                navigate('/inventory/items');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menambahkan barang');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <form onSubmit={handleSubmit} className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Link to="/inventory/items">
                                <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300" title="Kembali">
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Package className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                                        Tambah Master Barang Baru
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                        Daftarkan SKU inventaris baru dengan spesifikasi satuan dan batas reorder
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="p-4 space-y-4 w-full max-w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Kode SKU (Opsional, otomatis bila kosong)
                                </label>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    placeholder="Contoh: ITM-001"
                                    className="h-8 text-xs rounded-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Nama Barang <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Contoh: Paracetamol 500mg / Spuit 3cc"
                                    className="h-8 text-xs rounded-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Kategori Barang
                                </label>
                                <NativeSearchableSelect
                                    value={form.category_id}
                                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                    className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none focus:outline-none"
                                >
                                    <option value="">Pilih Kategori...</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Pemasok Utama (Vendor)
                                </label>
                                <NativeSearchableSelect
                                    value={form.supplier_id}
                                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                                    className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none focus:outline-none"
                                >
                                    <option value="">Pilih Pemasok...</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Satuan Ukuran (UOM)
                                </label>
                                <Input
                                    value={form.unit_of_measure}
                                    onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
                                    placeholder="Contoh: PCS / BOX / STRIP / BOTOL"
                                    className="h-8 text-xs rounded-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Biaya Standar / HPP (Rp)
                                </label>
                                <Input
                                    type="number"
                                    value={form.standard_cost}
                                    onChange={(e) => setForm({ ...form, standard_cost: Number(e.target.value) })}
                                    className="h-8 text-xs rounded-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Batas Minimum Reorder Level
                                </label>
                                <Input
                                    type="number"
                                    value={form.reorder_level}
                                    onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
                                    className="h-8 text-xs rounded-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                    Safety Stock
                                </label>
                                <Input
                                    type="number"
                                    value={form.safety_stock}
                                    onChange={(e) => setForm({ ...form, safety_stock: Number(e.target.value) })}
                                    className="h-8 text-xs rounded-none font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
                                Keterangan / Spesifikasi
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                placeholder="Tambahkan catatan spesifikasi teknis barang jika ada..."
                                className="w-full p-2 text-xs border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Card Footer: Actions */}
                    <div className="px-4 py-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                        <Link to="/inventory/items">
                            <Button type="button" variant="outline" size="sm" className="rounded-none h-8 text-xs px-3 shadow-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                Batal
                            </Button>
                        </Link>
                        <Can permission="inventory.items.create">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={submitting}
                                className="rounded-none h-8 px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan Barang'}</span>
                            </Button>
                        </Can>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
};

export default InventoryItemCreate;
