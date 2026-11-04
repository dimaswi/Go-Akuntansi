import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { salaryApi, SalaryDetail } from '@/api/salary';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ArrowLeft,
    RefreshCw,
    Download,
    ExternalLink,
    Banknote,
    CheckCircle2,
    Clock,
    User,
    Calendar,
    Wallet,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

const formatRupiah = (val: number | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const terbilang = (n: number): string => {
    if (n < 0) return 'Minus ' + terbilang(-n);
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (n < 12) return satuan[n];
    if (n < 20) return terbilang(n - 10) + ' Belas';
    if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh' + (n % 10 > 0 ? ' ' + terbilang(n % 10) : '');
    if (n < 200) return 'Seratus' + (n - 100 > 0 ? ' ' + terbilang(n - 100) : '');
    if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus' + (n % 100 > 0 ? ' ' + terbilang(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n - 1000 > 0 ? ' ' + terbilang(n - 1000) : '');
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 > 0 ? ' ' + terbilang(n % 1000) : '');
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 > 0 ? ' ' + terbilang(n % 1000000) : '');
    if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 > 0 ? ' ' + terbilang(n % 1000000000) : '');
    return terbilang(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 > 0 ? ' ' + terbilang(n % 1000000000000) : '');
};

export const SalarySlipPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [slip, setSlip] = useState<SalaryDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchSlip = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await salaryApi.getSalarySlip(id);
            if (res.data?.success) {
                setSlip(res.data.data);
            }
        } catch (err: any) {
            toast.error('Gagal memuat detail gaji');
            navigate('/penggajian/my-salary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlip();
    }, [id]);

    const breadcrumbs = [
        { title: 'Penggajian', href: '/penggajian' },
        { title: 'Slip Gaji Saya', href: '/penggajian/my-salary' },
        { title: slip ? `${slip.nama_pegawai}` : 'Detail Gaji' },
    ];

    if (loading && !slip) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-16 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat data slip gaji...
                </div>
            </AppLayout>
        );
    }

    if (!slip) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Data gaji tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    const periodDisplay = slip.salary_batch?.period_display || `Bulan ${slip.salary_batch?.period_month} ${slip.salary_batch?.period_year}`;
    const batchNumber = slip.salary_batch?.batch_number || '-';
    const isPosted = slip.salary_batch?.status === 'posted';

    const incomeItems = [
        { label: 'Gaji Pokok', val: slip.gaji_pokok },
        { label: 'Tunjangan SIA', val: slip.tunjangan_sia },
        { label: 'Tunjangan Transportasi', val: slip.tunjangan_transportasi },
        { label: 'Tunjangan Jabatan', val: slip.tunjangan_jabatan },
        { label: 'Uang Jaga Utama', val: slip.uang_jaga_utama },
        { label: 'Uang Jaga Pratama', val: slip.uang_jaga_pratama },
        { label: 'Jasa Pelayanan Pratama', val: slip.jasa_pelayanan_pratama },
        { label: 'Jasa Pelayanan Rawat Inap', val: slip.jasa_pelayanan_rawat_inap },
        { label: 'Jasa Pelayanan Rawat Jalan', val: slip.jasa_pelayanan_rawat_jalan },
        { label: 'Jasa Pelayanan Rawat Jalan BPJS', val: slip.jasa_pelayanan_rawat_jalan_bpjs },
        { label: 'Tugas Tambahan', val: slip.tugas_tambahan },
    ].filter((item) => Number(item.val || 0) > 0);

    const deductionItems = [
        { label: 'PPh 21', val: slip.pph_21 },
        { label: 'Infaq', val: slip.infaq },
        { label: 'BPJS Kesehatan', val: slip.bpjs_kesehatan },
        { label: 'BPJS Ketenagakerjaan', val: slip.bpjs_ketenagakerjaan },
        { label: 'Denda Absen', val: slip.denda_absen },
        { label: 'Arisan Keluarga', val: slip.arisan_keluarga },
        { label: 'Denda Ngaji', val: slip.denda_ngaji },
        { label: 'Kasbon', val: slip.kasbon },
        { label: 'Dana Sosial', val: slip.dana_sosial },
    ].filter((item) => Number(item.val || 0) > 0);

    const cleanTerbilang =
        Number(slip.gaji_bersih || 0) > 0
            ? terbilang(Math.floor(Number(slip.gaji_bersih))) + ' Rupiah'
            : 'Nol Rupiah';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* Main Card Container */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/penggajian/my-salary">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800"
                                    title="Kembali ke Daftar Slip Gaji"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>

                            <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                                <Banknote className="size-4" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        {slip.nama_pegawai}
                                    </h1>
                                    <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border font-mono uppercase ${
                                            slip.salary_batch?.status === 'posted'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                                : slip.salary_batch?.status === 'done'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                                                : 'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                                        }`}
                                    >
                                        {slip.salary_batch?.status === 'posted' ? (
                                            <CheckCircle2 className="size-3" />
                                        ) : slip.salary_batch?.status === 'done' ? (
                                            <CheckCircle2 className="size-3 text-blue-600" />
                                        ) : (
                                            <Clock className="size-3" />
                                        )}
                                        {slip.salary_batch?.status || 'draft'}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono">
                                    NIP: {slip.nip || '-'} • Periode: {periodDisplay} • Batch: {batchNumber}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Can permission={['penggajian.slip-saya.view', 'penggajian.view']}>
                                <a
                                    href={salaryApi.getSlipPdfUrl(slip.id || id || 0, true)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs gap-1.5 font-medium"
                                        title="Buka dokumen PDF di tab baru"
                                    >
                                        <ExternalLink className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                        <span>Buka PDF</span>
                                    </Button>
                                </a>

                                <a
                                    href={salaryApi.getSlipPdfUrl(slip.id || id || 0)}
                                    download
                                >
                                    <Button
                                        size="sm"
                                        className="h-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-none text-xs gap-1.5 font-semibold shadow-none"
                                        title="Download file PDF slip gaji resmi yang digenerate oleh backend"
                                    >
                                        <Download className="size-3.5" />
                                        <span>Download PDF</span>
                                    </Button>
                                </a>
                            </Can>
                        </div>
                    </div>

                    {/* KPI Metric Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-x divide-y md:divide-y-0 divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                        <div className="p-4">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total Pendapatan (Bruto)</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <ArrowUpRight className="size-4 text-blue-600 shrink-0" />
                                <span className="text-sm sm:text-base font-bold font-mono text-blue-600">
                                    {formatRupiah(slip.total_pendapatan)}
                                </span>
                            </div>
                        </div>

                        <div className="p-4">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total Potongan</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <ArrowDownRight className="size-4 text-rose-600 shrink-0" />
                                <span className="text-sm sm:text-base font-bold font-mono text-rose-600">
                                    {formatRupiah(slip.total_potongan)}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                                Gaji Bersih (Netto)
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Wallet className="size-4 text-emerald-600 shrink-0" />
                                <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                                    {formatRupiah(slip.gaji_bersih)}
                                </span>
                            </div>
                        </div>

                        <div className="p-4">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Periode & Batch</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Calendar className="size-4 text-neutral-500 shrink-0" />
                                <span className="text-xs font-mono text-neutral-800 dark:text-neutral-200 truncate">
                                    {batchNumber}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Employee & Account Metadata Row */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <User className="size-4 text-neutral-400" />
                            <div>
                                <span className="text-neutral-400 block text-[10px] uppercase">Karyawan</span>
                                <span className="font-bold text-neutral-900 dark:text-white">{slip.nama_pegawai}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <CreditCard className="size-4 text-neutral-400" />
                            <div>
                                <span className="text-neutral-400 block text-[10px] uppercase">Nomor Induk Pegawai</span>
                                <span className="text-neutral-700 dark:text-neutral-300">{slip.nip || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Banknote className="size-4 text-neutral-400" />
                            <div>
                                <span className="text-neutral-400 block text-[10px] uppercase">Akun Pembayaran Batch</span>
                                <span className="text-neutral-700 dark:text-neutral-300">
                                    {slip.salary_batch?.payment_account
                                        ? `${slip.salary_batch.payment_account.kode_akun} - ${slip.salary_batch.payment_account.nama_akun}`
                                        : 'Kas / Bank Operasional'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Section: 2 ERP Tables */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white dark:bg-neutral-950">
                        {/* Table 1: Rincian Pendapatan */}
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
                            <div className="bg-neutral-100 dark:bg-neutral-900 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <span className="size-2 bg-blue-600 rounded-none inline-block"></span>
                                    Rincian Pendapatan (Bruto)
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500">
                                    {incomeItems.length} Komponen
                                </span>
                            </div>
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 text-[10px] uppercase font-bold text-neutral-500">
                                        <th className="py-2 px-3">Komponen Pendapatan</th>
                                        <th className="py-2 px-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                    {incomeItems.length > 0 ? (
                                        incomeItems.map((item) => (
                                            <tr key={item.label} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                <td className="py-2 px-3 font-sans text-neutral-700 dark:text-neutral-300">
                                                    {item.label}
                                                </td>
                                                <td className="py-2 px-3 text-right text-neutral-900 dark:text-white">
                                                    {formatRupiah(item.val)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="py-6 text-center text-neutral-400 italic">
                                                Tidak ada komponen pendapatan tercatat
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-neutral-200 dark:border-neutral-800 bg-blue-50/50 dark:bg-blue-950/20 font-bold">
                                        <td className="py-2.5 px-3 font-sans text-blue-950 dark:text-blue-300">
                                            Total Pendapatan:
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-400">
                                            {formatRupiah(slip.total_pendapatan)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Table 2: Rincian Potongan */}
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
                            <div className="bg-neutral-100 dark:bg-neutral-900 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <span className="size-2 bg-rose-600 rounded-none inline-block"></span>
                                    Rincian Potongan
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500">
                                    {deductionItems.length} Komponen
                                </span>
                            </div>
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 text-[10px] uppercase font-bold text-neutral-500">
                                        <th className="py-2 px-3">Komponen Potongan</th>
                                        <th className="py-2 px-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                    {deductionItems.length > 0 ? (
                                        deductionItems.map((item) => (
                                            <tr key={item.label} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                                <td className="py-2 px-3 font-sans text-neutral-700 dark:text-neutral-300">
                                                    {item.label}
                                                </td>
                                                <td className="py-2 px-3 text-right text-rose-600 font-medium">
                                                    {formatRupiah(item.val)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="py-6 text-center text-neutral-400 italic">
                                                Tidak ada potongan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-neutral-200 dark:border-neutral-800 bg-rose-50/50 dark:bg-rose-950/20 font-bold">
                                        <td className="py-2.5 px-3 font-sans text-rose-950 dark:text-rose-300">
                                            Total Potongan:
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono text-rose-700 dark:text-rose-400">
                                            {formatRupiah(slip.total_potongan)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Netto & Terbilang Summary Banner */}
                    <div className="mx-4 sm:mx-6 mb-6 p-4 border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                                Gaji Bersih Diterima (Take Home Pay)
                            </span>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-serif italic mt-0.5">
                                Terbilang: <span className="font-semibold text-neutral-900 dark:text-white">"{cleanTerbilang}"</span>
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                                {formatRupiah(slip.gaji_bersih)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default SalarySlipPage;
