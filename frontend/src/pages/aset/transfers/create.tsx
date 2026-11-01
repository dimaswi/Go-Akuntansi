import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { assetApi, Asset } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import { ArrowRightLeft, ArrowLeft, Save } from 'lucide-react';

export const AssetTransferCreate: React.FC = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState({
        asset_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        from_department_id: '',
        to_department_id: '',
        from_location: '',
        to_location: '',
        reason: '',
        received_by: '',
        notes: '',
    });

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                setLoading(true);
                const [assetRes, deptRes] = await Promise.all([
                    assetApi.getAssets({ per_page: 200, status: 'ACTIVE' }),
                    api.get('/departments'),
                ]);

                if (assetRes.data?.success) {
                    setAssets(assetRes.data.data || []);
                }
                const dData = deptRes.data?.data || deptRes.data || [];
                if (Array.isArray(dData)) {
                    setDepartments(dData);
                }
            } catch (err) {
                toast.error('Gagal memuat daftar aset atau departemen');
            } finally {
                setLoading(false);
            }
        };

        fetchDependencies();
    }, []);

    const handleAssetChange = (assetId: string) => {
        const selected = assets.find((a) => String(a.id) === assetId);
        if (selected) {
            setForm((prev) => ({
                ...prev,
                asset_id: assetId,
                from_department_id: selected.department_id ? String(selected.department_id) : '',
                from_location: selected.location || '',
            }));
        } else {
            setForm((prev) => ({ ...prev, asset_id: assetId }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.asset_id) {
            toast.error('Pilih aset yang akan dimutasi');
            return;
        }
        if (!form.to_location && !form.to_department_id) {
            toast.error('Tentukan lokasi atau departemen tujuan mutasi');
            return;
        }

        try {
            setSubmitting(true);
            const payload: any = {
                asset_id: Number(form.asset_id),
                transfer_date: form.transfer_date,
                from_department_id: form.from_department_id ? Number(form.from_department_id) : null,
                to_department_id: form.to_department_id ? Number(form.to_department_id) : null,
                from_location: form.from_location,
                to_location: form.to_location,
                reason: form.reason,
                received_by: form.received_by,
                notes: form.notes,
            };

            await assetApi.createTransfer(payload);
            toast.success('Pengajuan mutasi aset berhasil disimpan');
            navigate('/aset/transfers');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal mengajukan mutasi');
        } finally {
            setSubmitting(false);
        }
    };

    const assetOptions = [
        { value: '', label: '-- Pilih Aset Aktif --' },
        ...assets.map((a) => ({
            value: String(a.id),
            label: `${a.code} - ${a.name} (Lokasi Saat Ini: ${a.location || a.department?.name || 'Bebas'})`,
        })),
    ];

    const departmentOptions = [
        { value: '', label: '-- Pilih Departemen Tujuan --' },
        ...departments.map((d) => ({
            value: String(d.id),
            label: `${d.code ? d.code + ' - ' : ''}${d.name}`,
        })),
    ];

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Transfer', href: '/aset/transfers' },
        { title: 'Pengajuan Mutasi' },
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
                            <Link to="/aset/transfers">
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
                                <ArrowRightLeft className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Pengajuan Mutasi / Transfer Lokasi Aset
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Pencatatan perpindahan aset antar departemen, ruangan, dan unit operasional
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <ArrowRightLeft className="size-3.5 text-neutral-600" />
                                    <span>1. Rincian Mutasi Lokasi</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Pilih Aset <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={assetOptions}
                                        value={form.asset_id}
                                        onChange={handleAssetChange}
                                        placeholder="Cari kode atau nama aset..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tanggal Mutasi <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={form.transfer_date}
                                        onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
                                        required
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Lokasi Asal (Otomatis dari Data Aset)
                                    </label>
                                    <Input
                                        value={form.from_location}
                                        onChange={(e) => setForm({ ...form, from_location: e.target.value })}
                                        className="h-8 text-xs rounded-none bg-neutral-50 dark:bg-neutral-900"
                                        placeholder="Lokasi awal..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Departemen Tujuan Baru
                                    </label>
                                    <SearchableSelect
                                        options={departmentOptions}
                                        value={form.to_department_id}
                                        onChange={(val) => setForm({ ...form, to_department_id: val })}
                                        placeholder="Pilih departemen tujuan..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Ruangan / Lokasi Tujuan Baru <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.to_location}
                                        onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                                        placeholder="Contoh: Gedung B Lt. 3 R. Hemodialisa..."
                                        required
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Petugas Penerima (PIC Baru)
                                    </label>
                                    <Input
                                        value={form.received_by}
                                        onChange={(e) => setForm({ ...form, received_by: e.target.value })}
                                        placeholder="Nama penanggung jawab di ruangan baru..."
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Alasan Pemindahan / Mutasi
                                    </label>
                                    <Input
                                        value={form.reason}
                                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                        placeholder="Contoh: Reorganisasi ruangan, peremajaan unit..."
                                        className="h-8 text-xs rounded-none"
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
                                    placeholder="Kelengkapan aksesoris yang ikut dipindahkan..."
                                    className="w-full text-xs p-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Link to="/aset/transfers">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.transfers.create">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Ajukan Mutasi'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default AssetTransferCreate;
