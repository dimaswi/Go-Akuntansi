import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Supplier, Item } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, Plus, Trash2, Save } from 'lucide-react';
import { Can } from '@/components/can';

interface PurchaseLineInput {
    item_id: number;
    quantity_ordered: number;
    unit_price: number;
    notes?: string;
}

export const PurchaseEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [itemList, setItemList] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [supplierId, setSupplierId] = useState<number | ''>('');
    const [purchaseNumber, setPurchaseNumber] = useState<string>('');
    const [purchaseDate, setPurchaseDate] = useState<string>('');
    const [expectedDate, setExpectedDate] = useState<string>('');
    const [paymentTerms, setPaymentTerms] = useState<string>('30 Hari');
    const [notes, setNotes] = useState<string>('');
    const [items, setItems] = useState<PurchaseLineInput[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [poRes, supRes, itemsRes] = await Promise.all([
                    inventoryApi.getPurchase(id),
                    inventoryApi.getSuppliers(),
                    inventoryApi.getItems({ per_page: 200 }),
                ]);

                if (supRes.data?.success) {
                    setSuppliers(supRes.data.data || []);
                }
                if (itemsRes.data?.success) {
                    setItemList(itemsRes.data.data || []);
                }
                if (poRes.data?.success) {
                    const po = poRes.data.data;
                    if (po.status !== 'draft') {
                        toast.error('Hanya Purchase Order berstatus DRAFT yang dapat diedit');
                        navigate(`/inventory/purchases/${id}`);
                        return;
                    }
                    setPurchaseNumber(po.purchase_number);
                    setSupplierId(po.supplier_id);
                    setPurchaseDate(po.purchase_date?.split('T')[0] || '');
                    setExpectedDate(po.expected_delivery_date ? po.expected_delivery_date.split('T')[0] : '');
                    setPaymentTerms(po.payment_terms || '30 Hari');
                    setNotes(po.notes || '');

                    const existingLines = (po.items || []).map((it: any) => ({
                        item_id: it.item_id,
                        quantity_ordered: Number(it.quantity_ordered),
                        unit_price: Number(it.unit_price),
                        notes: it.notes || '',
                    }));
                    setItems(existingLines.length > 0 ? existingLines : [{ item_id: 0, quantity_ordered: 1, unit_price: 0, notes: '' }]);
                }
            } catch {
                toast.error('Gagal memuat data Purchase Order');
                navigate('/inventory/purchases');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    const addItemRow = () => {
        setItems([...items, { item_id: 0, quantity_ordered: 1, unit_price: 0, notes: '' }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length <= 1) {
            toast.error('Minimal harus ada satu item dalam PO');
            return;
        }
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItemRow = (index: number, field: keyof PurchaseLineInput, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };

        // Auto fill last_purchase_cost jika item dipilih
        if (field === 'item_id') {
            const selectedItem = itemList.find((it) => it.id === Number(value));
            if (selectedItem) {
                updated[index].unit_price = Number(selectedItem.last_purchase_cost || selectedItem.standard_cost || 0);
            }
        }
        setItems(updated);
    };

    const calculateTotal = () => {
        return items.reduce((sum, it) => sum + Number(it.quantity_ordered || 0) * Number(it.unit_price || 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId) {
            toast.error('Silakan pilih supplier');
            return;
        }
        if (items.some((it) => !it.item_id || it.quantity_ordered <= 0)) {
            toast.error('Semua baris barang harus dipilih dan memiliki kuantiti lebih dari 0');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                supplier_id: Number(supplierId),
                purchase_date: purchaseDate,
                expected_delivery_date: expectedDate || null,
                payment_terms: paymentTerms,
                notes,
                items: items.map((it) => ({
                    item_id: Number(it.item_id),
                    quantity_ordered: Number(it.quantity_ordered),
                    unit_price: Number(it.unit_price),
                    notes: it.notes || '',
                })),
            };

            await inventoryApi.updatePurchase(id!, payload);
            toast.success('Purchase Order berhasil diperbarui');
            navigate(`/inventory/purchases/${id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan PO');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat formulir edit purchase order...
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
                                onClick={() => navigate(`/inventory/purchases/${id}`)}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Batal"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <ShoppingCart className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Purchase Order: {purchaseNumber}
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Status: DRAFT</span>
                                        <span>•</span>
                                        <span>Perbarui Rekanan Vendor atau Rincian Pesanan Barang</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        {/* Section 1: Header Information */}
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Pemasok / Vendor <span className="text-red-500">*</span>
                                    </Label>
                                    <NativeSearchableSelect
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(Number(e.target.value))}
                                        className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 text-neutral-900 dark:text-white focus:outline-none"
                                        required
                                    >
                                        <option value="">-- Pilih Supplier --</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </NativeSearchableSelect>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Tanggal PO <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={purchaseDate}
                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                        className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Estimasi Pengiriman
                                    </Label>
                                    <Input
                                        type="date"
                                        value={expectedDate}
                                        onChange={(e) => setExpectedDate(e.target.value)}
                                        className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        Syarat Pembayaran (TOP)
                                    </Label>
                                    <Input
                                        value={paymentTerms}
                                        onChange={(e) => setPaymentTerms(e.target.value)}
                                        placeholder="Contoh: 30 Hari, COD, Net 60"
                                        className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Catatan Pengadaan
                                </Label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Keterangan perihal pesanan, instruksi khusus, dll..."
                                    className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                />
                            </div>
                        </div>

                        {/* Section 2: Items Table */}
                        <div className="w-full">
                            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Daftar Barang yang Dipesan
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItemRow}
                                    className="h-7 text-[11px] rounded-none border-neutral-200 dark:border-neutral-800 gap-1"
                                >
                                    <Plus className="size-3" /> Tambah Baris
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/70 font-semibold text-neutral-600 dark:text-neutral-400 uppercase text-[11px]">
                                            <th className="py-2 px-4 w-10 text-center">#</th>
                                            <th className="py-2 px-4">Nama Barang</th>
                                            <th className="py-2 px-4 w-28 text-right">Sisa Stok</th>
                                            <th className="py-2 px-4 w-28 text-right">Kuantiti</th>
                                            <th className="py-2 px-4 w-36 text-right">Harga Satuan (Rp)</th>
                                            <th className="py-2 px-4 w-40 text-right">Subtotal (Rp)</th>
                                            <th className="py-2 px-4">Catatan / Spesifikasi</th>
                                            <th className="py-2 px-4 w-12 text-center">Hapus</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {items.map((line, idx) => {
                                            const selItem = itemList.find((it) => String(it.id) === String(line.item_id));
                                            const stockVal = Number(selItem?.total_stock ?? 0);
                                            const isLow = stockVal <= 0;
                                            const lineTotal = Number(line.quantity_ordered || 0) * Number(line.unit_price || 0);

                                            return (
                                                <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                    <td className="py-2 px-4 text-center text-neutral-400 font-mono">{idx + 1}</td>
                                                    <td className="py-2 px-4">
                                                        <NativeSearchableSelect
                                                            value={line.item_id}
                                                            onChange={(e) => updateItemRow(idx, 'item_id', e.target.value)}
                                                            className="w-full h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                                            required
                                                        >
                                                            <option value={0}>-- Pilih Barang --</option>
                                                            {itemList.map((it) => (
                                                                <option key={it.id} value={it.id}>
                                                                    [{it.code}] {it.name} - Sisa Stok: {Number(it.total_stock || 0)} {it.unit_of_measure}
                                                                </option>
                                                            ))}
                                                        </NativeSearchableSelect>
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono">
                                                        {selItem ? (
                                                            <span className={`px-1.5 py-0.5 text-xs font-semibold ${isLow ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                                {stockVal} {selItem.unit_of_measure}
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-4 text-right">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={line.quantity_ordered}
                                                            onChange={(e) => updateItemRow(idx, 'quantity_ordered', Number(e.target.value))}
                                                            className="h-8 text-xs text-right rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 text-right">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={line.unit_price}
                                                            onChange={(e) => updateItemRow(idx, 'unit_price', Number(e.target.value))}
                                                            className="h-8 text-xs text-right rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                                        {formatCurrency(lineTotal)}
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <Input
                                                            value={line.notes || ''}
                                                            onChange={(e) => updateItemRow(idx, 'notes', e.target.value)}
                                                            placeholder="Catatan baris item..."
                                                            className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeItemRow(idx)}
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-none"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Bar */}
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-6 text-xs">
                                <div className="text-right">
                                    <span className="text-neutral-500 mr-2">Total Nilai Pesanan:</span>
                                    <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                                        {formatCurrency(calculateTotal())}
                                    </span>
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
                            onClick={() => navigate(`/inventory/purchases/${id}`)}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission="inventory.purchases.edit">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};
export default PurchaseEdit;
