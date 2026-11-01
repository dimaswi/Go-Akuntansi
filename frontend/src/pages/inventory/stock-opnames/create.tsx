import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckSquare, Save } from 'lucide-react';
import { Can } from '@/components/can';

export const StockOpnameCreate: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [departmentId, setDepartmentId] = useState<number | ''>('');
    const [opnameDate, setOpnameDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);
                const res = await inventoryApi.getDepartments();
                if (res.data?.success) {
                    setDepartments(res.data.data || []);
                }
            } catch {
                toast.error('Gagal memuat daftar unit/departemen');
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                department_id: departmentId ? Number(departmentId) : null,
                opname_date: opnameDate,
                notes,
            };

            const res = await inventoryApi.createStockOpname(payload);
            toast.success('Sesi Stock Opname berhasil dibuat');
            if (res.data?.data?.id) {
                navigate(`/inventory/stock-opnames/${res.data.data.id}`);
            } else {
                navigate('/inventory/stock-opnames');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal membuat sesi stock opname');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat formulir stock opname...
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
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Mulai Sesi Stock Opname Fisik
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Perhitungan Fisik & Rekonsiliasi Saldo Persediaan Real-time</span>
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
                                    Lokasi Gudang / Unit Opname
                                </Label>
                                <NativeSearchableSelect
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                >
                                    <option value="">[Gudang Pusat Logistik]</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                                <p className="text-[11px] text-neutral-500 mt-1">
                                    Kosongkan jika perhitungan opname untuk Gudang Utama / Logistik Pusat.
                                </p>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Tanggal Pelaksanaan Opname <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={opnameDate}
                                    onChange={(e) => setOpnameDate(e.target.value)}
                                    className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Catatan / Tim Penghitung Fisik
                            </Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Tim Opname A - Farmasi, Cut-off jam 22.00 WIB..."
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
                            onClick={() => navigate('/inventory/stock-opnames')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission="inventory.stock-opnames.create">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{saving ? 'Menyimpan...' : 'Buka Lembar Opname'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};
export default StockOpnameCreate;
