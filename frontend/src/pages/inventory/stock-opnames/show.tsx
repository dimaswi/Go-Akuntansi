import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, StockOpname } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, CheckSquare, CheckCircle2, Package, Save } from 'lucide-react';
import { Can } from '@/components/can';

interface OpnameItemCount {
    item_id: number;
    code: string;
    name: string;
    unit: string;
    system_stock: number;
    physical_stock: number;
    unit_cost: number;
    notes?: string;
}

export const StockOpnameShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [opname, setOpname] = useState<StockOpname | null>(null);
    const [counts, setCounts] = useState<OpnameItemCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [opnRes, itemsRes] = await Promise.all([
                inventoryApi.getStockOpname(id),
                inventoryApi.getItems({ per_page: 200 }),
            ]);

            if (opnRes.data?.success) {
                const opn = opnRes.data.data;
                setOpname(opn);

                // If opname already has recorded items
                if (opn.items && opn.items.length > 0) {
                    setCounts(
                        opn.items.map((it: any) => ({
                            item_id: it.item_id,
                            code: it.item?.code || '',
                            name: it.item?.name || `Item #${it.item_id}`,
                            unit: it.item?.unit_of_measure || 'Unit',
                            system_stock: Number(it.system_quantity ?? it.system_stock ?? 0),
                            physical_stock: Number(it.physical_quantity ?? it.physical_stock ?? 0),
                            unit_cost: Number(it.unit_price ?? it.unit_cost ?? 0),
                            notes: it.notes || '',
                        }))
                    );
                } else if (itemsRes.data?.success) {
                    // Populate from system stock for new session
                    const allItems = itemsRes.data.data || [];
                    setCounts(
                        allItems.map((it: any) => ({
                            item_id: it.id,
                            code: it.code,
                            name: it.name,
                            unit: it.unit_of_measure,
                            system_stock: Number(it.total_stock || 0),
                            physical_stock: Number(it.total_stock || 0),
                            unit_cost: Number(it.last_purchase_cost || it.standard_cost || 0),
                            notes: '',
                        }))
                    );
                }
            }
        } catch {
            toast.error('Gagal memuat lembar kerja stock opname');
            navigate('/inventory/stock-opnames');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleCountChange = (idx: number, val: number) => {
        const updated = [...counts];
        updated[idx].physical_stock = val;
        setCounts(updated);
    };

    const handleNotesChange = (idx: number, val: string) => {
        const updated = [...counts];
        updated[idx].notes = val;
        setCounts(updated);
    };

    const handleComplete = async () => {
        if (!id) return;
        try {
            setCompleting(true);
            const payload = {
                counts: counts.map((c) => ({
                    item_id: c.item_id,
                    physical_stock: Number(c.physical_stock),
                    notes: c.notes || '',
                })),
            };

            await inventoryApi.completeStockOpname(id, payload);
            toast.success('Stock opname berhasil diselesaikan dan stok fisik telah diselaraskan');
            setShowCompleteConfirm(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyelesaikan stock opname');
        } finally {
            setCompleting(false);
        }
    };

    const formatCurrency = (val: number | string | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    if (loading || !opname) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat lembar kerja perhitungan fisik opname...
                </div>
            </AppLayout>
        );
    }

    const isCompleted = opname.status === 'completed';

    // Summary calculations
    const totalVariansValue = counts.reduce((sum, c) => {
        const diff = c.physical_stock - c.system_stock;
        return sum + diff * c.unit_cost;
    }, 0);

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
                                onClick={() => navigate('/inventory/stock-opnames')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <CheckSquare className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white font-mono">
                                            {opname.opname_number}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            isCompleted
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200'
                                        }`}>
                                            {opname.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Tanggal: {opname.opname_date?.split('T')[0]}</span>
                                        <span>•</span>
                                        <span>Lokasi: {opname.department?.name || 'Gudang Pusat Logistik'}</span>
                                        <span>•</span>
                                        <span>{counts.length} Item Dihitung</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isCompleted && (
                                <Can permission={['inventory.stock-opnames.approve', 'inventory.stock-opnames.submit', 'inventory.stock-opnames.update-counts']}>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowCompleteConfirm(true)}
                                        disabled={completing}
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>{completing ? 'Menyimpan...' : 'Selesaikan & Sesuaikan Fisik'}</span>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs">
                        <div>
                            <span className="text-neutral-500 block text-[11px]">Total Item Dihitung:</span>
                            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">{counts.length} SKU</span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block text-[11px]">Instruksi / Catatan:</span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{opname.notes || '-'}</span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block text-[11px]">Total Selisih Finansial:</span>
                            <span className={`font-mono font-bold text-sm ${totalVariansValue < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {formatCurrency(totalVariansValue)}
                            </span>
                        </div>
                    </div>

                    {/* Physical Count Sheet Table */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                                    <th className="py-2.5 px-3 w-36">Kode SKU</th>
                                    <th className="py-2.5 px-3">Nama Barang</th>
                                    <th className="py-2.5 px-3 text-right">Stok Sistem</th>
                                    <th className="py-2.5 px-3 w-32 text-right">Hitungan Fisik</th>
                                    <th className="py-2.5 px-3 text-right">Selisih (+/-)</th>
                                    <th className="py-2.5 px-3 text-right">Nilai Selisih (Rp)</th>
                                    <th className="py-2.5 px-3">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {counts.map((c, idx) => {
                                    const diff = c.physical_stock - c.system_stock;
                                    const valDiff = diff * c.unit_cost;
                                    return (
                                        <tr key={c.item_id || idx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                            <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">{idx + 1}</td>
                                            <td className="py-2 px-3">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {c.code}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">{c.name}</td>
                                            <td className="py-2 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">
                                                {c.system_stock} {c.unit}
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                                {isCompleted ? (
                                                    <span className="font-mono font-bold">{c.physical_stock} {c.unit}</span>
                                                ) : (
                                                    <Input
                                                        type="number"
                                                        value={c.physical_stock}
                                                        onChange={(e) => handleCountChange(idx, Number(e.target.value))}
                                                        className="h-8 text-xs text-right font-mono font-bold rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                                    />
                                                )}
                                            </td>
                                            <td className={`py-2 px-4 text-right font-mono font-bold ${
                                                diff < 0 ? 'text-red-600' : diff > 0 ? 'text-emerald-600' : 'text-neutral-400'
                                            }`}>
                                                {diff > 0 ? `+${diff}` : diff} {c.unit}
                                            </td>
                                            <td className={`py-2 px-4 text-right font-mono ${
                                                valDiff < 0 ? 'text-red-600' : valDiff > 0 ? 'text-emerald-600' : 'text-neutral-400'
                                            }`}>
                                                {formatCurrency(valDiff)}
                                            </td>
                                            <td className="py-2 px-4">
                                                {isCompleted ? (
                                                    <span className="text-neutral-500">{c.notes || '-'}</span>
                                                ) : (
                                                    <Input
                                                        value={c.notes || ''}
                                                        onChange={(e) => handleNotesChange(idx, e.target.value)}
                                                        placeholder="Catatan..."
                                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showCompleteConfirm}
                onOpenChange={setShowCompleteConfirm}
                title="Selesaikan Stock Opname"
                description="Apakah Anda yakin ingin menyelesaikan sesi stock opname ini? Saldo stok fisik akan disesuaikan otomatis berdasarkan hasil hitungan."
                confirmText="Selesaikan & Sesuaikan"
                variant="default"
                onConfirm={handleComplete}
                loading={completing}
            />
        </AppLayout>
    );
};
export default StockOpnameShow;
