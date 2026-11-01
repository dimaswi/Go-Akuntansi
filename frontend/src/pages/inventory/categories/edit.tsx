import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Tag, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Can } from '@/components/can';

export const CategoryEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        code: '',
        name: '',
        description: '',
        category_type: 'general',
        is_active: true,
    });

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await inventoryApi.getCategories();
                if (res.data?.success) {
                    const found = (res.data.data || []).find((c: any) => String(c.id) === String(id));
                    if (found) {
                        setForm({
                            code: found.code,
                            name: found.name,
                            description: found.description || '',
                            category_type: found.category_type || 'general',
                            is_active: found.is_active,
                        });
                    }
                }
            } catch {
                toast.error('Gagal memuat kategori');
                navigate('/inventory/categories');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim() || !form.name.trim()) {
            toast.error('Kode dan Nama kategori wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const res = await inventoryApi.updateCategory(id!, form);
            if (res.data?.success) {
                toast.success('Kategori berhasil diperbarui');
                navigate('/inventory/categories');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui kategori');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat rincian kategori...
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
                                onClick={() => navigate('/inventory/categories')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Tag className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Kategori Barang ({form.code})
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Perbarui Kode, Nama, dan Tipe Kategori</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form id="category-edit-form" onSubmit={handleSubmit}>
                        <div className="p-4 space-y-4 w-full max-w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Kode Kategori <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        required
                                        className="h-8 text-xs font-mono uppercase rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Nama Kategori <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Tipe Kelompok
                                    </label>
                                    <NativeSearchableSelect
                                        value={form.category_type}
                                        onChange={(e) => setForm({ ...form, category_type: e.target.value })}
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer"
                                    >
                                        <option value="general">Umum / Non-Medis</option>
                                        <option value="pharmacy">Farmasi / Obat</option>
                                        <option value="medical_device">Alat Kesehatan</option>
                                        <option value="stationery">ATK / Cetakan</option>
                                    </NativeSearchableSelect>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Status Kategori
                                    </label>
                                    <div className="flex items-center gap-2 h-8">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                            className="rounded-none size-4 text-neutral-900 focus:ring-0"
                                        />
                                        <label htmlFor="is_active" className="text-xs font-medium cursor-pointer">
                                            Aktif (Dapat dipilih saat input barang)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                    Keterangan / Deskripsi
                                </label>
                                <Textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                                onClick={() => navigate('/inventory/categories')}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                            >
                                Batal
                            </Button>
                            <Can permission="inventory.categories.edit">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>{submitting ? 'Menyimpan...' : 'Perbarui Kategori'}</span>
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};
export default CategoryEdit;

