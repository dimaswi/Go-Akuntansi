import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { assetApi, Asset, AssetTransfer } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import { ArrowRightLeft, ArrowLeft, Save, RefreshCw } from 'lucide-react';

export const AssetTransferEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState({
        transfer_number: '',
        asset_id: '',
        transfer_date: '',
        from_department_id: '',
        to_department_id: '',
        from_location: '',
        to_location: '',
        reason: '',
        received_by: '',
        notes: '',
    });

    useEffect(() => {
        const initData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [transRes, assetsRes, deptRes] = await Promise.all([
                    assetApi.getTransfer(id),
                    assetApi.getAssets({ per_page: 200 }),
                    api.get('/departments'),
                ]);

                if (assetsRes.data?.success) {
                    setAssets(assetsRes.data.data || []);
                }
                const dData = deptRes.data?.data || deptRes.data || [];
                if (Array.isArray(dData)) {
                    setDepartments(dData);
                }

                if (transRes.data?.success) {
                    const t: AssetTransfer = transRes.data.data;
                    setForm({
                        transfer_number: t.transfer_number || '',
                        asset_id: String(t.asset_id),
                        transfer_date: t.transfer_date ? t.transfer_date.slice(0, 10) : '',
                        from_department_id: t.from_department_id ? String(t.from_department_id) : '',
                        to_department_id: t.to_department_id ? String(t.to_department_id) : '',
                        from_location: t.from_location || '',
                        to_location: t.to_location || '',
                        reason: t.reason || '',
                        received_by: t.received_by || '',
                        notes: t.notes || '',
                    });
                }
            } catch (err) {
                toast.error('Gagal memuat detail mutasi aset');
                navigate('/aset/transfers');
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            setSubmitting(true);
            const payload: any = {
                transfer_number: form.transfer_number,
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

            await assetApi.updateTransfer(id, payload);
            toast.success('Perubahan mutasi aset berhasil disimpan');
            navigate(`/aset/transfers/${id}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan perubahan');
        } finally {
            setSubmitting(false);
        }
    };

    const assetOptions = [
        { value: '', label: '-- Pilih Aset --' },
        ...assets.map((a) => ({
            value: String(a.id),
            label: `${a.code} - ${a.name}`,
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
        { title: form.transfer_number ? `Edit: ${form.transfer_number}` : 'Edit Mutasi' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat data mutasi aset...
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
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to={`/aset/transfers/${id}`}>
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
                                    Edit Mutasi: {form.transfer_number}
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Perbarui lokasi tujuan atau pihak penerima
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
                                        onChange={(val) => setForm({ ...form, asset_id: val })}
                                        placeholder="Pilih aset..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Nomor Mutasi
                                    </label>
                                    <Input
                                        value={form.transfer_number}
                                        onChange={(e) => setForm({ ...form, transfer_number: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Departemen Tujuan
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
                                        required
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Petugas Penerima (PIC)
                                    </label>
                                    <Input
                                        value={form.received_by}
                                        onChange={(e) => setForm({ ...form, received_by: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Alasan Mutasi
                                    </label>
                                    <Input
                                        value={form.reason}
                                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Catatan
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
                        <Link to={`/aset/transfers/${id}`}>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.transfers.edit">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
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

export default AssetTransferEdit;
