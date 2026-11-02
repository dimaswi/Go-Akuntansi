import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount, TemplatePenyesuaian } from '@/types/accounting';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface RowItem {
    daftar_akun_id: number;
    keterangan: string;
    debit: number | string;
    kredit: number | string;
}

const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const TEMPLATES: TemplatePenyesuaian[] = [
    {
        id: 'manual',
        nama: 'Manual (Kustom)',
        kategori: 'manual',
        keterangan: 'Jurnal penyesuaian akhir periode buku',
        debit_hint: 'Pilih Akun Debit',
        kredit_hint: 'Pilih Akun Kredit',
    },
    {
        id: 'depreciation',
        nama: 'Penyusutan Aset Tetap',
        kategori: 'penyusutan',
        keterangan: 'Penyusutan aset tetap bulan {bulan} {tahun}',
        debit_hint: 'Beban Penyusutan (Debet)',
        kredit_hint: 'Akumulasi Penyusutan (Kredit)',
        debit_filter: 'beban',
        kredit_filter: 'aset',
    },
    {
        id: 'prepaid_rent',
        nama: 'Alokasi Sewa Dibayar Dimuka',
        kategori: 'beban_dibayar_dimuka',
        keterangan: 'Alokasi beban sewa bulan {bulan} {tahun}',
        debit_hint: 'Beban Sewa (Debet)',
        kredit_hint: 'Sewa Dibayar Dimuka (Kredit)',
        debit_filter: 'beban',
        kredit_filter: 'aset',
    },
    {
        id: 'prepaid_insurance',
        nama: 'Alokasi Asuransi Dibayar Dimuka',
        kategori: 'beban_dibayar_dimuka',
        keterangan: 'Alokasi beban asuransi bulan {bulan} {tahun}',
        debit_hint: 'Beban Asuransi (Debet)',
        kredit_hint: 'Asuransi Dibayar Dimuka (Kredit)',
        debit_filter: 'beban',
        kredit_filter: 'aset',
    },
    {
        id: 'accrual_utility',
        nama: 'Beban Utilitas yang Masih Harus Dibayar',
        kategori: 'beban_masih_harus_dibayar',
        keterangan: 'Beban listrik/air/utilitas yang masih harus dibayar periode {bulan} {tahun}',
        debit_hint: 'Beban Listrik/Air/Telepon (Debet)',
        kredit_hint: 'Utang Biaya/Utilitas (Kredit)',
        debit_filter: 'beban',
        kredit_filter: 'kewajiban',
    },
    {
        id: 'accrual_salary',
        nama: 'Beban Gaji yang Masih Harus Dibayar',
        kategori: 'beban_masih_harus_dibayar',
        keterangan: 'Beban gaji yang masih harus dibayar per akhir {bulan} {tahun}',
        debit_hint: 'Beban Gaji (Debet)',
        kredit_hint: 'Utang Gaji (Kredit)',
        debit_filter: 'beban',
        kredit_filter: 'kewajiban',
    },
    {
        id: 'bad_debt',
        nama: 'Beban Piutang Tak Tertagih',
        kategori: 'adjustment',
        keterangan: 'Pencadangan kerugian piutang tak tertagih {bulan} {tahun}',
        debit_hint: 'Beban Kerugian Piutang (Debet)',
        kredit_hint: 'Cadangan Kerugian Piutang (Kredit)',
        debit_filter: 'beban',
        kredit_filter: 'aset',
    },
    {
        id: 'unearned_revenue',
        nama: 'Pendapatan Diterima Dimuka yang Direalisasi',
        kategori: 'pendapatan_diterima_dimuka',
        keterangan: 'Pengakuan realisasi pendapatan diterima dimuka {bulan} {tahun}',
        debit_hint: 'Pendapatan Diterima Dimuka (Debet)',
        kredit_hint: 'Pendapatan Operasional (Kredit)',
        debit_filter: 'kewajiban',
        kredit_filter: 'pendapatan',
    },
];

export default function JurnalPenyesuaianCreate() {
    const navigate = useNavigate();

    // Accounts data
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const now = new Date();
    // Default akhir bulan berjalan
    const defaultDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [selectedTemplateId, setSelectedTemplateId] = useState('manual');
    const [nomorJurnal, setNomorJurnal] = useState('');
    const [tanggalTransaksi, setTanggalTransaksi] = useState(defaultDate);
    const [jenisReferensi, setJenisReferensi] = useState('manual');
    const [nomorReferensi, setNomorReferensi] = useState('');
    const [keterangan, setKeterangan] = useState('Jurnal penyesuaian akhir periode buku');

    // Rows
    const [rows, setRows] = useState<RowItem[]>([
        { daftar_akun_id: 0, keterangan: '', debit: '', kredit: '' },
        { daftar_akun_id: 0, keterangan: '', debit: '', kredit: '' },
    ]);

    useEffect(() => {
        api.get('/daftar-akun')
            .then((res) => setAccounts(res.data?.data || []))
            .catch(() => toast.error('Gagal memuat daftar akun'));
    }, []);

    // Handle template change
    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const tpl = TEMPLATES.find((t) => t.id === templateId);
        if (!tpl) return;

        const d = new Date(tanggalTransaksi);
        const bln = NAMA_BULAN[d.getMonth()] || '';
        const thn = String(d.getFullYear());

        const generatedKet = tpl.keterangan.replace('{bulan}', bln).replace('{tahun}', thn);
        setKeterangan(generatedKet);
        setJenisReferensi(tpl.kategori);

        // Pre-populate row descriptions
        setRows((prev) =>
            prev.map((r) => ({
                ...r,
                keterangan: r.keterangan || generatedKet,
            }))
        );
    };

    const updateRow = (index: number, field: keyof RowItem, value: any) => {
        setRows((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };

            // Automatic mutual exclusivity between debit and credit
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

    // Calculate totals & balance
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
            toast.error('Total debit dan kredit harus seimbang (balance) dan lebih dari Rp 0!');
            return;
        }

        // Validate rows
        const validRows = rows.filter(
            (r) => r.daftar_akun_id > 0 && (Number(r.debit || 0) > 0 || Number(r.kredit || 0) > 0)
        );

        if (validRows.length < 2) {
            toast.error('Minimal harus ada 2 baris akun valid');
            return;
        }

        setLoading(true);
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

            const res = await api.post('/jurnal', payload);
            const createdJournal = res.data?.data;

            if (isPostDirectly && createdJournal?.id) {
                await api.post(`/jurnal/${createdJournal.id}/post`);
                toast.success('Jurnal penyesuaian berhasil dibuat dan diposting!');
            } else {
                toast.success('Jurnal penyesuaian berhasil disimpan sebagai draft!');
            }

            navigate('/akuntansi/jurnal-penyesuaian');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan jurnal penyesuaian');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbs = [

        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Jurnal Penyesuaian', href: '/akuntansi/jurnal-penyesuaian' },
        { title: 'Tambah Penyesuaian' },
    ];

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
                                onClick={() => navigate('/akuntansi/jurnal-penyesuaian')}
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
                                        Buat Jurnal Penyesuaian (AJP)
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Pencatatan penyesuaian akun akhir periode buku
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Template Selector Pill */}
                        <div className="flex items-center gap-2">
                            <NativeSearchableSelect
                                value={selectedTemplateId}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                                className="h-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer"
                            >
                                {TEMPLATES.map((tpl) => (
                                    <option key={tpl.id} value={tpl.id}>
                                        {tpl.nama}
                                    </option>
                                ))}
                            </NativeSearchableSelect>
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
                                    placeholder="Contoh: JP/2026/10/0001"
                                    value={nomorJurnal}
                                    onChange={(e) => setNomorJurnal(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>

                            {/* Tanggal Transaksi */}
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
                                    <option value="penyusutan">Penyusutan Aset</option>
                                    <option value="beban_dibayar_dimuka">Beban Dibayar Dimuka</option>
                                    <option value="beban_masih_harus_dibayar">Beban Masih Harus Dibayar</option>
                                    <option value="pendapatan_diterima_dimuka">Pendapatan Diterima Dimuka</option>
                                    <option value="adjustment">Adjustment Lainnya</option>
                                </NativeSearchableSelect>
                            </div>

                            {/* Nomor Referensi */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    No. Referensi / Memo
                                </label>
                                <Input
                                    type="text"
                                    placeholder="No. Memo / Dokumen audit..."
                                    value={nomorReferensi}
                                    onChange={(e) => setNomorReferensi(e.target.value)}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>
                        </div>

                        {/* Keterangan */}
                        <div className="mt-3">
                            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                Uraian / Keterangan Penyesuaian
                            </label>
                            <Input
                                type="text"
                                placeholder="Jelaskan alasan dan dasar perhitungan penyesuaian..."
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
                                                placeholder={keterangan || 'Keterangan transaksi...'}
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

                    {/* 6. Footer Submission Bar */}
                    <div className="p-4 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/akuntansi/jurnal-penyesuaian')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>

                        <div className="flex items-center gap-2">
                            <Can permission="akuntansi.jurnal-penyesuaian.create">
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={loading || !totals.isBalanced}
                                    onClick={() => handleSubmit(false)}
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

