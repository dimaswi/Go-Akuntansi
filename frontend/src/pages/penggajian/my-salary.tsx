import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { salaryApi, SalaryDetail, PersonalSalarySummary } from '@/api/salary';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Banknote,
    Eye,
    Download,
    RefreshCw,
} from 'lucide-react';

export const MySalaryPage: React.FC = () => {
    const [slips, setSlips] = useState<SalaryDetail[]>([]);
    const [summary, setSummary] = useState<PersonalSalarySummary | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [yearFilter, setYearFilter] = useState<string>('');
    const [monthFilter, setMonthFilter] = useState<string>('');

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
    const months = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    const fetchSlips = async () => {
        try {
            setLoading(true);
            const res = await salaryApi.getMySalarySlips({
                period_year: yearFilter || undefined,
                period_month: monthFilter || undefined,
            });
            if (res.data?.success) {
                setSlips(res.data.data || []);
                setSummary(res.data.summary);
            }
        } catch (err: any) {
            toast.error('Gagal memuat histori slip gaji');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlips();
    }, [yearFilter, monthFilter]);

    const formatCurrency = (val: number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const breadcrumbs = [
        { title: 'Penggajian', href: '/penggajian' },
        { title: 'Slip Gaji Saya' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* Table Box */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                                <Banknote className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Histori Slip Gaji Saya
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono">
                                    Rincian slip penerimaan upah, tunjangan, jasa pelayanan, dan potongan
                                </p>
                            </div>
                        </div>

                        {/* Filter Strip */}
                        <div className="flex items-center gap-2">
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="h-8 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none px-2 font-mono"
                            >
                                <option value="">Semua Tahun</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            <select
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="h-8 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none px-2 font-mono"
                            >
                                <option value="">Semua Bulan</option>
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchSlips}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800"
                                title="Refresh data"
                            >
                                <RefreshCw className={loading ? 'size-3.5 animate-spin' : 'size-3.5'} />
                            </Button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-neutral-100 dark:bg-neutral-900 text-[10px] font-bold uppercase tracking-wider font-sans border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="py-2.5 px-3 text-center w-12">No</th>
                                    <th className="py-2.5 px-3">Periode Gaji</th>
                                    <th className="py-2.5 px-3">Batch Number</th>
                                    <th className="py-2.5 px-3 text-right">Total Bruto</th>
                                    <th className="py-2.5 px-3 text-right">Total Potongan</th>
                                    <th className="py-2.5 px-3 text-right w-40">Gaji Bersih (Netto)</th>
                                    <th className="py-2.5 px-3 w-44 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                {slips.length > 0 ? (
                                    slips.map((row, idx) => (
                                        <tr key={row.id || idx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                            <td className="py-2 px-3 text-center text-neutral-400">
                                                {idx + 1}
                                            </td>
                                            <td className="py-2 px-3 font-sans font-bold text-neutral-900 dark:text-white">
                                                {row.salary_batch?.period_display || `Bulan ${row.salary_batch?.period_month} ${row.salary_batch?.period_year}`}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-500 font-mono">
                                                {row.salary_batch?.batch_number || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-blue-600">
                                                {formatCurrency(row.total_pendapatan)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-rose-600">
                                                {formatCurrency(row.total_potongan)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-emerald-600 text-sm">
                                                {formatCurrency(row.gaji_bersih)}
                                            </td>
                                            <td className="py-2 px-3 text-center font-sans">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Can permission={['penggajian.slip-saya.view', 'penggajian.view']}>
                                                        <Link to={`/penggajian/slips/${row.id}`}>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-xs border border-neutral-200 dark:border-neutral-800 rounded-none gap-1.5 px-2.5 shadow-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                                title="Buka rincian lengkap gaji"
                                                            >
                                                                <Eye className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                                                <span>Detail</span>
                                                            </Button>
                                                        </Link>

                                                        <a
                                                            href={salaryApi.getSlipPdfUrl(row.id || 0)}
                                                            download
                                                            title="Download Slip PDF Resmi"
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-xs border border-neutral-200 dark:border-neutral-800 rounded-none gap-1 px-2 shadow-none text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                            >
                                                                <Download className="size-3.5" />
                                                                <span>PDF</span>
                                                            </Button>
                                                        </a>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-neutral-400 italic">
                                            {loading ? 'Memuat slip gaji...' : 'Belum ada catatan slip gaji.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default MySalaryPage;
