import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Item, Supplier } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart, ArrowLeft, Plus, Trash2, Save, Calculator } from 'lucide-react';
import { Can } from '@/components/can';

interface PurchaseLineItem {
    item_id: number | '';
    quantity_ordered: number;
    unit_price: number;
    total_price: number;
    notes: string;
}

export const InventoryPurchaseCreate: React.FC = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [itemList, setItemList] = useState<Item[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [supplierId, setSupplierId] = useState<string>('');
    const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
    const [paymentTerms, setPaymentTerms] = useState<string>('Kredit 30 Hari');
    const [notes, setNotes] = useState<string>('');
    const [taxAmount, setTaxAmount] = useState<number>(0);
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);

    const [lines, setLines] = useState<PurchaseLineItem[]>([
        { item_id: '', quantity_ordered: 1, unit_price: 0, total_price: 0, notes: '' },
    ]);

    useEffect(() => {
        const initData = async () => {
            try {
                const [supRes, itemRes] = await Promise.all([
                    inventoryApi.getSuppliers(),
                    inventoryApi.getItems({ per_page: 200 }),
                ]);
                if (supRes.data?.success) setSuppliers(supRes.data.data || []);
                if (itemRes.data?.success) setItemList(itemRes.data.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        initData();
    }, []);

    const addLine = () => {
        setLines([...lines, { item_id: '', quantity_ordered: 1, unit_price: 0, total_price: 0, notes: '' }]);
    };

    const removeLine = (idx: number) => {
        if (lines.length <= 1) return;
        setLines(lines.filter((_, i) => i !== idx));
    };

    const handleItemChange = (idx: number, itemIdStr: string) => {
        const itemId = Number(itemIdStr);
        const selected = itemList.find((it) => it.id === itemId);
        const newLines = [...lines];
        newLines[idx].item_id = itemId || '';
        if (selected) {
            const price = Number(selected.last_purchase_cost || selected.standard_cost || 0);
            newLines[idx].unit_price = price;
            newLines[idx].total_price = newLines[idx].quantity_ordered * price;
        }
        setLines(newLines);
    };

    const handleQtyChange = (idx: number, qty: number) => {
        const newLines = [...lines];
        newLines[idx].quantity_ordered = qty;
        newLines[idx].total_price = qty * newLines[idx].unit_price;
        setLines(newLines);
    };

    const handlePriceChange = (idx: number, price: number) => {
        const newLines = [...lines];
        newLines[idx].unit_price = price;
        newLines[idx].total_price = newLines[idx].quantity_ordered * price;
        setLines(newLines);
    };

    const subtotal = lines.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    const grandTotal = subtotal + Number(taxAmount || 0) + Number(shippingCost || 0) - Number(discountAmount || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId) {
            toast.error('Harap pilih vendor/pemasok');
            return;
        }
        const validItems = lines.filter((l) => l.item_id !== '' && l.quantity_ordered > 0);
        if (validItems.length === 0) {
            toast.error('Harap masukkan minimal satu item barang yang valid');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                supplier_id: Number(supplierId),
                purchase_date: purchaseDate,
                expected_delivery_date: expectedDeliveryDate || null,
                payment_terms: paymentTerms,
                notes,
                tax_amount: Number(taxAmount),
                shipping_cost: Number(shippingCost),
                discount_amount: Number(discountAmount),
                items: validItems.map((v) => ({
                    item_id: Number(v.item_id),
                    quantity_ordered: Number(v.quantity_ordered),
                    unit_price: Number(v.unit_price),
                    notes: v.notes,
                })),
            };

            const res = await inventoryApi.createPurchase(payload);
            if (res.data?.success) {
                toast.success('Pengadaan barang berhasil dibuat!');
                navigate(`/inventory/purchases/${res.data.data.id}`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan pengadaan');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/inventory/purchases">
                                <Button variant="outline" size="sm" className="size-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800">
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <ShoppingCart className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Buat Pengadaan Barang Baru (Purchase Order)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Form Pemesanan Pengadaan ke Vendor / Distributor</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <form id="purchase-create-form" onSubmit={handleSubmit} className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        
                        {/* Section 1: Info PO */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-neutral-50/30 dark:bg-neutral-900/20">
                            <div>
                                <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Pemasok / Vendor <span className="text-red-500">*</span>
                                </label>
                                <NativeSearchableSelect
                                    required
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none focus:outline-none"
                                >
                                    <option value="">Pilih Vendor...</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Tanggal PO <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    className="h-8 text-xs rounded-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Target Tgl Kirim
                                </label>
                                <Input
                                    type="date"
                                    value={expectedDeliveryDate}
                                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                    className="h-8 text-xs rounded-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Syarat Pembayaran
                                </label>
                                <Input
                                    value={paymentTerms}
                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                    placeholder="Contoh: Kredit 30 Hari / COD"
                                    className="h-8 text-xs rounded-none"
                                />
                            </div>
                        </div>

                        {/* Section 2: Line Items */}
                        <div className="w-full">
                            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Rincian Barang yang Dipesan
                                </h2>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addLine}
                                    className="h-7 text-xs rounded-none border-neutral-200 dark:border-neutral-800"
                                >
                                    <Plus className="size-3.5 mr-1" />
                                    Tambah Baris
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 uppercase font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-2 w-12 text-center">No</th>
                                            <th className="px-4 py-2">Barang (SKU)</th>
                                            <th className="px-4 py-2 w-28 text-right">Sisa Stok</th>
                                            <th className="px-4 py-2 w-32 text-right">Kuantiti</th>
                                            <th className="px-4 py-2 w-40 text-right">Harga Satuan (Rp)</th>
                                            <th className="px-4 py-2 w-44 text-right">Subtotal (Rp)</th>
                                            <th className="px-4 py-2">Catatan Baris</th>
                                            <th className="px-4 py-2 w-12 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {lines.map((line, idx) => {
                                            const selItem = itemList.find((it) => String(it.id) === String(line.item_id));
                                            const stockVal = Number(selItem?.total_stock ?? 0);
                                            const isLow = stockVal <= 0;

                                            return (
                                                <tr key={idx} className="hover:bg-neutral-50/30">
                                                    <td className="px-4 py-2 text-center font-mono text-neutral-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <NativeSearchableSelect
                                                            required
                                                            value={line.item_id}
                                                            onChange={(e) => handleItemChange(idx, e.target.value)}
                                                            className="w-full h-8 px-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none focus:outline-none"
                                                        >
                                                            <option value="">Pilih Barang...</option>
                                                            {itemList.map((it) => (
                                                                <option key={it.id} value={it.id}>
                                                                    [{it.code}] {it.name} - Sisa Stok: {Number(it.total_stock || 0)} {it.unit_of_measure}
                                                                </option>
                                                            ))}
                                                        </NativeSearchableSelect>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono">
                                                        {selItem ? (
                                                            <span className={`px-1.5 py-0.5 text-xs font-semibold ${isLow ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                                {stockVal} {selItem.unit_of_measure}
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={line.quantity_ordered}
                                                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                                                        className="h-8 text-xs rounded-none text-right font-mono"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={line.unit_price}
                                                        onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                                                        className="h-8 text-xs rounded-none text-right font-mono"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrency(line.total_price)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        value={line.notes}
                                                        onChange={(e) => {
                                                            const newLines = [...lines];
                                                            newLines[idx].notes = e.target.value;
                                                            setLines(newLines);
                                                        }}
                                                        placeholder="Catatan batch / spesifikasi..."
                                                        className="h-8 text-xs rounded-none"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={lines.length <= 1}
                                                        onClick={() => removeLine(idx)}
                                                        className="size-7 p-0 rounded-none text-red-500 hover:text-red-700"
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
                        </div>

                        {/* Section 3: Summary & Total Calculation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                            <div className="p-4">
                                <label className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
                                    Catatan Umum / Instruksi Pengiriman
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Instruksi pengiriman, lokasi serah terima gudang, dll..."
                                    className="w-full p-2.5 text-xs border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-900"
                                />
                            </div>

                            <div className="p-4 bg-neutral-50/30 dark:bg-neutral-900/20 space-y-2">
                                <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                                    <span>Subtotal Item:</span>
                                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="text-neutral-600 dark:text-neutral-400">Pajak (PPN):</span>
                                    <Input
                                        type="number"
                                        value={taxAmount}
                                        onChange={(e) => setTaxAmount(Number(e.target.value))}
                                        className="h-7 w-36 text-xs text-right font-mono rounded-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="text-neutral-600 dark:text-neutral-400">Biaya Pengiriman:</span>
                                    <Input
                                        type="number"
                                        value={shippingCost}
                                        onChange={(e) => setShippingCost(Number(e.target.value))}
                                        className="h-7 w-36 text-xs text-right font-mono rounded-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="text-neutral-600 dark:text-neutral-400">Diskon Vendor:</span>
                                    <Input
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                        className="h-7 w-36 text-xs text-right font-mono rounded-none"
                                    />
                                </div>
                                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                    <span>Total Tagihan (PO):</span>
                                    <span className="font-mono text-base text-blue-600 dark:text-blue-400">{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-4 py-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                            <Link to="/inventory/purchases">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none font-medium"
                                >
                                    Batal
                                </Button>
                            </Link>
                            <Can permission="inventory.purchases.create">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>{submitting ? 'Menyimpan...' : 'Simpan Draft PO'}</span>
                                </Button>
                            </Can>
                        </div>

                    </form>

                </div>
            </div>
        </AppLayout>
    );
};

export default InventoryPurchaseCreate;
