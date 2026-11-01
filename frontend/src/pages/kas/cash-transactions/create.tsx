import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Receipt,
    Save,
    ArrowDownLeft,
    ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Transaksi Kas', href: '/kas/cash-transactions' },
    { title: 'Tambah Kas' },
];

export default function CashTransactionCreate() {
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [akunKasList, setAkunKasList] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);

    const [jenisTransaksi, setJenisTransaksi] = useState<'penerimaan' | 'pengeluaran'>('penerimaan');
    const [tanggalTransaksi, setTanggalTransaksi] = useState(
        new Date().toISOString().split('T')[0]
    );
    // Kategori default sesuai Laravel
    const [kategoriTransaksi, setKategoriTransaksi] = useState('penjualan');
    const [daftarAkunKasId, setDaftarAkunKasId] = useState<string>('');
    const [daftarAkunLawanId, setDaftarAkunLawanId] = useState<string>('');
    const [jumlah, setJumlah] = useState('');
    const [pihakTerkait, setPihakTerkait] = useState('');
    const [referensi, setReferensi] = useState('');
    const [keterangan, setKeterangan] = useState('');

    useEffect(() => {
        api.get('/daftar-akun')
            .then((res) => {
                const data: ChartOfAccount[] = res.data.data || [];
                setAccounts(data);
                // Filter akun kas (kode 1101 atau nama mengandung Kas)
                const kas = data.filter(
                    (a) =>
                        a.kode_akun.startsWith('1101') ||
                        a.nama_akun.toLowerCase().includes('kas')
                );
                setAkunKasList(kas.length > 0 ? kas : data);
                if (kas.length > 0) {
                    setDaftarAkunKasId(String(kas[0].id));
                }
            })
            .catch(() => toast.error('Gagal memuat bagan akun'));
    }, []);

    // Sinkronisasi kategori default saat ganti jenis transaksi sesuai Laravel
    const handleJenisChange = (jenis: 'penerimaan' | 'pengeluaran') => {
        setJenisTransaksi(jenis);
        if (jenis === 'penerimaan') {
            setKategoriTransaksi('penjualan');
        } else {
            setKategoriTransaksi('operasional');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nominal = parseFloat(jumlah);
        if (isNaN(nominal) || nominal <= 0) {
            toast.error('Jumlah nominal harus lebih dari 0');
            return;
        }

        if (!daftarAkunKasId) {
            toast.error('Rekening Kas wajib dipilih');
            return;
        }

        if (!keterangan.trim()) {
            toast.error('Keterangan transaksi wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const formattedDate = tanggalTransaksi ? `${tanggalTransaksi.split('T')[0]}T00:00:00Z` : undefined;
            await api.post('/kas/cash-transactions', {
                jenis_transaksi: jenisTransaksi,
                tanggal_transaksi: formattedDate,
                kategori_transaksi: kategoriTransaksi,
                daftar_akun_kas_id: Number(daftarAkunKasId),
                daftar_akun_lawan_id: daftarAkunLawanId ? Number(daftarAkunLawanId) : null,
                jumlah: nominal,
                pihak_terkait: pihakTerkait.trim(),
                referensi: referensi.trim(),
                keterangan: keterangan.trim(),
            });

            toast.success('Transaksi kas berhasil dicatat sebagai draft');
            navigate('/kas/cash-transactions');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan transaksi kas');
        } finally {
            setLoading(false);
        }
    };

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
                                onClick={() => navigate('/kas/cash-transactions')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Receipt className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Catat Transaksi Kas (BKM / BKK)
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Pencatatan kas masuk / kas keluar dan penetapan akun buku besar
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Jenis Transaksi Quick Toggle (Sesuai Laravel: Penerimaan Kas & Pengeluaran Kas) */}
                        <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-50 dark:bg-neutral-900">
                            <button
                                type="button"
                                onClick={() => handleJenisChange('penerimaan')}
                                className={`px-3 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors ${jenisTransaksi === 'penerimaan'
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                            >
                                <ArrowDownLeft className="size-3 text-emerald-500" />
                                <span>Penerimaan Kas (BKM)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleJenisChange('pengeluaran')}
                                className={`px-3 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-colors ${jenisTransaksi === 'pengeluaran'
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                    }`}
                            >
                                <ArrowUpRight className="size-3 text-rose-500" />
                                <span>Pengeluaran Kas (BKK)</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Form Parameter Strip (Informasi Header) */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Tanggal Transaksi */}
                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
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
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Kategori Transaksi <span className="text-rose-500">*</span>
                                    </label>
                                    <NativeSearchableSelect
                                        value={kategoriTransaksi}
                                        onChange={(e) => setKategoriTransaksi(e.target.value)}
                                        required
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer"
                                    >
                                        {jenisTransaksi === 'penerimaan' ? (
                                            <>
                                                <option value="penjualan">Penjualan</option>
                                                <option value="piutang">Pelunasan Piutang</option>
                                                <option value="investasi">Investasi/Modal</option>
                                                <option value="bunga">Bunga Bank</option>
                                                <option value="lain_lain">Lain-lain</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="pembelian">Pembelian</option>
                                                <option value="gaji">Gaji/Upah</option>
                                                <option value="operasional">Biaya Operasional</option>
                                                <option value="pinjaman">Pembayaran Pinjaman</option>
                                                <option value="lain_lain">Lain-lain</option>
                                            </>
                                        )}
                                    </NativeSearchableSelect>
                                </div>

                                {/* Pihak Terkait */}
                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Pihak Terkait (Penerima / Pembayar)
                                    </label>
                                    <Input
                                        type="text"
                                        value={pihakTerkait}
                                        onChange={(e) => setPihakTerkait(e.target.value)}
                                        placeholder="Contoh: Supplier Obat / Pasien"
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                {/* Nomor Referensi */}
                                <div>
                                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                        Nomor Referensi / Dokumen
                                    </label>
                                    <Input
                                        type="text"
                                        value={referensi}
                                        onChange={(e) => setReferensi(e.target.value)}
                                        placeholder="Contoh: INV-2026-001 / KW-098"
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Akun dan Nominal Strip (Menggunakan SearchableAccountSelect) */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Searchable Select Rekening Kas */}
                                <div>
                                    <SearchableAccountSelect
                                        accounts={akunKasList}
                                        value={daftarAkunKasId}
                                        onValueChange={(val) => setDaftarAkunKasId(val)}
                                        label="Rekening Akun Kas *"
                                        placeholder="Cari rekening akun kas..."
                                    />
                                </div>

                                {/* Searchable Select Akun Lawan */}
                                <div>
                                    <SearchableAccountSelect
                                        accounts={accounts}
                                        value={daftarAkunLawanId}
                                        onValueChange={(val) => setDaftarAkunLawanId(val)}
                                        label="Akun Lawan (COA Buku Besar)"
                                        placeholder="Cari akun pendapatan / beban / hutang..."
                                    />
                                </div>

                                {/* Jumlah Nominal */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Jumlah Nominal (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={jumlah}
                                            onChange={(e) => setJumlah(e.target.value)}
                                            placeholder="0"
                                            required
                                            className="h-8 text-xs font-mono font-bold rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                        />
                                        {jumlah && Number(jumlah) > 0 && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-500 pointer-events-none">
                                                {formatRupiah(Number(jumlah))}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="mt-4">
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                                    Keterangan Transaksi <span className="text-rose-500">*</span>
                                </label>
                                <Textarea
                                    rows={2}
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    placeholder="Uraian detail transaksi kas..."
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
                                onClick={() => navigate('/kas/cash-transactions')}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                            >
                                Batal
                            </Button>
                            <Can permission={['kas.cash-transaction.create', 'kas.cash-management.daily-entry']}>
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
