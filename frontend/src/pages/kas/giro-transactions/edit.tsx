import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { BankAccount, GiroTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    FileSpreadsheet,
    Save,
    Lock,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Kas & Bank', href: '/kas/giro-transactions' },
    { title: 'Transaksi Giro', href: '/kas/giro-transactions' },
    { title: 'Edit Bilyet Giro' },
];

export default function GiroTransactionEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [transaksi, setTransaksi] = useState<GiroTransaction | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [nomorGiro, setNomorGiro] = useState('');
    const [tanggalGiro, setTanggalGiro] = useState('');
    const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('');
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [jenisGiro, setJenisGiro] = useState<'masuk' | 'keluar'>('masuk');
    const [jumlah, setJumlah] = useState('');
    const [penerbit, setPenerbit] = useState('');
    const [penerima, setPenerima] = useState('');
    const [daftarAkunId, setDaftarAkunId] = useState<string>('');
    const [keterangan, setKeterangan] = useState('');

    useEffect(() => {
        const load = async () => {
            setFetching(true);
            try {
                const [txRes, bRes, cRes] = await Promise.all([
                    api.get(`/kas/giro-transactions/${id}`),
                    api.get('/kas/bank-accounts'),
                    api.get('/daftar-akun'),
                ]);
                const tx: GiroTransaction = txRes.data?.data;
                setTransaksi(tx);
                setBankAccounts(bRes.data?.data || []);
                setAccounts(cRes.data?.data || []);

                setNomorGiro(tx.nomor_giro || '');
                setTanggalGiro(tx.tanggal_giro ? tx.tanggal_giro.split('T')[0] : '');
                setTanggalJatuhTempo(tx.tanggal_jatuh_tempo ? tx.tanggal_jatuh_tempo.split('T')[0] : '');
                setBankAccountId(tx.bank_account_id ? String(tx.bank_account_id) : '');
                setJenisGiro(tx.jenis_giro as any);
                setJumlah(String(tx.jumlah || 0));
                setPenerbit(tx.penerbit || '');
                setPenerima(tx.penerima || '');
                setDaftarAkunId(tx.daftar_akun_id ? String(tx.daftar_akun_id) : '');
                setKeterangan(tx.keterangan || '');
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Gagal memuat bilyet giro');
                navigate('/kas/giro-transactions');
            } finally {
                setFetching(false);
            }
        };
        load();
    }, [id, navigate]);

    const isLocked = transaksi?.status === 'posted' || transaksi?.status_giro === 'cair';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) {
            toast.error('Giro yang sudah cair atau diposting ke jurnal tidak dapat diubah lagi');
            return;
        }

        if (!nomorGiro.trim()) {
            toast.error('Nomor Bilyet Giro wajib diisi');
            return;
        }

        if (!bankAccountId) {
            toast.error('Pilih rekening bank tujuan');
            return;
        }

        const nominal = typeof jumlah === 'string' ? parseFloat(jumlah.replace(/[^0-9.-]+/g, '')) || 0 : Number(jumlah) || 0;
        if (nominal <= 0) {
            toast.error('Nominal bilyet giro harus lebih dari 0');
            return;
        }

        setLoading(true);
        try {
            const formattedTglGiro = tanggalGiro ? `${tanggalGiro.split('T')[0]}T00:00:00Z` : undefined;
            const formattedTglJatuhTempo = tanggalJatuhTempo ? `${tanggalJatuhTempo.split('T')[0]}T00:00:00Z` : undefined;
            await api.put(`/kas/giro-transactions/${id}`, {
                nomor_giro: nomorGiro.trim(),
                tanggal_giro: formattedTglGiro,
                tanggal_jatuh_tempo: formattedTglJatuhTempo,
                bank_account_id: Number(bankAccountId),
                jenis_giro: jenisGiro,
                jumlah: nominal,
                penerbit: penerbit.trim() || undefined,
                penerima: penerima.trim() || undefined,
                daftar_akun_id: daftarAkunId ? Number(daftarAkunId) : null,
                keterangan: keterangan.trim() || undefined,
            });

            toast.success('Bilyet giro berhasil diperbarui');
            navigate('/kas/giro-transactions');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui bilyet giro');
        } finally {
            setLoading(false);
        }
    };

    const bankOptions = bankAccounts.map((b) => ({
        value: String(b.id),
        label: `${b.kode_rekening || b.nama_bank} - ${b.nama_bank} (${b.nomor_rekening})`,
        description: `A/N: ${b.nama_rekening}`,
    }));

    if (fetching) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat data bilyet giro...
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* Satu Kontainer Card Utuh */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/giro-transactions')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <FileSpreadsheet className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Bilyet Giro: {transaksi?.nomor_giro}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Status Warkat: {transaksi?.status_giro?.toUpperCase()} • Status Jurnal: {transaksi?.status?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Lock Warning */}
                        {isLocked && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-mono">
                                <Lock className="size-3.5" /> Data Terkunci (Cair/Posted)
                            </span>
                        )}
                    </div>

                    {isLocked && (
                        <div className="px-4 py-2.5 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 font-mono">
                            <AlertCircle className="size-4 text-amber-600 shrink-0" />
                            <span>
                                Bilyet giro ini telah dicairkan atau diposting ke Jurnal Umum. Seluruh formulir dikunci dari penyuntingan untuk menjaga validitas saldo bank.
                            </span>
                        </div>
                    )}

                    {/* Form Body */}
                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Parameter Giro */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Jenis Giro <span className="text-rose-500">*</span>
                                    </label>
                                    <NativeSearchableSelect
                                        value={jenisGiro}
                                        onChange={(e) => setJenisGiro(e.target.value as any)}
                                        disabled={isLocked}
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none cursor-pointer font-medium disabled:opacity-60"
                                    >
                                        <option value="masuk">Giro Masuk (Penerimaan Pelanggan)</option>
                                        <option value="keluar">Giro Keluar (Penerbitan Vendor)</option>
                                    </NativeSearchableSelect>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        No. Bilyet Giro / No. Cek <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        placeholder="Contoh: BG-123456"
                                        value={nomorGiro}
                                        onChange={(e) => setNomorGiro(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono disabled:opacity-60"
                                    />
                                </div>

                                {/* Searchable Select Rekening Bank */}
                                <div>
                                    <SearchableSelect
                                        options={bankOptions}
                                        value={bankAccountId}
                                        onValueChange={(val) => setBankAccountId(val)}
                                        disabled={isLocked}
                                        label="Rekening Bank Tujuan *"
                                        placeholder="Pilih rekening bank..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Nominal Giro (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={jumlah}
                                        onChange={(e) => setJumlah(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono font-bold disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Tanggal & COA */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Tanggal Penerbitan <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={tanggalGiro}
                                        onChange={(e) => setTanggalGiro(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono disabled:opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Tanggal Jatuh Tempo <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={tanggalJatuhTempo}
                                        onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono disabled:opacity-60"
                                    />
                                </div>

                                {/* Searchable Select Akun Terkait (COA) Sesuai Laravel */}
                                <div>
                                    <SearchableAccountSelect
                                        accounts={accounts}
                                        value={daftarAkunId}
                                        onValueChange={(val) => setDaftarAkunId(val)}
                                        disabled={isLocked}
                                        label="Akun Terkait (COA Buku Besar)"
                                        placeholder="Pilih akun terkait..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Konfirmasi Nilai Rupiah
                                    </label>
                                    <div className="h-8 px-2.5 flex items-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                        {formatRupiah(parseFloat(jumlah) || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Pihak Terkait & Keterangan */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Penerbit Giro ({jenisGiro === 'masuk' ? 'Pelanggan' : 'Perusahaan'})
                                    </label>
                                    <Input
                                        placeholder="Nama pihak yang menerbitkan bilyet..."
                                        value={penerbit}
                                        onChange={(e) => setPenerbit(e.target.value)}
                                        disabled={isLocked}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Penerima Giro ({jenisGiro === 'masuk' ? 'Perusahaan' : 'Vendor / Supplier'})
                                    </label>
                                    <Input
                                        placeholder="Nama pihak yang berhak mencairkan..."
                                        value={penerima}
                                        onChange={(e) => setPenerima(e.target.value)}
                                        disabled={isLocked}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Catatan / Keterangan
                                </label>
                                <Textarea
                                    rows={2}
                                    placeholder="Catatan tambahan mengenai warkat giro ini..."
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    disabled={isLocked}
                                    className="text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-sans disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/giro-transactions')}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                            >
                                Kembali
                            </Button>
                            {!isLocked && (
                                <Can permission="kas.giro-transaction.edit">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={loading}
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Save className="size-3.5" />
                                        <span>Simpan Perubahan</span>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
