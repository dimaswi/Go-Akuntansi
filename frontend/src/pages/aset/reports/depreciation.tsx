import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetDepreciation } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    FileBarChart,
    Printer,
    RefreshCw,
    RotateCcw,
    Calendar,
} from 'lucide-react';

export const AssetDepreciationReport: React.FC = () => {
    const [depreciations, setDepreciations] = useState<AssetDepreciation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [periodFilter, setPeriodFilter] = useState<string>(
        new Date().toISOString().slice(0, 7) // Current YYYY-MM
    );

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await assetApi.getDepreciations({
                period_date: periodFilter ? `${periodFilter}-01` : undefined,
            });

            if (res.data?.success) {
                setDepreciations(res.data.data || []);
            }
        } catch (err) {
            toast.error('Gagal memuat laporan penyusutan aset');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [periodFilter]);

    const formatCurrency = (val: number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const handlePrint = () => {
        window.print();
    };

    const totalDepPeriod = depreciations.reduce(
        (sum, d) => sum + Number(d.depreciation_amount || 0),
        0
    );
    const totalAccDep = depreciations.reduce(
        (sum, d) => sum + Number(d.accumulated_depreciation || 0),
        0
    );
    const totalBookVal = depreciations.reduce(
        (sum, d) => sum + Number(d.book_value || 0),
        0
    );

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Laporan Penyusutan' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none print:border-none print:shadow-none">
                    
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 print:hidden">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <FileBarChart className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Laporan Penyusutan & Amortisasi Aset
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Rekapitulasi beban penyusutan periodik per aset dan akun buku besar</span>
                                    {loading && <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="aset.reports.export">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrint}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 gap-1.5 shadow-none"
                                >
                                    <Printer className="size-3.5" />
                                    <span>Cetak Laporan</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5 print:hidden flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider">
                                    Pilih Periode:
                                </span>
                                <Input
                                    type="month"
                                    value={periodFilter}
                                    onChange={(e) => setPeriodFilter(e.target.value)}
                                    className="h-8 text-xs rounded-none font-mono bg-white dark:bg-neutral-950 w-44"
                                />
                            </div>

                            {periodFilter && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPeriodFilter('')}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2 rounded-none"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Semua Periode</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Print Header */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 hidden print:block text-center space-y-1">
                        <h2 className="text-base font-bold uppercase tracking-wider">
                            LAPORAN PENYUSUTAN ASET TETAP
                        </h2>
                        <p className="text-xs text-neutral-500 font-mono">
                            Periode: {periodFilter || 'Semua Periode'} • Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                        </p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-100/70 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                    <th className="py-2.5 px-3">No</th>
                                    <th className="py-2.5 px-3">Periode</th>
                                    <th className="py-2.5 px-3">Kode Aset</th>
                                    <th className="py-2.5 px-3">Nama Aset</th>
                                    <th className="py-2.5 px-3">Kategori</th>
                                    <th className="py-2.5 px-3 text-right">Harga Perolehan</th>
                                    <th className="py-2.5 px-3 text-right">Beban Depresiasi</th>
                                    <th className="py-2.5 px-3 text-right">Akumulasi Dep.</th>
                                    <th className="py-2.5 px-3 text-right">Nilai Buku</th>
                                    <th className="py-2.5 px-3 text-center">Ref. Jurnal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                                {depreciations.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center py-8 text-neutral-400 font-sans">
                                            {loading ? 'Memuat data penyusutan...' : 'Tidak ada catatan depresiasi pada periode ini.'}
                                        </td>
                                    </tr>
                                ) : (
                                    depreciations.map((d, idx) => (
                                        <tr key={d.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                            <td className="py-2.5 px-3 text-neutral-400 text-center">
                                                {idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">
                                                {d.period_date?.slice(0, 7)}
                                            </td>
                                            <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white">
                                                {d.asset?.code || `AST-${d.asset_id}`}
                                            </td>
                                            <td className="py-2.5 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                                                {d.asset?.name || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                                {d.asset?.category?.name || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                {formatCurrency(d.asset?.purchase_cost)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                                                {formatCurrency(d.depreciation_amount)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-neutral-700 dark:text-neutral-300">
                                                {formatCurrency(d.accumulated_depreciation)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(d.book_value)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                {d.journal_id ? `#JE-${d.journal_id}` : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {/* Summary Footer */}
                            {depreciations.length > 0 && (
                                <tfoot>
                                    <tr className="bg-neutral-100/90 dark:bg-neutral-900 font-bold border-t-2 border-neutral-300 dark:border-neutral-700 font-mono">
                                        <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider font-sans text-[11px]">
                                            TOTAL BEBAN PENYUSUTAN:
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(totalDepPeriod)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-neutral-700 dark:text-neutral-300">
                                            {formatCurrency(totalAccDep)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(totalBookVal)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AssetDepreciationReport;

