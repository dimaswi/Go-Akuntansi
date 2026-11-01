import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { BankAccount, BankTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Landmark,
    Save,
    Lock,
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Repeat,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Kas & Bank', href: '/kas/bank-transactions' },
    { title: 'Transaksi Bank', href: '/kas/bank-transactions' },
    { title: 'Edit Transaksi' },
];

export default function BankTransactionEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [transaksi, setTransaksi] = useState<BankTransaction | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [bankAccountId, setBankAccountId] = useState('');
    const [tanggalTransaksi, setTanggalTransaksi] = useState('');
    const [jenisTransaksi, setJenisTransaksi] = useState<'penerimaan' | 'pengeluaran' | 'transfer_masuk' | 'transfer_keluar'>('penerimaan');
    const [kategoriTransaksi, setKategoriTransaksi] = useState('pendapatan_operasional');
    const [daftarAkunLawanId, setDaftarAkunLawanId] = useState('');
    const [jumlah, setJumlah] = useState('');
    const [pihakTerkait, setPihakTerkait] = useState('');
    const [referensi, setReferensi] = useState('');
    const [keterangan, setKeterangan] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setFetching(true);
            try {
                const [txRes, bankRes, accRes] = await Promise.all([
                    api.get(`/kas/bank-transactions/${id}`),
                    api.get('/kas/bank-accounts'),
                    api.get('/daftar-akun'),
                ]);

                const tx: BankTransaction = txRes.data.data;
                setTransaksi(tx);
                setBankAccounts(bankRes.data.data || []);
                setAccounts(accRes.data.data || []);

                setBankAccountId(String(tx.bank_account_id));
                setTanggalTransaksi(tx.tanggal_transaksi ? tx.tanggal_transaksi.split('T')[0] : '');
                setJenisTransaksi(tx.jenis_transaksi as any);
                setKategoriTransaksi(tx.kategori_transaksi || 'pendapatan_operasional');
                setDaftarAkunLawanId(tx.daftar_akun_lawan_id ? String(tx.daftar_akun_lawan_id) : '');
                setJumlah(String(tx.jumlah));
                setPihakTerkait(tx.pihak_terkait || '');
                setReferensi(tx.referensi || '');
                setKeterangan(tx.keterangan || '');
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Gagal memuat transaksi bank');
                navigate('/kas/bank-transactions');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            loadData();
        }
    }, [id, navigate]);

    const isLocked = transaksi?.status === 'posted';
    const isMasuk = jenisTransaksi === 'penerimaan' || jenisTransaksi === 'transfer_masuk';

    const handleJenisChange = (jenis: 'penerimaan' | 'pengeluaran' | 'transfer_masuk' | 'transfer_keluar') => {
        setJenisTransaksi(jenis);
        if (jenis === 'penerimaan' || jenis === 'transfer_masuk') {
            setKategoriTransaksi('pendapatan_operasional');
        } else {
            setKategoriTransaksi('biaya_operasional');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) {
            toast.error('Transaksi yang telah diposting tidak dapat diubah');
            return;
        }

        if (!bankAccountId) {
            toast.error('Pilih rekening bank tujuan');
            return;
        }

        const nominal = parseFloat(jumlah);
        if (isNaN(nominal) || nominal <= 0) {
            toast.error('Jumlah nominal transaksi harus lebih dari 0');
            return;
        }

        if (!keterangan.trim()) {
            toast.error('Keterangan transaksi wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const formattedDate = tanggalTransaksi ? `${tanggalTransaksi.split('T')[0]}T00:00:00Z` : undefined;
            await api.put(`/kas/bank-transactions/${id}`, {
                bank_account_id: Number(bankAccountId),
                tanggal_transaksi: formattedDate,
                jenis_transaksi: jenisTransaksi,
                kategori_transaksi: kategoriTransaksi,
                daftar_akun_lawan_id: daftarAkunLawanId ? Number(daftarAkunLawanId) : null,
                jumlah: nominal,
                pihak_terkait: pihakTerkait.trim(),
                referensi: referensi.trim(),
                keterangan: keterangan.trim(),
            });

            toast.success('Transaksi bank berhasil diperbarui');
            navigate('/kas/bank-transactions');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui transaksi');
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
                        Memuat data transaksi bank...
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

                    {/* 1. Header Bar: Icon-Only Back Button + Title on Left */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/bank-transactions')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Landmark className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Edit Transaksi Bank: {transaksi?.nomor_transaksi}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Status: {transaksi?.status?.toUpperCase()} • Rekening: {transaksi?.bank_account?.nama_bank}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            {isLocked ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-mono">
                                    <Lock className="size-3.5" /> Transaksi Terkunci (Posted)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 font-mono">
                                    Draft
                                </span>
                            )}
                        </div>
                    </div>

                    {isLocked && (
                        <div className="px-4 py-2.5 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 font-mono">
                            <AlertCircle className="size-4 text-amber-600 shrink-0" />
                            <span>
                                Transaksi ini telah diposting ke Jurnal Akuntansi. Data transaksi bank dikunci dari perubahan untuk menjaga konsistensi buku besar.
                            </span>
                        </div>
                    )}

                    {/* 2. Form Parameter Strip */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Searchable Select Rekening Bank */}
                                <div>
                                    <SearchableSelect
                                        options={bankOptions}
                                        value={bankAccountId}
                                        onValueChange={(val) => setBankAccountId(val)}
                                        disabled={isLocked}
                                        label="Rekening Bank *"
                                        placeholder="Pilih rekening bank..."
                                    />
                                </div>

                                {/* Tanggal Transaksi */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Tanggal Transaksi <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        value={tanggalTransaksi}
                                        onChange={(e) => setTanggalTransaksi(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono disabled:opacity-60"
                                    />
                                </div>

                                {/* Jenis Transaksi (Sesuai Laravel) */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Jenis Mutasi Bank
                                    </label>
                                    <NativeSearchableSelect
                                        value={jenisTransaksi}
                                        onChange={(e) => handleJenisChange(e.target.value as any)}
                                        disabled={isLocked}
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer disabled:opacity-60"
                                    >
                                        <option value="penerimaan">Penerimaan</option>
                                        <option value="pengeluaran">Pengeluaran</option>
                                        <option value="transfer_masuk">Transfer Masuk</option>
                                        <option value="transfer_keluar">Transfer Keluar</option>
                                    </NativeSearchableSelect>
                                </div>

                                {/* Kategori Transaksi (Sesuai Laravel) */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Kategori Mutasi
                                    </label>
                                    <NativeSearchableSelect
                                        value={kategoriTransaksi}
                                        onChange={(e) => setKategoriTransaksi(e.target.value)}
                                        disabled={isLocked}
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer disabled:opacity-60"
                                    >
                                        {isMasuk ? (
                                            <>
                                                <option value="pendapatan_operasional">Pendapatan Operasional</option>
                                                <option value="pendapatan_non_operasional">Pendapatan Non-Operasional</option>
                                                <option value="pinjaman">Pinjaman</option>
                                                <option value="modal">Modal</option>
                                                <option value="lainnya_masuk">Lainnya</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="biaya_operasional">Biaya Operasional</option>
                                                <option value="biaya_non_operasional">Biaya Non-Operasional</option>
                                                <option value="pembelian_aset">Pembelian Aset</option>
                                                <option value="pembayaran_kewajiban">Pembayaran Kewajiban</option>
                                                <option value="lainnya_keluar">Lainnya</option>
                                            </>
                                        )}
                                    </NativeSearchableSelect>
                                </div>
                            </div>
                        </div>

                        {/* 3. Account Linkage & Financial Strip */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Akun Lawan (SearchableAccountSelect) */}
                                <div>
                                    <SearchableAccountSelect
                                        accounts={accounts}
                                        value={daftarAkunLawanId}
                                        onValueChange={(val) => setDaftarAkunLawanId(val)}
                                        disabled={isLocked}
                                        label="Akun Lawan COA (Buku Besar)"
                                        placeholder="Cari akun lawan COA..."
                                    />
                                </div>

                                {/* Jumlah Nominal */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Jumlah Mutasi (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={jumlah}
                                            onChange={(e) => setJumlah(e.target.value)}
                                            disabled={isLocked}
                                            required
                                            className="h-8 text-xs font-mono font-bold rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60"
                                        />
                                        {jumlah && Number(jumlah) > 0 && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-neutral-500 pointer-events-none">
                                                {formatRupiah(Number(jumlah))}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Pihak Terkait */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Pihak Terkait
                                    </label>
                                    <Input
                                        value={pihakTerkait}
                                        onChange={(e) => setPihakTerkait(e.target.value)}
                                        disabled={isLocked}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Nomor Dokumen & Keterangan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Nomor Referensi / Bukti Transfer
                                    </label>
                                    <Input
                                        value={referensi}
                                        onChange={(e) => setReferensi(e.target.value)}
                                        disabled={isLocked}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Keterangan Transaksi <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Action Footer */}
                        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/bank-transactions')}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                            >
                                Kembali
                            </Button>
                            {!isLocked && (
                                <Can permission={['kas.bank-transaction.edit', 'kas.cash-management.daily-entry']}>
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
