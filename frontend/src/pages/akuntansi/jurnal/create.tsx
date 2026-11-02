import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Can } from '@/components/can';
import {
    ArrowLeft,
    BookOpen,
    Plus,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Save,
    RotateCcw,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface JournalRowInput {
    daftar_akun_id: number;
    keterangan: string;
    jumlah_debit: number | string;
    jumlah_kredit: number | string;
}

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Jurnal Transaksi', href: '/akuntansi/jurnal' },
    { title: 'Tambah Jurnal' },
];

export default function JurnalCreate() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);

    // Form Header State
    const [nomorJurnal, setNomorJurnal] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [jenisJurnal, setJenisJurnal] = useState('umum');
    const [jenisReferensi, setJenisReferensi] = useState('manual');
    const [nomorReferensi, setNomorReferensi] = useState('');
    const [keterangan, setKeterangan] = useState('');

    // Form Rows State (Double-Entry)
    const [rows, setRows] = useState<JournalRowInput[]>([
        { daftar_akun_id: 0, keterangan: '', jumlah_debit: '', jumlah_kredit: 0 },
        { daftar_akun_id: 0, keterangan: '', jumlah_debit: 0, jumlah_kredit: '' },
    ]);

    useEffect(() => {
        api.get('/daftar-akun')
            .then((res) => setAccounts(res.data.data || []))
            .catch(console.error);
    }, []);

    // Account Options formatted for SearchableSelect
    const accountOptions = useMemo(() => {
        return accounts.map((a) => ({
            value: String(a.id),
            label: `${a.kode_akun} - ${a.nama_akun} (${a.jenis_akun})`,
        }));
    }, [accounts]);

    // Live Calculation
    const totalDebit = rows.reduce((sum, r) => sum + (Number(r.jumlah_debit) || 0), 0);
    const totalKredit = rows.reduce((sum, r) => sum + (Number(r.jumlah_kredit) || 0), 0);
    const selisih = Math.abs(totalDebit - totalKredit);
    const isBalanced = totalDebit > 0 && totalDebit === totalKredit;

    const handleAddRow = () => {
        setRows([...rows, { daftar_akun_id: 0, keterangan: '', jumlah_debit: 0, jumlah_kredit: 0 }]);
    };

    const handleRemoveRow = (index: number) => {
        if (rows.length <= 2) {
            toast.error('Minimal harus ada 2 baris jurnal yang valid');
            return;
        }
        setRows(rows.filter((_, i) => i !== index));
    };

    // Mutual Exclusion logic
    const handleRowChange = (index: number, field: keyof JournalRowInput, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };

        if (field === 'jumlah_debit' && Number(value) > 0) {
            newRows[index].jumlah_kredit = 0;
        } else if (field === 'jumlah_kredit' && Number(value) > 0) {
            newRows[index].jumlah_debit = 0;
        }

        setRows(newRows);
    };

    const resetForm = () => {
        setNomorJurnal('');
        setTanggal(new Date().toISOString().split('T')[0]);
        setJenisJurnal('umum');
        setJenisReferensi('manual');
        setNomorReferensi('');
        setKeterangan('');
        setRows([
            { daftar_akun_id: 0, keterangan: '', jumlah_debit: '', jumlah_kredit: 0 },
            { daftar_akun_id: 0, keterangan: '', jumlah_debit: 0, jumlah_kredit: '' },
        ]);
    };

    const handleSave = async (andCreateAnother: boolean = false, autoPost: boolean = false) => {
        const validDetails = rows.filter(
            (r) => r.daftar_akun_id > 0 && (Number(r.jumlah_debit) > 0 || Number(r.jumlah_kredit) > 0),
        );

        if (validDetails.length < 2) {
            toast.error('Minimal harus ada 2 baris jurnal yang valid (memiliki akun dan nominal)');
            return;
        }

        if (!isBalanced) {
            toast.error('Total debit dan kredit harus seimbang!');
            return;
        }

        if (!keterangan.trim()) {
            toast.error('Uraian / keterangan transaksi wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/jurnal', {
                nomor_jurnal: nomorJurnal.trim() || undefined,
                tanggal_transaksi: tanggal,
                jenis_jurnal: jenisJurnal,
                jenis_referensi: jenisReferensi,
                nomor_referensi: nomorReferensi.trim() || undefined,
                keterangan: keterangan.trim(),
                details: validDetails.map((r) => ({
                    daftar_akun_id: Number(r.daftar_akun_id),
                    keterangan: r.keterangan || keterangan,
                    jumlah_debit: Number(r.jumlah_debit) || 0,
                    jumlah_kredit: Number(r.jumlah_kredit) || 0,
                })),
            });

            const createdJournal = res.data?.data;

            if (autoPost && createdJournal?.id) {
                await api.post(`/jurnal/${createdJournal.id}/post`);
                toast.success('Jurnal transaksi berhasil disimpan dan diposting!');
            } else {
                toast.success('Jurnal transaksi berhasil disimpan sebagai draft!');
            }

            if (andCreateAnother) {
                resetForm();
            } else {
                navigate('/akuntansi/jurnal');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan jurnal');
        } finally {
            setLoading(false);
        }
    };

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
                                onClick={() => navigate('/akuntansi/jurnal')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <BookOpen className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Tambah Jurnal Baru
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Pencatatan transaksi umum double-entry
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Form Parameter Strip (Informasi Header) */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Nomor Jurnal */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    No. Jurnal (Otomatis jika kosong)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Auto: JE/YYYY/MM/XXXX"
                                    value={nomorJurnal}
                                    onChange={(e) => setNomorJurnal(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>

                            {/* Tanggal Transaksi */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Tanggal Transaksi <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>

                            {/* Jenis Referensi */}
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
                                    <option value="kas">Kas</option>
                                    <option value="bank">Bank</option>
                                    <option value="pembelian">Pembelian</option>
                                    <option value="penjualan">Penjualan</option>
                                    <option value="adjustment">Adjustment</option>
                                </NativeSearchableSelect>
                            </div>

                            {/* Nomor Referensi */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    No. Referensi (Dokumen Sumber)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Contoh: INV-001, BKK-01"
                                    value={nomorReferensi}
                                    onChange={(e) => setNomorReferensi(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>
                        </div>

                        {/* Keterangan Transaksi Header */}
                        <div className="mt-3">
                            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                Uraian / Keterangan Jurnal <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                required
                                placeholder="Deskripsi ringkas transaksi keuangan..."
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                            />
                        </div>
                    </div>

                    {/* 3. Subheader: Action Tambah Baris (Above Table) */}
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
                            onClick={handleAddRow}
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
                                    <th className="py-2.5 px-3 text-left w-72 sm:w-80">
                                        Rekening Akun <span className="text-rose-500">*</span>
                                    </th>
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
                                                onValueChange={(val) =>
                                                    handleRowChange(idx, 'daftar_akun_id', val ? Number(val) : 0)
                                                }
                                                placeholder="Pilih rekening akun..."
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none w-full"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="text"
                                                placeholder={keterangan || 'Keterangan transaksi...'}
                                                value={row.keterangan}
                                                onChange={(e) => handleRowChange(idx, 'keterangan', e.target.value)}
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                value={row.jumlah_debit === 0 ? '' : row.jumlah_debit}
                                                onChange={(e) =>
                                                    handleRowChange(
                                                        idx,
                                                        'jumlah_debit',
                                                        e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                                                    )
                                                }
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                value={row.jumlah_kredit === 0 ? '' : row.jumlah_kredit}
                                                onChange={(e) =>
                                                    handleRowChange(
                                                        idx,
                                                        'jumlah_kredit',
                                                        e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                                                    )
                                                }
                                                className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveRow(idx)}
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
                            isBalanced
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-50/70 border-rose-200 text-rose-950 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300',
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {isBalanced ? (
                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                            )}
                            <div>
                                <span className="font-bold uppercase tracking-wider block">
                                    {isBalanced ? 'SEIMBANG (BALANCED)' : 'BELUM SEIMBANG (UNBALANCED)'}
                                </span>
                                <span className="text-[11px] opacity-80 font-mono">
                                    {isBalanced
                                        ? 'Total Debit sama persis dengan Total Kredit'
                                        : `Selisih: ${formatRupiah(selisih)}`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 font-mono text-xs">
                            <div>
                                <span className="text-[11px] text-neutral-500 block uppercase">Total Debet:</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                    {formatRupiah(totalDebit)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-neutral-500 block uppercase">Total Kredit:</span>
                                <span className="font-bold text-amber-700 dark:text-amber-400">
                                    {formatRupiah(totalKredit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 6. Footer Submission Bar */}
                    <div className="p-4 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/akuntansi/jurnal')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>

                        <div className="flex flex-wrap items-center gap-2">
                            <Can permission="akuntansi.jurnal.create">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={loading || !isBalanced}
                                    onClick={() => handleSave(true, false)}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 gap-1.5 shadow-none"
                                    title="Simpan sebagai draft dan buat jurnal baru lagi"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Simpan & Buat Lagi</span>
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={loading || !isBalanced}
                                    onClick={() => handleSave(false, false)}
                                    className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs px-3.5 gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>Simpan sebagai Draft</span>
                                </Button>
                            </Can>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
