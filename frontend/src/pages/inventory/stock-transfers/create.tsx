import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Item } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRightLeft, Save } from 'lucide-react';
import { Can } from '@/components/can';

export const StockTransferCreate: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [fromDeptId, setFromDeptId] = useState<number | ''>('');
    const [toDeptId, setToDeptId] = useState<number | ''>('');
    const [itemId, setItemId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);
                const [deptRes, itemRes] = await Promise.all([
                    inventoryApi.getDepartments(),
                    inventoryApi.getItems({ per_page: 200 }),
                ]);

                if (deptRes.data?.success) {
                    setDepartments(deptRes.data.data || []);
                }
                if (itemRes.data?.success) {
                    setItems(itemRes.data.data || []);
                }
            } catch {
                toast.error('Gagal memuat data departemen atau barang');
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
    }, []);

    const selectedItem = items.find((it) => it.id === Number(itemId));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!toDeptId) {
            toast.error('Silakan tentukan departemen tujuan');
            return;
        }
        if (fromDeptId && String(fromDeptId) === String(toDeptId)) {
            toast.error('Unit asal dan unit tujuan tidak boleh sama');
            return;
        }
        if (!itemId) {
            toast.error('Silakan pilih barang yang ditransfer');
            return;
        }
        if (!quantity || quantity <= 0) {
            toast.error('Kuantitas transfer harus lebih besar dari 0');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                tanggal_transfer: transferDate,
                from_department_id: fromDeptId ? Number(fromDeptId) : null,
                to_department_id: Number(toDeptId),
                item_id: Number(itemId),
                quantity: Number(quantity),
                keterangan: notes,
            };

            await inventoryApi.createStockTransfer(payload);
            toast.success('Transfer stok berhasil dibuat');
            navigate('/inventory/stock-transfers');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan transfer stok');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data transfer stok...
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
                                onClick={() => navigate('/inventory/stock-transfers')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <ArrowRightLeft className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Buat Transfer Stok Antar Gudang / Unit
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Mutasi Stok dari Gudang Utama ke Sub-Gudang / Poliklinik</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-4 space-y-4 w-full max-w-full">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Tanggal Transfer <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={transferDate}
                                    onChange={(e) => setTransferDate(e.target.value)}
                                    className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Gudang Asal (Pengirim)
                                </Label>
                                <NativeSearchableSelect
                                    value={fromDeptId}
                                    onChange={(e) => setFromDeptId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                >
                                    <option value="">[Gudang Pusat / Logistik Utama]</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Unit Tujuan (Penerima) <span className="text-red-500">*</span>
                                </Label>
                                <NativeSearchableSelect
                                    value={toDeptId}
                                    onChange={(e) => setToDeptId(Number(e.target.value))}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Pilih Unit / Ruangan Tujuan --</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Barang yang Dimutasi <span className="text-red-500">*</span>
                                </Label>
                                <NativeSearchableSelect
                                    value={itemId}
                                    onChange={(e) => setItemId(Number(e.target.value))}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {items.map((it) => (
                                        <option key={it.id} value={it.id}>
                                            [{it.code}] {it.name} ({it.unit_of_measure})
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Kuantitas ({selectedItem?.unit_of_measure || 'Unit'}) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="mt-1.5 h-8 text-xs text-right rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Keterangan / Keperluan Mutasi
                            </Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Pemenuhan stok harian IGD, perpindahan antar ruangan..."
                                className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                            />
                        </div>
                    </div>

                    {/* Card Footer: Actions */}
                    <div className="px-4 py-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/inventory/stock-transfers')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission="inventory.stock-transfers.create">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{saving ? 'Menyimpan...' : 'Kirim Transfer Stok'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};
export default StockTransferCreate;
