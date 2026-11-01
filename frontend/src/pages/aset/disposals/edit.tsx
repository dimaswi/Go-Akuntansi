import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, Asset, AssetDisposal } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import { Trash2, ArrowLeft, Save, RefreshCw } from 'lucide-react';

export const AssetDisposalEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [form, setForm] = useState({
        disposal_number: '',
        asset_id: '',
        disposal_date: '',
        disposal_type: 'SALE',
        reason: '',
        sale_proceeds: '0',
        recipient: '',
        notes: '',
    });

    useEffect(() => {
        const initData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [dispRes, assetsRes] = await Promise.all([
                    assetApi.getDisposal(id),
                    assetApi.getAssets({ per_page: 200 }),
                ]);

                if (assetsRes.data?.success) {
                    setAssets(assetsRes.data.data || []);
                }

                if (dispRes.data?.success) {
                    const d: AssetDisposal = dispRes.data.data;
                    setForm({
                        disposal_number: d.disposal_number || '',
                        asset_id: String(d.asset_id),
                        disposal_date: d.disposal_date ? d.disposal_date.slice(0, 10) : '',
                        disposal_type: d.disposal_type || 'SALE',
                        reason: d.reason || '',
                        sale_proceeds: String(d.sale_proceeds || 0),
                        recipient: d.recipient || '',
                        notes: d.notes || '',
                    });
                }
            } catch (err) {
                toast.error('Gagal memuat detail pelepasan aset');
                navigate('/aset/disposals');
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
                disposal_number: form.disposal_number,
                asset_id: Number(form.asset_id),
                disposal_date: form.disposal_date,
                disposal_type: form.disposal_type,
                reason: form.reason,
                sale_proceeds: Number(form.sale_proceeds || 0),
                recipient: form.recipient,
                notes: form.notes,
            };

            await assetApi.updateDisposal(id, payload);
            toast.success('Perubahan pengajuan pelepasan aset berhasil disimpan');
            navigate(`/aset/disposals/${id}`);
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

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Disposal', href: '/aset/disposals' },
        { title: form.disposal_number ? `Edit: ${form.disposal_number}` : 'Edit Pelepasan' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat data pelepasan aset...
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
                            <Link to={`/aset/disposals/${id}`}>
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
                                <Trash2 className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Edit Pelepasan Aset: {form.disposal_number}
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Perbarui rincian metode pelepasan, pihak penerima, atau nilai hasil pelepasan
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Trash2 className="size-3.5 text-neutral-600" />
                                    <span>1. Rincian Pelepasan Aset</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Aset yang Dilepas <span className="text-rose-500">*</span>
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
                                        Nomor Dokumen Pelepasan
                                    </label>
                                    <Input
                                        value={form.disposal_number}
                                        onChange={(e) => setForm({ ...form, disposal_number: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tanggal Pelepasan / BA <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={form.disposal_date}
                                        onChange={(e) => setForm({ ...form, disposal_date: e.target.value })}
                                        required
                                        className="h-8 text-xs rounded-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Metode Pelepasan <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        value={form.disposal_type}
                                        onChange={(val) => setForm({ ...form, disposal_type: val })}
                                        options={[
                                            { value: 'SALE', label: 'Penjualan (Sale)' },
                                            { value: 'SCRAP', label: 'Pemusnahan / Rongsok (Scrap)' },
                                            { value: 'DONATION', label: 'Hibah / Donasi' },
                                            { value: 'LOST', label: 'Kehilangan (Lost / Stolen)' },
                                            { value: 'DAMAGE', label: 'Rusak Total Tak Dapat Diperbaiki' },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Hasil Penjualan / Kompensasi (Rp)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={form.sale_proceeds}
                                        onChange={(e) => setForm({ ...form, sale_proceeds: e.target.value })}
                                        className="h-8 text-xs rounded-none font-mono font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Pihak Penerima / Pembeli
                                    </label>
                                    <Input
                                        value={form.recipient}
                                        onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                                        className="h-8 text-xs rounded-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Alasan Pelepasan
                                </label>
                                <textarea
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    rows={2}
                                    className="w-full text-xs p-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Catatan / Referensi SK
                                </label>
                                <Input
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="h-8 text-xs rounded-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-end gap-2">
                        <Link to={`/aset/disposals/${id}`}>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="aset.disposals.edit">
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

export default AssetDisposalEdit;
