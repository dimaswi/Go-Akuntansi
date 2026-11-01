import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, Asset } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import { Wrench, ArrowLeft, Save, FileText } from 'lucide-react';

export const AssetMaintenanceCreate: React.FC = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState({
        asset_id: '',
        maintenance_date: new Date().toISOString().split('T')[0],
        service_type: 'ROUTINE',
        description: '',
        cost: '',
        vendor_name: '',
        performed_by: '',
        status: 'SCHEDULED',
        next_maintenance_date: '',
        notes: '',
    });

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                setLoading(true);
                const res = await assetApi.getAssets({ per_page: 200 });
                if (res.data?.success) {
                    setAssets(res.data.data || []);
                }
            } catch (err) {
                toast.error('Gagal memuat daftar aset');
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.asset_id) {
            toast.error('Pilih aset yang akan diservis');
            return;
        }
        if (!form.service_type) {
            toast.error('Jenis servis wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const payload: any = {
                asset_id: Number(form.asset_id),
                maintenance_date: form.maintenance_date,
                service_type: form.service_type,
                description: form.description,
                cost: Number(form.cost || 0),
                vendor_name: form.vendor_name,
                performed_by: form.performed_by,
                status: form.status,
                next_maintenance_date: form.next_maintenance_date || null,
                notes: form.notes,
            };

            await assetApi.createMaintenance(payload);
            toast.success('Pemeliharaan aset berhasil dicatat');
            navigate('/aset/maintenances');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan pemeliharaan aset');
        } finally {
            setSubmitting(false);
        }
    };

    const assetOptions = [
        { value: '', label: '-- Pilih Aset --' },
        ...assets.map((a) => ({
            value: String(a.id),
            label: `${a.code} - ${a.name} (${a.location || 'Bebas'})`,
        })),
    ];

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Maintenance', href: '/aset/maintenances' },
        { title: 'Catat Pemeliharaan' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <form
                    onSubmit={handleSubmit}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none"
                >
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/aset/maintenances">
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
                                <Wrench className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Catat Pemeliharaan / Servis Aset
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Jadwalkan perbaikan, kalibrasi, servis berkala, atau penggantian komponen
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        {/* Section 1: Rincian Pekerjaan Servis */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Wrench className="size-3.5 text-neutral-600" />
                                    <span>1. Rincian Pekerjaan Servis</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Pilih Aset <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={assetOptions}
                                        value={form.asset_id}
                                        onChange={(val) => setForm({ ...form, asset_id: val })}
                                        placeholder="Pilih aset yang diservis..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tanggal Pemeliharaan <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={form.maintenance_date}
                                        onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })}
                                        required
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Kategori / Jenis Pemeliharaan <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        value={form.service_type}
                                        onChange={(val) => setForm({ ...form, service_type: val })}
                                        options={[
                                            { value: 'ROUTINE', label: 'Servis Berkala / Rutin' },
                                            { value: 'REPAIR', label: 'Perbaikan Kerusakan' },
                                            { value: 'CALIBRATION', label: 'Kalibrasi Teknis' },
                                            { value: 'INSPECTION', label: 'Inspeksi Kelaikan Fisik' },
                                            { value: 'UPGRADE', label: 'Peningkatan / Modifikasi' },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Status Pengerjaan
                                    </label>
                                    <SearchableSelect
                                        value={form.status}
                                        onChange={(val) => setForm({ ...form, status: val })}
                                        options={[
                                            { value: 'SCHEDULED', label: 'Terjadwal (Scheduled)' },
                                            { value: 'IN_PROGRESS', label: 'Sedang Dikerjakan' },
                                            { value: 'COMPLETED', label: 'Selesai (Completed)' },
                                            { value: 'CANCELLED', label: 'Dibatalkan' },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Biaya Servis / Penggantian (Rp)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={form.cost}
                                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                                        placeholder="0"
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nama Bengkel / Vendor / Penyedia Servis
                                    </label>
                                    <Input
                                        value={form.vendor_name}
                                        onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                                        placeholder="Contoh: Auto 2000 / CV Medika Servis..."
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Teknisi Pelaksana / PIC Internal
                                    </label>
                                    <Input
                                        value={form.performed_by}
                                        onChange={(e) => setForm({ ...form, performed_by: e.target.value })}
                                        placeholder="Nama staf pemeliharaan..."
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Deskripsi Pekerjaan / Temuan Kerusakan
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={2}
                                    placeholder="Rincian suku cadang yang diganti, tindakan teknis..."
                                    className="w-full text-xs p-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Target Pemeliharaan Berikutnya (Opsional)
                                    </label>
                                    <Input
                                        type="date"
                                        value={form.next_maintenance_date}
                                        onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Catatan / Garansi Servis
                                    </label>
                                    <Input
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Contoh: Garansi servis 30 hari..."
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Link to="/aset/maintenances">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.maintenances.create">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan Pemeliharaan'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default AssetMaintenanceCreate;
