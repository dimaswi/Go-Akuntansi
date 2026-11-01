import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { salaryApi } from '@/api/salary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Banknote, ArrowLeft, Save, RefreshCw } from 'lucide-react';

interface AccountOption {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

export const SalaryBatchCreate: React.FC = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [periodMonth, setPeriodMonth] = useState<number>(currentMonth);
    const [periodYear, setPeriodYear] = useState<number>(currentYear);
    const [paymentAccountId, setPaymentAccountId] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [accounts, setAccounts] = useState<AccountOption[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoadingAccounts(true);
                let res: any;
                try {
                    res = await api.get('/daftar-akun');
                } catch {
                    res = await api.get('/accounts');
                }
                const raw = res.data?.data || res.data || [];
                if (Array.isArray(raw)) {
                    // Filter accounts that can be used for salary payment (aset / kewajiban)
                    const filtered = raw.filter((a: any) =>
                        ['aset', 'kewajiban'].includes(String(a.jenis_akun || '').toLowerCase())
                    );
                    const list = filtered.length > 0 ? filtered : raw;
                    setAccounts(list);

                    // Set default if any account matches kas / bank / hutang gaji
                    const defaultAcc = list.find((a: any) =>
                        a.nama_akun?.toLowerCase().includes('hutang gaji') ||
                        a.nama_akun?.toLowerCase().includes('kas') ||
                        a.nama_akun?.toLowerCase().includes('bank')
                    );
                    if (defaultAcc) {
                        setPaymentAccountId(String(defaultAcc.id));
                    }
                }
            } catch (err) {
                toast.error('Gagal memuat daftar akun');
            } finally {
                setLoadingAccounts(false);
            }
        };

        fetchAccounts();
    }, []);

    // Auto-update suggested description when month or year changes
    useEffect(() => {
        const mLabel = months.find((m) => m.value === periodMonth)?.label || '';
        setDescription(`GAJI BULAN ${mLabel.toUpperCase()} ${periodYear}`);
    }, [periodMonth, periodYear]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentAccountId) {
            toast.error('Pilih akun pembayaran / kewajiban gaji terlebih dahulu');
            return;
        }

        try {
            setSubmitting(true);
            const res = await salaryApi.createBatch({
                period_month: periodMonth,
                period_year: periodYear,
                payment_account_id: Number(paymentAccountId),
                description,
            });

            toast.success('Batch gaji berhasil dibuat! Silakan isi rincian gaji.');
            const created = res.data?.data;
            if (created?.id) {
                navigate(`/penggajian/batches/${created.id}/input-gaji`);
            } else {
                navigate('/penggajian');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal membuat batch gaji');
        } finally {
            setSubmitting(false);
        }
    };

    const breadcrumbs = [
        { title: 'Penggajian', href: '/penggajian' },
        { title: 'Daftar Batch Gaji', href: '/penggajian' },
        { title: 'Buat Batch Baru' },
    ];

    const accountOptions = [
        { value: '', label: '-- Pilih Akun Pembayaran / Kredit --' },
        ...accounts.map((a) => ({
            value: String(a.id),
            label: `${a.kode_akun} - ${a.nama_akun} (${a.jenis_akun?.toUpperCase() || ''})`,
        })),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <form
                    onSubmit={handleSubmit}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none"
                >
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/penggajian">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Banknote className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Buat Batch Gaji Baru
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Inisialisasi batch periode pembayaran upah & gaji karyawan
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body - Flat layout */}
                    <div className="p-4 space-y-6 text-xs">
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Banknote className="size-3.5 text-neutral-600" />
                                    <span>Informasi Periode & Akun Pembayaran</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Bulan Gaji <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={periodMonth}
                                        onChange={(e) => setPeriodMonth(Number(e.target.value))}
                                        required
                                        className="h-8 w-full text-xs rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 font-mono"
                                    >
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                        Tahun Anggaran <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={periodYear}
                                        onChange={(e) => setPeriodYear(Number(e.target.value))}
                                        required
                                        className="h-8 w-full text-xs rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 font-mono"
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Akun Pembayaran / Kredit (Kas, Bank, atau Hutang Gaji) <span className="text-rose-500">*</span>
                                </label>
                                {loadingAccounts ? (
                                    <div className="h-8 flex items-center text-xs text-neutral-400 font-mono">
                                        <RefreshCw className="size-3 animate-spin mr-2" />
                                        Memuat akun...
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        value={paymentAccountId}
                                        onChange={(val) => setPaymentAccountId(val)}
                                        options={accountOptions}
                                        placeholder="-- Pilih Akun Pembayaran Gaji --"
                                        className="h-8 text-xs rounded-none w-full font-mono"
                                    />
                                )}
                                <p className="text-[11px] text-neutral-500 font-mono mt-1">
                                    Akun ini akan dikreditkan secara otomatis saat batch gaji diposting ke jurnal akuntansi.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                                    Keterangan / Judul Batch
                                </label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: GAJI BULAN OKTOBER 2026..."
                                    rows={3}
                                    className="text-xs rounded-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Footer Bar */}
                    <div className="px-4 py-3 bg-neutral-50/70 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                        <Link to="/penggajian">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                            >
                                Batal
                            </Button>
                        </Link>
                        <Can permission="penggajian.create">
                            <Button
                                type="submit"
                                disabled={submitting}
                                size="sm"
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Buat Batch & Lanjut Input Gaji'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default SalaryBatchCreate;

