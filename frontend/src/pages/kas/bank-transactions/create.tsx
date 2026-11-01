import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { BankAccount } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Landmark,
    Save,
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
    { title: 'Catat Transaksi' },
];

export default function BankTransactionCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);

    const [bankAccountId, setBankAccountId] = useState(searchParams.get('bank_account_id') || '');
    const [tanggalTransaksi, setTanggalTransaksi] = useState(
        new Date().toISOString().split('T')[0]
    );
    // Sesuai Laravel: penerimaan, pengeluaran, transfer_masuk, transfer_keluar
    const [jenisTransaksi, setJenisTransaksi] = useState<'penerimaan' | 'pengeluaran' | 'transfer_masuk' | 'transfer_keluar'>('penerimaan');
    const [kategoriTransaksi, setKategoriTransaksi] = useState('pendapatan_operasional');
    const [daftarAkunLawanId, setDaftarAkunLawanId] = useState('');
    const [jumlah, setJumlah] = useState('');
    const [pihakTerkait, setPihakTerkait] = useState('');
    const [referensi, setReferensi] = useState('');
    const [keterangan, setKeterangan] = useState('');

    useEffect(() => {
        Promise.all([
            api.get('/kas/bank-accounts'),
            api.get('/daftar-akun'),
        ])
            .then(([bankRes, accRes]) => {
                const banks: BankAccount[] = bankRes.data.data || [];
                setBankAccounts(banks);
                setAccounts(accRes.data.data || []);

                if (!bankAccountId && banks.length > 0) {
                    setBankAccountId(String(banks[0].id));
                }
            })
            .catch(() => toast.error('Gagal memuat data master bank & akun'));
    }, [bankAccountId]);

    const handleJenisChange = (jenis: 'penerimaan' | 'pengeluaran' | 'transfer_masuk' | 'transfer_keluar') => {
        setJenisTransaksi(jenis);
        if (jenis === 'penerimaan' || jenis === 'transfer_masuk') {
            setKategoriTransaksi('pendapatan_operasional');
        } else {
            setKategoriTransaksi('biaya_operasional');
        }
    };

    const isMasuk = jenisTransaksi === 'penerimaan' || jenisTransaksi === 'transfer_masuk';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bankAccountId) {
            toast.error('Pilih rekening bank tujuan transaksi');
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
            await api.post('/kas/bank-transactions', {
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

            toast.success('Transaksi bank berhasil dicatat dalam status draft');
            navigate('/kas/bank-transactions');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan transaksi bank');
        } finally {
            setLoading(false);
        }
    };

    const bankOptions = bankAccounts.map((b) => ({
        value: String(b.id),
        label: `${b.kode_rekening || b.nama_bank} - ${b.nama_bank} (${b.nomor_rekening})`,
        description: `A/N: ${b.nama_rekening}`,
    }));

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
                                        Catat Transaksi Bank Baru
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Pencatatan mutasi perbankan entitas bisnis
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Jenis Mutasi Quick Toggle (Sesuai Laravel: Penerimaan, Pengeluaran, Transfer Masuk, Transfer Keluar) */}
                        <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-50 dark:bg-neutral-900">
                            <button
                                type="button"
                                onClick={() => handleJenisChange('penerimaan')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors ${jenisTransaksi === 'penerimaan'
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                            >
                                <ArrowDownLeft className="size-3 text-emerald-500" />
                                <span>Penerimaan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleJenisChange('pengeluaran')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors ${jenisTransaksi === 'pengeluaran'
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                            >
                                <ArrowUpRight className="size-3 text-rose-500" />
                                <span>Pengeluaran</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleJenisChange('transfer_masuk')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors ${jenisTransaksi === 'transfer_masuk'
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                            >
                                <Repeat className="size-3 text-blue-500" />
                                <span>Transfer Masuk</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleJenisChange('transfer_keluar')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors ${jenisTransaksi === 'transfer_keluar'
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                            >
                                <Repeat className="size-3 text-amber-500" />
                                <span>Transfer Keluar</span>
                            </button>
                        </div>
                    </div>

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
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>

                                {/* Kategori Transaksi (Persis Sistem Laravel) */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Kategori Transaksi <span className="text-rose-500">*</span>
                                    </label>
                                    <NativeSearchableSelect
                                        value={kategoriTransaksi}
                                        onChange={(e) => setKategoriTransaksi(e.target.value)}
                                        required
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer"
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

                                {/* Nomor Dokumen / Referensi */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Nomor Referensi / Bukti Transfer
                                    </label>
                                    <Input
                                        placeholder="Contoh: TRF-BCA-88912"
                                        value={referensi}
                                        onChange={(e) => setReferensi(e.target.value)}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
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
                                        label="Akun Lawan (COA Buku Besar)"
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
                                            placeholder="0"
                                            value={jumlah}
                                            onChange={(e) => setJumlah(e.target.value)}
                                            required
                                            className="h-8 text-xs font-mono font-bold rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
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
                                        Pihak Terkait (Penyetor / Penerima Transfer)
                                    </label>
                                    <Input
                                        placeholder="Contoh: PT Sumber Rejeki / Bendahara"
                                        value={pihakTerkait}
                                        onChange={(e) => setPihakTerkait(e.target.value)}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="mt-4">
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Keterangan Transaksi Bank <span className="text-rose-500">*</span>
                                </label>
                                <Textarea
                                    rows={2}
                                    placeholder="Uraian keterangan transaksi bank..."
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    required
                                    className="text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-sans"
                                />
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
                                Batal
                            </Button>
                            <Can permission={['kas.bank-transaction.create', 'kas.cash-management.daily-entry']}>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={loading}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>Simpan Draft</span>
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
