import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Can } from '@/components/can';

export const SupplierEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        is_active: true,
    });

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await inventoryApi.getSuppliers();
                if (res.data?.success) {
                    const found = (res.data.data || []).find((s: any) => String(s.id) === String(id));
                    if (found) {
                        setForm({
                            name: found.name,
                            phone: found.phone || '',
                            email: found.email || '',
                            address: found.address || '',
                            is_active: found.is_active,
                        });
                    }
                }
            } catch {
                toast.error('Gagal memuat data pemasok');
                navigate('/inventory/suppliers');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Nama pemasok / vendor wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const res = await inventoryApi.updateSupplier(id!, form);
            if (res.data?.success) {
                toast.success('Data pemasok berhasil diperbarui');
                navigate('/inventory/suppliers');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui data pemasok');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data pemasok...
                </div>
            </AppLayout>
        );
    }

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
                                onClick={() => navigate('/inventory/suppliers')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Truck className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Data Pemasok ({form.name})
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Perbarui Kontak, Alamat, dan Status Rekanan</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form id="supplier-edit-form" onSubmit={handleSubmit}>
                        <div className="p-4 space-y-4 w-full max-w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Nama Perusahaan / Vendor <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Nomor Telepon / Kontak
                                    </label>
                                    <Input
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="h-8 text-xs font-mono rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Alamat Email Resmi
                                    </label>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Status Kemitraan
                                    </label>
                                    <div className="flex items-center gap-2 h-8">
                                        <input
                                            type="checkbox"
                                            id="sup_edit_active"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                            className="rounded-none size-4 text-neutral-900 focus:ring-0"
                                        />
                                        <label htmlFor="sup_edit_active" className="text-xs font-medium cursor-pointer">
                                            Aktif (Dapat dipilih dalam Purchase Order)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                    Alamat Lengkap Gudang / Kantor Vendor
                                </label>
                                <Textarea
                                    rows={3}
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>
                        </div>

                        {/* Card Footer: Actions */}
                        <div className="px-4 py-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/inventory/suppliers')}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                            >
                                Batal
                            </Button>
                            <Can permission="inventory.suppliers.edit">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>{submitting ? 'Menyimpan...' : 'Perbarui Pemasok'}</span>
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};
export default SupplierEdit;

