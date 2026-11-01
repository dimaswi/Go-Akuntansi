import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Item } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, Plus, Trash2, Save } from 'lucide-react';
import { Can } from '@/components/can';

interface RequestLine {
    item_id: number;
    quantity_requested: number;
    notes?: string;
}

export const StockRequestCreate: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [departmentId, setDepartmentId] = useState<number | ''>('');
    const [priority, setPriority] = useState<string>('normal');
    const [purpose, setPurpose] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [lines, setLines] = useState<RequestLine[]>([{ item_id: 0, quantity_requested: 1, notes: '' }]);

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
                    if (deptRes.data.data?.length > 0) {
                        setDepartmentId(deptRes.data.data[0].id);
                    }
                }
                if (itemRes.data?.success) {
                    setItems(itemRes.data.data || []);
                }
            } catch {
                toast.error('Gagal memuat data pendukung');
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
    }, []);

    const addLine = () => {
        setLines([...lines, { item_id: 0, quantity_requested: 1, notes: '' }]);
    };

    const removeLine = (idx: number) => {
        if (lines.length <= 1) {
            toast.error('Minimal harus ada satu barang yang diminta');
            return;
        }
        setLines(lines.filter((_, i) => i !== idx));
    };

    const updateLine = (idx: number, field: keyof RequestLine, val: any) => {
        const updated = [...lines];
        updated[idx] = { ...updated[idx], [field]: val };
        setLines(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!departmentId) {
            toast.error('Silakan pilih unit kerja / departemen pemohon');
            return;
        }
        if (lines.some((l) => !l.item_id || l.quantity_requested <= 0)) {
            toast.error('Semua baris barang harus dipilih dan memiliki kuantiti valid');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                department_id: Number(departmentId),
                priority,
                purpose,
                notes,
                items: lines.map((l) => ({
                    item_id: Number(l.item_id),
                    quantity_requested: Number(l.quantity_requested),
                    notes: l.notes || '',
                })),
            };

            await inventoryApi.createStockRequest(payload);
            toast.success('Permintaan stok berhasil diajukan');
            navigate('/inventory/stock-requests');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengajukan permintaan stok');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data amprahan stok...
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
                                onClick={() => navigate('/inventory/stock-requests')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <ClipboardList className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Buat Permintaan Stok Unit (Amprahan)
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Pengajuan Logistik / BHP / Obat dari Unit Kerja ke Gudang Pusat</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Unit Kerja Pemohon <span className="text-red-500">*</span>
                                </Label>
                                <NativeSearchableSelect
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Pilih Departemen --</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Tingkat Prioritas
                                </Label>
                                <NativeSearchableSelect
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                >
                                    <option value="low">Rendah (Low)</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">Tinggi (High)</option>
                                    <option value="urgent">Mendesak (Cito / Urgent)</option>
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Tujuan / Keperluan Amprahan
                                </Label>
                                <Input
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Contoh: Stok operasional mingguan, tindakan operasi..."
                                    className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="w-full">
                            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                    Daftar Barang yang Diminta
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addLine}
                                    className="h-7 text-[11px] rounded-none border-neutral-200 dark:border-neutral-800 gap-1"
                                >
                                    <Plus className="size-3" /> Tambah Barang
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/70 font-semibold text-neutral-600 dark:text-neutral-400 uppercase text-[11px]">
                                            <th className="py-2 px-4 w-10 text-center">#</th>
                                            <th className="py-2 px-4">Nama Barang / Obat</th>
                                            <th className="py-2 px-4 w-32 text-right">Sisa Stok Gudang</th>
                                            <th className="py-2 px-4 w-32 text-right">Kuantiti Diminta</th>
                                            <th className="py-2 px-4">Catatan / Alasan Khusus</th>
                                            <th className="py-2 px-4 w-12 text-center">Hapus</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {lines.map((l, idx) => {
                                            const selItem = items.find((it) => it.id === Number(l.item_id));
                                            const stockVal = Number(selItem?.total_stock || 0);
                                            const isLow = stockVal <= 0;

                                            return (
                                                <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                    <td className="py-2 px-4 text-center text-neutral-400 font-mono">{idx + 1}</td>
                                                    <td className="py-2 px-4">
                                                        <NativeSearchableSelect
                                                            value={l.item_id}
                                                            onChange={(e) => updateLine(idx, 'item_id', Number(e.target.value))}
                                                            className="w-full h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                                            required
                                                        >
                                                            <option value={0}>-- Pilih Barang --</option>
                                                            {items.map((it) => (
                                                                <option key={it.id} value={it.id}>
                                                                    [{it.code}] {it.name} - Stok Gudang: {Number(it.total_stock || 0)} {it.unit_of_measure}
                                                                </option>
                                                            ))}
                                                        </NativeSearchableSelect>
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono">
                                                        {selItem ? (
                                                            <span className={`font-semibold px-1.5 py-0.5 text-xs ${isLow ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200' : 'text-neutral-800 dark:text-neutral-200'}`}>
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
                                                            value={l.quantity_requested}
                                                            onChange={(e) => updateLine(idx, 'quantity_requested', Number(e.target.value))}
                                                            className="h-8 text-xs text-right rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <Input
                                                            value={l.notes || ''}
                                                            onChange={(e) => updateLine(idx, 'notes', e.target.value)}
                                                            placeholder="Keterangan per baris..."
                                                            className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeLine(idx)}
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-none"
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
                    </div>

                    {/* Card Footer: Actions */}
                    <div className="px-4 py-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/inventory/stock-requests')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission="inventory.stock-requests.create">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{saving ? 'Mengirim...' : 'Kirim Pengajuan Amprahan'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};
export default StockRequestCreate;
