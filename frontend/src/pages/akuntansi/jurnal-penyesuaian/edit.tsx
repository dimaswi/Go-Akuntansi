import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount, Journal } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { formatRupiah, cn } from '@/lib/utils';
import { Can } from '@/components/can';
import {
    ArrowLeft,
    BookOpenCheck,
    Plus,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Save,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface RowItem {
    id?: number;
    daftar_akun_id: number;
    keterangan: string;
    debit: number | string;
    kredit: number | string;
}

export default function JurnalPenyesuaianEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [nomorJurnal, setNomorJurnal] = useState('');
    const [tanggalTransaksi, setTanggalTransaksi] = useState('');
    const [jenisReferensi, setJenisReferensi] = useState('manual');
    const [nomorReferensi, setNomorReferensi] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [status, setStatus] = useState('draft');

    const [rows, setRows] = useState<RowItem[]>([
        { daftar_akun_id: 0, keterangan: '', debit: '', kredit: '' },
        { daftar_akun_id: 0, keterangan: '', debit: '', kredit: '' },
    ]);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [accRes, jRes] = await Promise.all([
                api.get('/daftar-akun'),
                api.get(`/jurnal/${id}`),
            ]);

            setAccounts(accRes.data?.data || []);

            const j: Journal = jRes.data?.data;
            if (j) {
                if (j.status === 'posted') {
                    toast.error('Jurnal penyesuaian yang sudah diposting tidak dapat diedit langsung. Batalkan posting terlebih dahulu!');
                }
                setNomorJurnal(j.nomor_jurnal || '');
                setTanggalTransaksi(j.tanggal_transaksi?.split('T')[0] || '');
                setJenisReferensi(j.jenis_referensi || 'manual');
                setNomorReferensi(j.nomor_referensi || '');
                setKeterangan(j.keterangan || '');
                setStatus(j.status);

                if (j.details && j.details.length > 0) {
                    setRows(
                        j.details.map((d) => ({
                            id: d.id,
                            daftar_akun_id: d.daftar_akun_id,
                            keterangan: d.keterangan || j.keterangan || '',
                            debit: Number(d.jumlah_debit) > 0 ? d.jumlah_debit : '',
                            kredit: Number(d.jumlah_kredit) > 0 ? d.jumlah_kredit : '',
                        }))
                    );
                }
            }
        } catch {
            toast.error('Gagal memuat data jurnal penyesuaian');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateRow = (index: number, field: keyof RowItem, value: any) => {
        setRows((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };

            if (field === 'debit' && Number(value) > 0) {
                next[index].kredit = '';
            } else if (field === 'kredit' && Number(value) > 0) {
                next[index].debit = '';
            }
            return next;
        });
    };

    const addRow = () => {
        setRows((prev) => [
            ...prev,
            { daftar_akun_id: 0, keterangan: keterangan || '', debit: '', kredit: '' },
        ]);
    };

    const removeRow = (index: number) => {
        if (rows.length <= 2) {
            toast.error('Jurnal penyesuaian minimal memiliki 2 baris akun');
            return;
        }
        setRows((prev) => prev.filter((_, i) => i !== index));
    };

    const totals = useMemo(() => {
        let debit = 0;
        let kredit = 0;
        rows.forEach((r) => {
            debit += Number(r.debit || 0);
            kredit += Number(r.kredit || 0);
        });
        const selisih = Math.abs(debit - kredit);
        const isBalanced = debit > 0 && debit === kredit;
        return { debit, kredit, selisih, isBalanced };
    }, [rows]);

    const accountOptions = useMemo(() => {
        return accounts.map((a) => ({
            value: String(a.id),
            label: `${a.kode_akun} - ${a.nama_akun} (${a.jenis_akun})`,
        }));
    }, [accounts]);

    const handleSubmit = async (isPostDirectly: boolean) => {
        if (!totals.isBalanced) {
            toast.error('Total debit dan kredit harus seimbang (balance)!');
            return;
        }

        const validRows = rows.filter(
            (r) => r.daftar_akun_id > 0 && (Number(r.debit || 0) > 0 || Number(r.kredit || 0) > 0)
        );

        if (validRows.length < 2) {
            toast.error('Minimal harus ada 2 baris akun valid');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                nomor_jurnal: nomorJurnal.trim() || undefined,
                tanggal_transaksi: tanggalTransaksi,
                jenis_jurnal: 'penyesuaian',
                jenis_referensi: jenisReferensi || 'manual',
                nomor_referensi: nomorReferensi.trim() || undefined,
                keterangan: keterangan.trim(),
                details: validRows.map((r) => ({
                    daftar_akun_id: Number(r.daftar_akun_id),
                    jumlah_debit: Number(r.debit || 0),
                    jumlah_kredit: Number(r.kredit || 0),
                    keterangan: r.keterangan?.trim() || keterangan.trim(),
                })),
            };

            await api.put(`/jurnal/${id}`, payload);

            if (isPostDirectly) {
                await api.post(`/jurnal/${id}/post`);
                toast.success('Jurnal penyesuaian berhasil diperbarui dan diposting!');
            } else {
                toast.success('Jurnal penyesuaian berhasil diperbarui!');
            }

            navigate(`/akuntansi/jurnal-penyesuaian/${id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui jurnal penyesuaian');
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbs = [

        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Jurnal Penyesuaian', href: '/akuntansi/jurnal-penyesuaian' },
        { title: `Edit ${nomorJurnal || 'Penyesuaian'}` },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full p-8 text-center text-xs text-neutral-500">
                    <RefreshCw className="size-4 animate-spin inline-block mr-2" />
                    Memuat data form...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Icon-Only Back Button + Title on Left, Empty beside Title */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/akuntansi/jurnal-penyesuaian/${id}`)}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <BookOpenCheck className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Jurnal Penyesuaian: {nomorJurnal}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Perbarui rincian transaksi penyesuaian akhir periode
                                    </p>
                                </div>
                            </div>
                        </div>

                        {status === 'posted' && (
                            <span className="text-xs text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1">
                                Status: Posted (Batalkan posting untuk menyimpan perubahan)
                            </span>
                        )}
                    </div>

                    {/* 2. Header Form Parameter */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    No. Jurnal
                                </label>
                                <Input
                                    type="text"
                                    value={nomorJurnal}
                                    onChange={(e) => setNomorJurnal(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Tanggal Transaksi
                                </label>
                                <Input
                                    type="date"
                                    value={tanggalTransaksi}
                                    onChange={(e) => setTanggalTransaksi(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Jenis Referensi
                                </label>
                                <NativeSearchableSelect
                                    value={jenisReferensi}
                                    onChange={(e) => setJenisReferensi(e.target.value)}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none cursor-pointer"
                                >
                                    <option value="manual">Manual</option>
                                    <option value="penyusutan">Penyusutan Aset</option>
                                    <option value="beban_dibayar_dimuka">Beban Dibayar Dimuka</option>
                                    <option value="beban_masih_harus_dibayar">Beban Masih Harus Dibayar</option>
                                    <option value="pendapatan_diterima_dimuka">Pendapatan Diterima Dimuka</option>
                                    <option value="adjustment">Adjustment Lainnya</option>
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    No. Referensi / Memo
                                </label>
                                <Input
                                    type="text"
                                    placeholder="No. Memo..."
                                    value={nomorReferensi}
                                    onChange={(e) => setNomorReferensi(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                Uraian / Keterangan Penyesuaian
                            </label>
                            <Input
                                type="text"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                            />
                        </div>
                    </div>

                    {/* 3. Subheader: Action Tambah Baris (Placed Above Table) */}
                    <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                Detail Debit & Kredit (Minimal 2 Baris)
                            </span>
                            <p className="text-[11px] text-neutral-500 font-mono">
                                {rows.length} Baris Jurnal
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addRow}
                            className="h-7 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 px-3 gap-1.5 shadow-none"
                        >
                            <Plus className="size-3.5" />
                            <span>Tambah Baris Akun</span>
                        </Button>
                    </div>

                    {/* 4. Table Rows */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-left w-10">No</th>
                                    <th className="py-2.5 px-3 text-left w-72 sm:w-80">Rekening Akun</th>
                                    <th className="py-2.5 px-3 text-left">Keterangan Baris</th>
                                    <th className="py-2.5 px-3 text-right w-40">Debet (Rp)</th>
                                    <th className="py-2.5 px-3 text-right w-40">Kredit (Rp)</th>
                                    <th className="py-2.5 px-3 text-center w-12">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                        <td className="py-2 px-3 font-mono text-neutral-500 text-center">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2 px-3">
                                            <SearchableSelect
                                                options={accountOptions}
                                                value={row.daftar_akun_id ? String(row.daftar_akun_id) : ''}
                                                onValueChange={(val) => updateRow(idx, 'daftar_akun_id', Number(val))}
                                                placeholder="Pilih rekening akun..."
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none w-full"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="text"
                                                value={row.keterangan}
                                                onChange={(e) => updateRow(idx, 'keterangan', e.target.value)}
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                value={row.debit}
                                                onChange={(e) => updateRow(idx, 'debit', e.target.value)}
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                value={row.kredit}
                                                onChange={(e) => updateRow(idx, 'kredit', e.target.value)}
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeRow(idx)}
                                                disabled={rows.length <= 2}
                                                className="h-7 w-7 p-0 text-neutral-400 hover:text-rose-600 disabled:opacity-30"
                                                title="Hapus Baris"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Live Balance Strip */}
                    <div
                        className={cn(
                            'p-3.5 border-t border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs',
                            totals.isBalanced
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-50/70 border-rose-200 text-rose-950 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {totals.isBalanced ? (
                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                            )}
                            <div>
                                <span className="font-bold uppercase tracking-wider block">
                                    {totals.isBalanced ? 'SEIMBANG (BALANCED)' : 'BELUM SEIMBANG (UNBALANCED)'}
                                </span>
                                <span className="text-[11px] opacity-80 font-mono">
                                    {totals.isBalanced
                                        ? 'Total Debit sama persis dengan Total Kredit'
                                        : `Selisih: ${formatRupiah(totals.selisih)}`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 font-mono text-xs">
                            <div>
                                <span className="text-[11px] text-neutral-500 block uppercase">Total Debet:</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                    {formatRupiah(totals.debit)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500 block uppercase">Total Kredit:</span>
                                <span className="font-bold text-amber-700 dark:text-amber-400">
                                    {formatRupiah(totals.kredit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 6. Footer Submission */}
                    <div className="p-4 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/akuntansi/jurnal-penyesuaian/${id}`)}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>

                        <div className="flex items-center gap-2">
                            <Can permission="akuntansi.jurnal-penyesuaian.edit">
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={saving || !totals.isBalanced || status === 'posted'}
                                    onClick={() => handleSubmit(false)}
                                    className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs px-3.5 gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>Simpan Perubahan</span>
                                </Button>
                            </Can>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

