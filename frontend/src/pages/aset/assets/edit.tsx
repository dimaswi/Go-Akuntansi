import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { assetApi, AssetCategory } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import {
    Boxes,
    ArrowLeft,
    Save,
    Tag,
    Calculator,
    MapPin,
    FileText,
    RefreshCw,
} from 'lucide-react';

export const AssetEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState({
        code: '',
        name: '',
        category_id: '',
        barcode: '',
        serial_number: '',
        brand: '',
        model: '',
        purchase_date: '',
        purchase_cost: '',
        residual_value: '0',
        useful_life_months: '48',
        depreciation_method: 'straight_line',
        depreciation_rate: '25',
        condition: 'GOOD',
        status: 'ACTIVE',
        department_id: '',
        location: '',
        assigned_to: '',
        vendor_supplier: '',
        invoice_number: '',
        notes: '',
    });

    useEffect(() => {
        const initData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [assetRes, catRes, deptRes] = await Promise.all([
                    assetApi.getAsset(id),
                    assetApi.getCategories(),
                    api.get('/departments').catch(() => ({ data: { data: [] } })),
                ]);

                if (catRes.data?.success) {
                    setCategories(catRes.data.data || []);
                }
                const deptData = deptRes.data?.data || deptRes.data || [];
                if (Array.isArray(deptData)) {
                    setDepartments(deptData);
                }

                if (assetRes.data?.success) {
                    const a = assetRes.data.data;
                    setForm({
                        code: a.code || '',
                        name: a.name || '',
                        category_id: String(a.category_id || ''),
                        barcode: a.barcode || '',
                        serial_number: a.serial_number || '',
                        brand: a.brand || '',
                        model: a.model || '',
                        purchase_date: a.purchase_date ? a.purchase_date.slice(0, 10) : '',
                        purchase_cost: String(a.purchase_cost || ''),
                        residual_value: String(a.residual_value || 0),
                        useful_life_months: String(a.useful_life_months || 48),
                        depreciation_method: a.depreciation_method || 'straight_line',
                        depreciation_rate: String(a.depreciation_rate || 0),
                        condition: a.condition || 'GOOD',
                        status: a.status || 'ACTIVE',
                        department_id: a.department_id ? String(a.department_id) : '',
                        location: a.location || '',
                        assigned_to: a.assigned_to || '',
                        vendor_supplier: a.vendor_supplier || '',
                        invoice_number: a.invoice_number || '',
                        notes: a.notes || '',
                    });
                }
            } catch (err) {
                toast.error('Gagal memuat detail aset tetap');
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!form.name.trim()) {
            toast.error('Nama aset wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const payload: any = {
                code: form.code,
                name: form.name,
                category_id: Number(form.category_id),
                barcode: form.barcode,
                serial_number: form.serial_number,
                brand: form.brand,
                model: form.model,
                purchase_date: form.purchase_date,
                purchase_cost: Number(form.purchase_cost),
                residual_value: Number(form.residual_value || 0),
                useful_life_months: Number(form.useful_life_months || 48),
                depreciation_method: form.depreciation_method,
                depreciation_rate: Number(form.depreciation_rate || 0),
                condition: form.condition,
                status: form.status,
                department_id: form.department_id ? Number(form.department_id) : null,
                location: form.location,
                assigned_to: form.assigned_to,
                vendor_supplier: form.vendor_supplier,
                invoice_number: form.invoice_number,
                notes: form.notes,
            };

            await assetApi.updateAsset(id, payload);
            toast.success('Perubahan aset tetap berhasil disimpan');
            navigate(`/aset/assets/${id}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal memperbarui aset tetap');
        } finally {
            setSubmitting(false);
        }
    };

    const categoryOptions = [
        { value: '', label: '-- Pilih Kategori Aset --' },
        ...categories.map((c) => {
            const years = c.default_useful_life_years || (c.useful_life_months ? Math.round(c.useful_life_months / 12) : 0);
            return {
                value: String(c.id),
                label: `${c.code} - ${c.name}${years > 0 ? ` (${years} Thn)` : ''}`,
            };
        }),
    ];

    const departmentOptions = [
        { value: '', label: '-- Pilih Departemen / Unit --' },
        ...departments.map((d) => ({
            value: String(d.id),
            label: `${d.code ? d.code + ' - ' : ''}${d.name}`,
        })),
    ];

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Daftar Aset', href: '/aset/assets' },
        { title: form.code ? `Edit: ${form.code}` : 'Edit Aset' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat data aset tetap...
                </div>
            </AppLayout>
        );
    }

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
                            <Link to={`/aset/assets/${id}`}>
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
                                <Boxes className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Edit Aset: {form.code || form.name}
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Perbarui spesifikasi, lokasi fisik, penanggung jawab, atau status kondisi
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        {/* Section 1: Identitas Pokok */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Tag className="size-3.5 text-neutral-600" />
                                    <span>1. Identitas Pokok & Klasifikasi</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Kode Aset
                                    </label>
                                    <Input
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nama Aset <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="h-8 text-xs rounded-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Kategori Aset <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        value={form.category_id}
                                        onChange={(val) => setForm({ ...form, category_id: val })}
                                        options={categoryOptions}
                                        placeholder="Pilih kategori..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Kondisi Fisik
                                    </label>
                                    <SearchableSelect
                                        value={form.condition}
                                        onChange={(val) => setForm({ ...form, condition: val })}
                                        options={[
                                            { value: 'EXCELLENT', label: 'Sangat Baik' },
                                            { value: 'GOOD', label: 'Baik' },
                                            { value: 'FAIR', label: 'Cukup' },
                                            { value: 'POOR', label: 'Kurang / Perlu Perbaikan' },
                                            { value: 'DAMAGED', label: 'Rusak Berat' },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Status Operasional
                                    </label>
                                    <SearchableSelect
                                        value={form.status}
                                        onChange={(val) => setForm({ ...form, status: val })}
                                        options={[
                                            { value: 'ACTIVE', label: 'Aktif (Operasional)' },
                                            { value: 'MAINTENANCE', label: 'Dalam Pemeliharaan' },
                                            { value: 'DISPOSED', label: 'Dihapuskan' },
                                            { value: 'TRANSFERRED', label: 'Dimutasi' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Merk / Brand
                                    </label>
                                    <Input
                                        value={form.brand}
                                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tipe / Model
                                    </label>
                                    <Input
                                        value={form.model}
                                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nomor Seri (SN)
                                    </label>
                                    <Input
                                        value={form.serial_number}
                                        onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Barcode / Label
                                    </label>
                                    <Input
                                        value={form.barcode}
                                        onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Nilai Perolehan & Parameter Depresiasi */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Calculator className="size-3.5 text-neutral-600" />
                                    <span>2. Nilai Perolehan & Parameter Penyusutan</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tanggal Perolehan
                                    </label>
                                    <Input
                                        type="date"
                                        value={form.purchase_date}
                                        onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Harga Perolehan (Rp)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={form.purchase_cost}
                                        onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono font-semibold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nilai Sisa / Residu (Rp)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={form.residual_value}
                                        onChange={(e) => setForm({ ...form, residual_value: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Metode Penyusutan
                                    </label>
                                    <SearchableSelect
                                        value={form.depreciation_method}
                                        onChange={(val) => setForm({ ...form, depreciation_method: val })}
                                        options={[
                                            { value: 'straight_line', label: 'Garis Lurus (Straight Line)' },
                                            { value: 'declining_balance', label: 'Saldo Menurun (Declining)' },
                                            { value: 'double_declining', label: 'Saldo Menurun Ganda' },
                                            { value: 'sum_of_years_digits', label: 'Jumlah Angka Tahun' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Masa Manfaat (Bulan)
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.useful_life_months}
                                        onChange={(e) => setForm({ ...form, useful_life_months: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tarif Penyusutan Tahunan (%)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.depreciation_rate}
                                        onChange={(e) => setForm({ ...form, depreciation_rate: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Penempatan */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <MapPin className="size-3.5 text-neutral-600" />
                                    <span>3. Penempatan Lokasi & Penanggung Jawab</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Departemen / Unit Pemilik
                                    </label>
                                    <SearchableSelect
                                        value={form.department_id}
                                        onChange={(val) => setForm({ ...form, department_id: val })}
                                        options={departmentOptions}
                                        placeholder="Pilih departemen..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Lokasi Fisik
                                    </label>
                                    <Input
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Penanggung Jawab (PIC)
                                    </label>
                                    <Input
                                        value={form.assigned_to}
                                        onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Catatan & Supplier */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-neutral-600" />
                                    <span>4. Informasi Pengadaan & Catatan</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Vendor / Supplier
                                    </label>
                                    <Input
                                        value={form.vendor_supplier}
                                        onChange={(e) => setForm({ ...form, vendor_supplier: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nomor Faktur / Invoice
                                    </label>
                                    <Input
                                        value={form.invoice_number}
                                        onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows={2}
                                    className="w-full text-xs p-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Link to={`/aset/assets/${id}`}>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.assets.edit">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default AssetEdit;
