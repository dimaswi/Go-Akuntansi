import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Item } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Sliders, Save } from 'lucide-react';
import { Can } from '@/components/can';

export const StockAdjustmentCreate: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [itemId, setItemId] = useState<number | ''>('');
    const [adjustmentDate, setAdjustmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
    const [quantity, setQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        const loadItems = async () => {
            try {
                setLoading(true);
                const res = await inventoryApi.getItems({ per_page: 200 });
                if (res.data?.success) {
                    setItems(res.data.data || []);
                }
            } catch {
                toast.error('Gagal memuat katalog barang');
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, []);

    const handleItemChange = (selectedId: number) => {
        setItemId(selectedId);
        const selected = items.find((it) => it.id === selectedId);
        if (selected) {
            setUnitPrice(Number(selected.last_purchase_cost || selected.standard_cost || 0));
        }
    };

    const selectedItem = items.find((it) => it.id === Number(itemId));
    const totalAmount = quantity * unitPrice;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemId) {
            toast.error('Silakan pilih barang yang akan disesuaikan');
            return;
        }
        if (!quantity || quantity <= 0) {
            toast.error('Kuantiti penyesuaian harus lebih besar dari 0');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                item_id: Number(itemId),
                tanggal_adjustment: adjustmentDate,
                tipe_adjustment: adjustmentType,
                quantity: Number(quantity),
                unit_price: Number(unitPrice),
                total_amount: totalAmount,
                keterangan: notes,
            };

            await inventoryApi.createStockAdjustment(payload);
            toast.success('Stock adjustment berhasil dibuat');
            navigate('/inventory/stock-adjustments');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan penyesuaian stok');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data formulir penyesuaian...
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
                                onClick={() => navigate('/inventory/stock-adjustments')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Sliders className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Buat Penyesuaian Stok (Stock Adjustment)
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Koreksi Kuantitas Persediaan (Susut, Selisih Fisik, Barang Rusak)</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-4 space-y-4 w-full max-w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Pilih Barang <span className="text-red-500">*</span>
                                </Label>
                                <NativeSearchableSelect
                                    value={itemId}
                                    onChange={(e) => handleItemChange(Number(e.target.value))}
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
                                    Tanggal Penyesuaian <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={adjustmentDate}
                                    onChange={(e) => setAdjustmentDate(e.target.value)}
                                    className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Tipe Penyesuaian <span className="text-red-500">*</span>
                                </Label>
                                <NativeSearchableSelect
                                    value={adjustmentType}
                                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                >
                                    <option value="decrease">Pengurangan (Shortage / Rusak / Hilang)</option>
                                    <option value="increase">Penambahan (Overage / Temuan Fisik)</option>
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Kuantiti Penyesuaian <span className="text-red-500">*</span>
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

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Biaya / Harga Satuan (Rp)
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                                    className="mt-1.5 h-8 text-xs text-right rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                    required
                                />
                            </div>
                        </div>

                        {/* Summary banner */}
                        <div className="py-2.5 px-3 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs">
                            <div>
                                <span className="text-neutral-500 mr-2">Satuan:</span>
                                <span className="font-semibold">{selectedItem?.unit_of_measure || '-'}</span>
                            </div>
                            <div>
                                <span className="text-neutral-500 mr-2">Total Nilai Penyesuaian:</span>
                                <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Alasan / Keterangan Penyesuaian
                            </Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Alasan koreksi stok fisik, nomor BA kerusakan, dll..."
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
                            onClick={() => navigate('/inventory/stock-adjustments')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission="inventory.stock-adjustments.create">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{saving ? 'Menyimpan...' : 'Simpan Draft Adjustment'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};
export default StockAdjustmentCreate;
