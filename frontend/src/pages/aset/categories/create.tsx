import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { assetApi } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import { Tag, ArrowLeft, Save, Sliders, BookOpen } from 'lucide-react';

interface AccountOption {
    id: number;
    kode_akun: string;
    nama_akun: string;
}

export const AssetCategoryCreate: React.FC = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<AccountOption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState({
        code: '',
        name: '',
        description: '',
        useful_life_years: 4,
        depreciation_method: 'straight_line',
        salvage_percentage: 0,
        account_asset_id: '',
        account_depreciation_id: '',
        account_expense_id: '',
        is_active: true,
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                const accRes = await api.get('/daftar-akun');
                if (accRes.data) {
                    const accData = accRes.data.data || accRes.data;
                    if (Array.isArray(accData)) {
                        setAccounts(accData);
                    }
                }
            } catch (err) {
                toast.error('Gagal memuat daftar akun');
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Nama kategori wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const years = Number(form.useful_life_years) || 1;
            const payload: any = {
                code: form.code,
                name: form.name,
                description: form.description,
                default_useful_life_years: years,
                useful_life_months: years * 12,
                default_depreciation_method: form.depreciation_method,
                depreciation_method: form.depreciation_method,
                default_salvage_percentage: Number(form.salvage_percentage) || 0,
                depreciation_rate: Math.round(1000 / years) / 10,
                account_asset_id: form.account_asset_id ? Number(form.account_asset_id) : null,
                account_depreciation_id: form.account_depreciation_id ? Number(form.account_depreciation_id) : null,
                account_expense_id: form.account_expense_id ? Number(form.account_expense_id) : null,
                is_active: form.is_active,
            };

            await assetApi.createCategory(payload);
            toast.success('Kategori aset baru berhasil ditambahkan');
            navigate('/aset/categories');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan kategori aset');
        } finally {
            setSubmitting(false);
        }
    };

    const accountSelectOptions = [
        { value: '', label: '-- Tidak Terhubung --' },
        ...accounts.map((a) => ({
            value: String(a.id),
            label: `${a.kode_akun} - ${a.nama_akun}`,
        })),
    ];

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Kategori Aset', href: '/aset/categories' },
        { title: 'Tambah Kategori' },
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
                            <Link to="/aset/categories">
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
                                <Tag className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Tambah Kategori Aset Baru
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Klasifikasi aset, umur manfaat ekonomis, dan integrasi Chart of Accounts (COA)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout without nested cards */}
                    <div className="p-4 space-y-6 text-xs">
                        {/* Section 1: Informasi Kategori */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Tag className="size-3.5 text-neutral-600" />
                                    <span>1. Identitas Kategori</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Kode Kategori (Opsional)
                                    </label>
                                    <Input
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        placeholder="Otomatis jika dikosongkan..."
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                                        Contoh: CAT-001, CAT-MED, CAT-KND
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nama Kategori Aset <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Contoh: Kendaraan Operasional / Alat Medis Radiologi"
                                        required
                                        className="h-8 text-xs rounded-none font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Keterangan / Deskripsi
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={2}
                                    placeholder="Deskripsi atau rincian cakupan kelompok aset..."
                                    className="w-full text-xs p-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Section 2: Parameter Depresiasi Default */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Sliders className="size-3.5 text-neutral-600" />
                                    <span>2. Standar Kebijakan Depresiasi</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Masa Manfaat (Tahun) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={form.useful_life_years}
                                        onChange={(e) => setForm({ ...form, useful_life_years: Number(e.target.value) })}
                                        className="h-8 text-xs rounded-none font-mono"
                                        required
                                    />
                                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                                        Setara dengan {(Number(form.useful_life_years) || 0) * 12} bulan
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Metode Penyusutan Default
                                    </label>
                                    <SearchableSelect
                                        value={form.depreciation_method}
                                        onChange={(val) => setForm({ ...form, depreciation_method: val })}
                                        options={[
                                            { value: 'straight_line', label: 'Garis Lurus (Straight Line)' },
                                            { value: 'declining_balance', label: 'Saldo Menurun (Declining Balance)' },
                                            { value: 'double_declining', label: 'Saldo Menurun Ganda (Double Declining)' },
                                            { value: 'sum_of_years_digits', label: 'Jumlah Angka Tahun' },
                                            { value: 'service_hours', label: 'Jam Jasa (Service Hours)' },
                                            { value: 'productive_output', label: 'Satuan Hasil Produksi' },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Estimasi Nilai Residu (% dari Biaya Perolehan)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={form.salvage_percentage}
                                        onChange={(e) => setForm({ ...form, salvage_percentage: Number(e.target.value) })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                                        Tarif Penyusutan: {form.useful_life_years > 0 ? (100 / form.useful_life_years).toFixed(1) : 0}% / Tahun
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Integrasi Akun Akuntansi (COA) */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <BookOpen className="size-3.5 text-neutral-600" />
                                    <span>3. Integrasi Akun Buku Besar (COA)</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Akun Aset Tetap
                                    </label>
                                    <SearchableSelect
                                        value={form.account_asset_id}
                                        onChange={(val) => setForm({ ...form, account_asset_id: val })}
                                        options={accountSelectOptions}
                                        placeholder="Pilih akun aset..."
                                    />
                                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                                        Debit saat perolehan/pembelian aset
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Akun Akumulasi Penyusutan
                                    </label>
                                    <SearchableSelect
                                        value={form.account_depreciation_id}
                                        onChange={(val) => setForm({ ...form, account_depreciation_id: val })}
                                        options={accountSelectOptions}
                                        placeholder="Pilih akun akumulasi..."
                                    />
                                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                                        Kredit saat jurnal periodik penyusutan
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Akun Beban Penyusutan
                                    </label>
                                    <SearchableSelect
                                        value={form.account_expense_id}
                                        onChange={(val) => setForm({ ...form, account_expense_id: val })}
                                        options={accountSelectOptions}
                                        placeholder="Pilih akun beban..."
                                    />
                                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                                        Debit saat jurnal periodik penyusutan
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="rounded-none border-neutral-300 text-neutral-900 focus:ring-0"
                                />
                                <label htmlFor="is_active" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                                    Status Kategori Aktif (Dapat dipilih saat pendaftaran aset baru)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Link to="/aset/categories">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.categories.create">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan Kategori'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default AssetCategoryCreate;
