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
import {
    Boxes,
    ArrowLeft,
    Save,
    Tag,
    Calculator,
    MapPin,
    FileText,
} from 'lucide-react';

interface DepartmentOption {
    id: number;
    code?: string;
    name: string;
}

export const AssetCreate: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
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
        purchase_date: new Date().toISOString().split('T')[0],
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
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [catRes, deptRes] = await Promise.all([
                    assetApi.getCategories(),
                    api.get('/departments'),
                ]);

                if (catRes.data?.success) {
                    setCategories(catRes.data.data || []);
                }
                if (deptRes.data) {
                    const dData = deptRes.data.data || deptRes.data;
                    if (Array.isArray(dData)) {
                        setDepartments(dData);
                    }
                }
            } catch (err) {
                toast.error('Gagal memuat data master (kategori/departemen)');
            } finally {
                setLoading(false);
            }
        };

        fetchDependencies();
    }, []);

    // When category changes, auto-fill useful life and depreciation method
    const handleCategoryChange = (catId: string) => {
        const selected = categories.find((c) => String(c.id) === catId);
        if (selected) {
            const years = selected.default_useful_life_years || (selected.useful_life_months ? Math.round(selected.useful_life_months / 12) : 4);
            const months = selected.useful_life_months || (years * 12);
            const method = selected.default_depreciation_method || selected.depreciation_method || 'straight_line';
            const rate = selected.depreciation_rate || (years > 0 ? (100 / years).toFixed(1) : '25');

            setForm((prev) => ({
                ...prev,
                category_id: catId,
                useful_life_months: String(months),
                depreciation_method: method,
                depreciation_rate: String(rate),
            }));
        } else {
            setForm((prev) => ({ ...prev, category_id: catId }));
        }
    };

    const handleUsefulLifeChange = (months: string) => {
        const m = Number(months) || 0;
        const years = m / 12;
        const rate = years > 0 ? (100 / years).toFixed(1) : '0';
        setForm((prev) => ({
            ...prev,
            useful_life_months: months,
            depreciation_rate: rate,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Nama aset wajib diisi');
            return;
        }
        if (!form.category_id) {
            toast.error('Kategori aset wajib dipilih');
            return;
        }
        if (!form.purchase_cost || Number(form.purchase_cost) <= 0) {
            toast.error('Harga perolehan harus lebih dari 0');
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

            const res = await assetApi.createAsset(payload);
            if (res.data?.success) {
                toast.success('Aset tetap berhasil didaftarkan');
                navigate('/aset/assets');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan aset tetap');
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
        { title: 'Registrasi Aset Baru' },
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
                            <Link to="/aset/assets">
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
                                    Registrasi Aset Tetap Baru
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Pencatatan data master aset, spesifikasi, dan parameter amortisasi penyusutan
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        {/* Section 1: Identitas Pokok & Klasifikasi */}
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
                                        Kode Aset (Opsional)
                                    </label>
                                    <Input
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        placeholder="Otomatis (AST-YYYYMM-XXXX)..."
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                                        Kosongkan untuk penomoran otomatis
                                    </span>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nama Aset Tetap <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Contoh: USG 4D General Electric Voluson E8"
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
                                        onChange={handleCategoryChange}
                                        options={categoryOptions}
                                        placeholder="Pilih kategori..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Kondisi Fisik Saat Masuk
                                    </label>
                                    <SearchableSelect
                                        value={form.condition}
                                        onChange={(val) => setForm({ ...form, condition: val })}
                                        options={[
                                            { value: 'EXCELLENT', label: 'Sangat Baik (Baru)' },
                                            { value: 'GOOD', label: 'Baik (Operasional)' },
                                            { value: 'FAIR', label: 'Cukup / Aus Wajar' },
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
                                            { value: 'ACTIVE', label: 'Aktif (Siap Pakai / Beroperasi)' },
                                            { value: 'MAINTENANCE', label: 'Dalam Pemeliharaan / Servis' },
                                            { value: 'DISPOSED', label: 'Dihapuskan / Dijual' },
                                            { value: 'TRANSFERRED', label: 'Dimutasi Antar Cabang' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Merk / Pabrikan
                                    </label>
                                    <Input
                                        value={form.brand}
                                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                        placeholder="Contoh: Toyota / GE / Dell"
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
                                        placeholder="Contoh: Innova 2.0 V / Latitude 5420"
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nomor Seri / Pabrik (SN)
                                    </label>
                                    <Input
                                        value={form.serial_number}
                                        onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                                        placeholder="SN-1234567890..."
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Barcode / QR Code Tag
                                    </label>
                                    <Input
                                        value={form.barcode}
                                        onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                                        placeholder="Scan barcode label..."
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
                                        Tanggal Perolehan <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={form.purchase_date}
                                        onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                                        required
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Harga Perolehan (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={form.purchase_cost}
                                        onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                                        placeholder="0"
                                        required
                                        className="h-8 text-xs rounded-none font-mono font-semibold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Estimasi Nilai Sisa / Residu (Rp)
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
                                        Masa Manfaat (Bulan) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.useful_life_months}
                                        onChange={(e) => handleUsefulLifeChange(e.target.value)}
                                        className="h-8 text-xs rounded-none font-mono"
                                        required
                                    />
                                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                                        Setara dengan {Math.round((Number(form.useful_life_months) / 12) * 10) / 10} Tahun
                                    </span>
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

                        {/* Section 3: Penempatan & Tanggung Jawab */}
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
                                        Lokasi Fisik / Ruangan
                                    </label>
                                    <Input
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        placeholder="Contoh: Gedung A Lt. 2 R. Radiologi"
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Pegawai Penanggung Jawab (PIC)
                                    </label>
                                    <Input
                                        value={form.assigned_to}
                                        onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                                        placeholder="Nama petugas / dokter penanggung jawab..."
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Catatan & Informasi Pengadaan */}
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
                                        placeholder="Nama supplier atau penyedia..."
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nomor Faktur / Invoice Pengadaan
                                    </label>
                                    <Input
                                        value={form.invoice_number}
                                        onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                                        placeholder="INV/PO/2026/..."
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
                                    placeholder="Kelengkapan aksesoris, garansi, catatan kondisi khusus..."
                                    className="w-full text-xs p-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Link to="/aset/assets">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.assets.create">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan Aset'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default AssetCreate;
