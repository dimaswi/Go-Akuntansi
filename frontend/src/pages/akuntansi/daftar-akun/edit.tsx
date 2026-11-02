import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount, JenisAkun } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FolderTree, Save } from 'lucide-react';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Daftar Akun', href: '/akuntansi/daftar-akun' },
    { title: 'Edit Akun' },
];

export default function DaftarAkunEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        kode_akun: '',
        nama_akun: '',
        jenis_akun: 'aset' as JenisAkun,
        sub_jenis: '',
        saldo_normal: 'debit',
        induk_akun_id: null as number | null,
        level: 1,
        is_aktif: true,
        keterangan: '',
    });

    useEffect(() => {
        api.get('/daftar-akun')
            .then((res) => setAccounts(res.data.data || []))
            .catch(console.error);

        if (id) {
            api.get(`/daftar-akun/${id}`)
                .then((res) => {
                    const acc = res.data.data;
                    setFormData({
                        kode_akun: acc.kode_akun,
                        nama_akun: acc.nama_akun,
                        jenis_akun: acc.jenis_akun,
                        sub_jenis: acc.sub_jenis || '',
                        saldo_normal: acc.saldo_normal,
                        induk_akun_id: acc.induk_akun_id || null,
                        level: acc.level,
                        is_aktif: acc.is_aktif,
                        keterangan: acc.keterangan || '',
                    });
                })
                .catch(() => {
                    toast.error('Akun tidak ditemukan');
                    navigate('/akuntansi/daftar-akun');
                });
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/daftar-akun/${id}`, formData);
            toast.success('Akun berhasil diperbarui');
            navigate('/akuntansi/daftar-akun');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui akun');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* ─── Unified Card Container: KOTAK (rounded-none border border-neutral-200) ─── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* ─── Card Header: Kembali + Icon + Title ──────── */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/akuntansi/daftar-akun')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <FolderTree className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Akun: {formData.kode_akun || '...'}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Perubahan data akun bagan akun ({formData.nama_akun || '...'})
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Form Content ────────────────────────────────────────────── */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Kode Akun <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        placeholder="Contoh: 1-1110"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        value={formData.kode_akun}
                                        onChange={(e) => setFormData({ ...formData, kode_akun: e.target.value })}
                                    />
                                    <p className="text-[11px] text-neutral-500">Kode akun unik dalam sistem akuntansi</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Nama Akun <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        placeholder="Contoh: Kas Kecil Operasional"
                                        className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                        value={formData.nama_akun}
                                        onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Jenis Akun <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        value={formData.jenis_akun}
                                        onValueChange={(val) => {
                                            const jenis = val as JenisAkun;
                                            setFormData({
                                                ...formData,
                                                jenis_akun: jenis,
                                                saldo_normal:
                                                    jenis === 'aset' || jenis === 'beban' ? 'debit' : 'kredit',
                                            });
                                        }}
                                        placeholder="Pilih jenis akun..."
                                        searchPlaceholder="Cari jenis akun..."
                                        inputClassName="h-9 text-sm font-sans"
                                        options={[
                                            { value: 'aset', label: 'Aset (Aktiva)' },
                                            { value: 'kewajiban', label: 'Kewajiban (Liabilitas)' },
                                            { value: 'ekuitas', label: 'Ekuitas / Modal' },
                                            { value: 'pendapatan', label: 'Pendapatan (Income)' },
                                            { value: 'beban', label: 'Beban (Biaya Operasional)' },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Saldo Normal <span className="text-rose-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        value={formData.saldo_normal}
                                        onValueChange={(val) => setFormData({ ...formData, saldo_normal: val })}
                                        placeholder="Pilih saldo normal..."
                                        searchPlaceholder="Cari saldo normal..."
                                        inputClassName="h-9 text-sm font-sans"
                                        options={[
                                            { value: 'debit', label: 'Debit' },
                                            { value: 'kredit', label: 'Kredit' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Akun Induk (Parent Account)
                                    </label>
                                    <SearchableSelect
                                        value={formData.induk_akun_id ? String(formData.induk_akun_id) : ''}
                                        onValueChange={(val) => {
                                            const numVal = val ? Number(val) : null;
                                            const parent = accounts.find((a) => a.id === numVal);
                                            setFormData({
                                                ...formData,
                                                induk_akun_id: numVal,
                                                level: parent ? parent.level + 1 : 1,
                                            });
                                        }}
                                        placeholder="-- Tanpa Induk (Level 1 - Header Akun) --"
                                        searchPlaceholder="Cari akun induk berdasarkan kode atau nama..."
                                        inputClassName="h-9 text-sm font-sans"
                                        options={[
                                            { value: '', label: '-- Tanpa Induk (Level 1 - Header Akun) --' },
                                            ...accounts
                                                .filter((a) => a.id !== Number(id))
                                                .map((a) => ({
                                                    value: String(a.id),
                                                    label: `${a.kode_akun} - ${a.nama_akun} (Level ${a.level})`,
                                                })),
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                        Status Keaktifan
                                    </label>
                                    <SearchableSelect
                                        value={formData.is_aktif ? '1' : '0'}
                                        onValueChange={(val) => setFormData({ ...formData, is_aktif: val === '1' })}
                                        placeholder="Pilih status..."
                                        searchPlaceholder="Cari status..."
                                        inputClassName="h-9 text-sm font-sans"
                                        options={[
                                            { value: '1', label: 'Aktif' },
                                            { value: '0', label: 'Nonaktif' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                    Keterangan
                                </label>
                                <Input
                                    placeholder="Deskripsi akun (opsional)"
                                    className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* ─── Card Footer: Actions ───────────────────────────────────── */}
                        <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/akuntansi/daftar-akun')}
                                className="h-9 px-4 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                            >
                                Batal
                            </Button>
                            <Can permission="akuntansi.daftar-akun.edit">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-9 px-5 rounded-none bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-4" />
                                    Perbarui Akun
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
