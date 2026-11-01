import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { assetApi, AssetCategory } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import { DollarSign, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

interface BudgetItemRow {
    item_name: string;
    category_id: string;
    specification: string;
    quantity: number;
    estimated_cost: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const AssetBudgetCreate: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState<{
        fiscal_year: number;
        budget_code: string;
        name: string;
        department_id: string;
        notes: string;
        items: BudgetItemRow[];
    }>({
        fiscal_year: new Date().getFullYear(),
        budget_code: '',
        name: '',
        department_id: '',
        notes: '',
        items: [
            {
                item_name: '',
                category_id: '',
                specification: '',
                quantity: 1,
                estimated_cost: 0,
                priority: 'HIGH',
            },
        ],
    });

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [deptRes, catRes] = await Promise.all([
                    api.get('/departments'),
                    assetApi.getCategories(),
                ]);

                const dData = deptRes.data?.data || deptRes.data || [];
                if (Array.isArray(dData)) {
                    setDepartments(dData);
                }
                if (catRes.data?.success) {
                    setCategories(catRes.data.data || []);
                }
            } catch (err) {
                toast.error('Gagal memuat departemen atau kategori');
            } finally {
                setLoading(false);
            }
        };

        fetchDependencies();
    }, []);

    const addItem = () => {
        setForm((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    item_name: '',
                    category_id: '',
                    specification: '',
                    quantity: 1,
                    estimated_cost: 0,
                    priority: 'MEDIUM',
                },
            ],
        }));
    };

    const removeItem = (idx: number) => {
        if (form.items.length <= 1) return;
        setForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx),
        }));
    };

    const updateItem = (idx: number, field: keyof BudgetItemRow, val: any) => {
        setForm((prev) => {
            const next = [...prev.items];
            next[idx] = { ...next[idx], [field]: val };
            return { ...prev, items: next };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Nama anggaran wajib diisi');
            return;
        }

        const validItems = form.items.filter((it) => it.item_name.trim() !== '');
        if (validItems.length === 0) {
            toast.error('Minimal 1 item barang yang dianggarkan');
            return;
        }

        try {
            setSubmitting(true);
            const total = validItems.reduce(
                (sum, it) => sum + Number(it.quantity || 1) * Number(it.estimated_cost || 0),
                0
            );

            const payload: any = {
                fiscal_year: Number(form.fiscal_year),
                code: form.budget_code,
                budget_code: form.budget_code,
                title: form.name,
                name: form.name,
                budget_name: form.name,
                department_id: form.department_id ? Number(form.department_id) : null,
                total_budget: total,
                total_amount: total,
                status: 'DRAFT',
                notes: form.notes,
                items: validItems.map((it) => ({
                    name: it.item_name,
                    item_name: it.item_name,
                    category_id: it.category_id ? Number(it.category_id) : null,
                    specification: it.specification,
                    quantity: Number(it.quantity || 1),
                    estimated_price: Number(it.estimated_cost || 0),
                    estimated_cost: Number(it.estimated_cost || 0),
                    total_amount: Number(it.quantity || 1) * Number(it.estimated_cost || 0),
                    total_cost: Number(it.quantity || 1) * Number(it.estimated_cost || 0),
                    priority: it.priority,
                    status: 'DRAFT',
                })),
            };

            await assetApi.createBudget(payload);
            toast.success('Rencana Anggaran Biaya (RAB) Aset berhasil disimpan');
            navigate('/aset/budgets');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan RAB aset');
        } finally {
            setSubmitting(false);
        }
    };

    const departmentOptions = [
        { value: '', label: '-- Pilih Departemen / Unit Pengusul --' },
        ...departments.map((d) => ({
            value: String(d.id),
            label: `${d.code ? d.code + ' - ' : ''}${d.name}`,
        })),
    ];

    const formatCurrency = (val: number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const totalCalculated = form.items.reduce(
        (sum, it) => sum + Number(it.quantity || 1) * Number(it.estimated_cost || 0),
        0
    );

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'RAB (Anggaran)', href: '/aset/budgets' },
        { title: 'Penyusunan RAB Aset' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <form
                    onSubmit={handleSubmit}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none"
                >
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/aset/budgets">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <DollarSign className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Penyusunan Rencana Anggaran Biaya (RAB) Aset
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Usulan pengadaan belanja modal aset baru tahun anggaran
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        {/* Section 1: Informasi Umum Anggaran */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <DollarSign className="size-3.5 text-neutral-600" />
                                    <span>1. Informasi Umum Anggaran</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tahun Anggaran <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        value={form.fiscal_year}
                                        onChange={(e) => setForm({ ...form, fiscal_year: Number(e.target.value) })}
                                        required
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nama Usulan Anggaran <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Contoh: Pengadaan Alat Medis Ruang ICU TA 2026"
                                        required
                                        className="h-8 text-xs rounded-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Kode Anggaran (Opsional)
                                    </label>
                                    <Input
                                        value={form.budget_code}
                                        onChange={(e) => setForm({ ...form, budget_code: e.target.value })}
                                        placeholder="Otomatis jika kosong..."
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Departemen / Unit Pengusul
                                    </label>
                                    <SearchableSelect
                                        options={departmentOptions}
                                        value={form.department_id}
                                        onChange={(val) => setForm({ ...form, department_id: val })}
                                        placeholder="Pilih departemen..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Keterangan / Latar Belakang Kebutuhan
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows={2}
                                    placeholder="Justifikasi pengadaan dan urgensi kebutuhan..."
                                    className="w-full text-xs p-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Section 2: Rincian Item Barang yang Dianggarkan */}
                        <div>
                            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <DollarSign className="size-3.5 text-neutral-600" />
                                    <span>2. Rincian Item Barang Belanja Modal</span>
                                </h2>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="h-7 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 gap-1 px-2.5 shadow-none"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Baris</span>
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse border border-neutral-200 dark:border-neutral-800">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-10 text-center">No</th>
                                            <th className="py-2.5 px-3 min-w-[200px]">Nama Item Barang <span className="text-rose-500">*</span></th>
                                            <th className="py-2.5 px-3 min-w-[180px]">Spesifikasi / Merk</th>
                                            <th className="py-2.5 px-3 w-48">Kategori Aset</th>
                                            <th className="py-2.5 px-3 w-20 text-center">Qty <span className="text-rose-500">*</span></th>
                                            <th className="py-2.5 px-3 w-36 text-right">Estimasi Harga (Rp) <span className="text-rose-500">*</span></th>
                                            <th className="py-2.5 px-3 w-36 text-right">Subtotal (Rp)</th>
                                            <th className="py-2.5 px-3 w-36 text-center">Prioritas</th>
                                            <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {form.items.map((it, idx) => {
                                            const subtotal = Number(it.quantity || 1) * Number(it.estimated_cost || 0);

                                            return (
                                                <tr key={idx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <td className="py-2 px-3 text-center font-mono text-neutral-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <Input
                                                            value={it.item_name}
                                                            onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                                                            placeholder="Nama item barang..."
                                                            className="h-8 text-xs rounded-none font-medium shadow-none border-neutral-200 dark:border-neutral-800"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <Input
                                                            value={it.specification}
                                                            onChange={(e) => updateItem(idx, 'specification', e.target.value)}
                                                            placeholder="Spesifikasi / merk..."
                                                            className="h-8 text-xs rounded-none shadow-none border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <select
                                                            value={it.category_id}
                                                            onChange={(e) => updateItem(idx, 'category_id', e.target.value)}
                                                            className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 text-xs rounded-none shadow-none cursor-pointer font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                        >
                                                            <option value="">-- Pilih Kategori --</option>
                                                            {categories.map((c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={it.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                            className="h-8 text-xs rounded-none text-center font-mono w-full shadow-none border-neutral-200 dark:border-neutral-800"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={it.estimated_cost}
                                                            onChange={(e) => updateItem(idx, 'estimated_cost', Number(e.target.value))}
                                                            className="h-8 text-xs rounded-none text-right font-mono w-full shadow-none border-neutral-200 dark:border-neutral-800"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="h-8 flex items-center justify-end font-mono font-bold text-neutral-900 dark:text-white px-1">
                                                            {formatCurrency(subtotal)}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <select
                                                            value={it.priority}
                                                            onChange={(e) => updateItem(idx, 'priority', e.target.value as any)}
                                                            className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 text-xs rounded-none shadow-none cursor-pointer font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                        >
                                                            <option value="HIGH">Tinggi (Urgent)</option>
                                                            <option value="MEDIUM">Sedang</option>
                                                            <option value="LOW">Rendah</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => removeItem(idx)}
                                                                disabled={form.items.length <= 1}
                                                                className="size-8 rounded-none border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 p-0 shadow-none disabled:opacity-30"
                                                                title="Hapus baris"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 font-bold">
                                            <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                                Total Estimasi Pagu Anggaran (CAPEX):
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(totalCalculated)}
                                            </td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Link to="/aset/budgets">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.budgets.create">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan Usulan RAB'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default AssetBudgetCreate;
