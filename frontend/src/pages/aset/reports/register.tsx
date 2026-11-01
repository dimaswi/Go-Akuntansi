import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, Asset, AssetCategory } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    FileSpreadsheet,
    Printer,
    Download,
    RefreshCw,
    Search,
    RotateCcw,
} from 'lucide-react';

export const AssetRegisterReport: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [aRes, cRes] = await Promise.all([
                assetApi.getAssets({
                    per_page: 1000,
                    search,
                    category_id: categoryFilter !== 'all' ? Number(categoryFilter) : undefined,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                }),
                assetApi.getCategories(),
            ]);

            if (aRes.data?.success) {
                setAssets(aRes.data.data || []);
            }
            if (cRes.data?.success) {
                setCategories(cRes.data.data || []);
            }
        } catch (err) {
            toast.error('Gagal memuat laporan register aset');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [categoryFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 200);
        return () => clearTimeout(timer);
    }, [search]);

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

    const totalCost = assets.reduce((s, a) => s + Number(a.purchase_cost || 0), 0);
    const totalAccDep = assets.reduce((s, a) => s + Number(a.accumulated_depreciation || 0), 0);
    const totalBookVal = assets.reduce((s, a) => s + Number(a.book_value || 0), 0);

    const categoryOptions = [
        { value: 'all', label: 'Semua Kategori' },
        ...categories.map((c) => ({
            value: String(c.id),
            label: `${c.code} - ${c.name}`,
        })),
    ];

    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'ACTIVE', label: 'Aktif' },
        { value: 'MAINTENANCE', label: 'Maintenance' },
        { value: 'TRANSFERRED', label: 'Ditransfer' },
        { value: 'DISPOSED', label: 'Disposed' },
    ];

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Laporan Register' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none print:border-none print:shadow-none">
                    
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 print:hidden">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <FileSpreadsheet className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Laporan Buku Register Aset Tetap
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Laporan komprehensif master aset, nilai historis perolehan, akumulasi penyusutan, dan nilai buku</span>
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
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5 print:hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari kode atau nama aset..."
                                    className="pl-8 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none font-mono"
                                />
                            </div>

                            <div>
                                <SearchableSelect
                                    options={categoryOptions}
                                    value={categoryFilter}
                                    onChange={(val) => setCategoryFilter(val)}
                                    className="h-8 text-xs rounded-none"
                                />
                            </div>

                            <div>
                                <SearchableSelect
                                    options={statusOptions}
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(val)}
                                    className="h-8 text-xs rounded-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Print Header */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 hidden print:block text-center space-y-1">
                        <h2 className="text-base font-bold uppercase tracking-wider">
                            LAPORAN REGISTER ASET TETAP
                        </h2>
                        <p className="text-xs text-neutral-500 font-mono">
                            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                        </p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-100/70 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                    <th className="py-2.5 px-3">No</th>
                                    <th className="py-2.5 px-3">Kode Aset</th>
                                    <th className="py-2.5 px-3">Nama Aset</th>
                                    <th className="py-2.5 px-3">Kategori</th>
                                    <th className="py-2.5 px-3">Unit / Ruangan</th>
                                    <th className="py-2.5 px-3">Tgl Perolehan</th>
                                    <th className="py-2.5 px-3 text-right">Harga Perolehan</th>
                                    <th className="py-2.5 px-3 text-right">Akumulasi Dep.</th>
                                    <th className="py-2.5 px-3 text-right">Nilai Buku</th>
                                    <th className="py-2.5 px-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center py-8 text-neutral-400 font-mono">
                                            {loading ? 'Memuat laporan aset...' : 'Tidak ada aset yang terdaftar.'}
                                        </td>
                                    </tr>
                                ) : (
                                    assets.map((asset, idx) => (
                                        <tr key={asset.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                            <td className="py-2.5 px-3 font-mono text-neutral-400 text-center">
                                                {idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 dark:text-white">
                                                {asset.code}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-white">
                                                {asset.name}
                                                {asset.serial_number && (
                                                    <div className="text-[10px] text-neutral-400 font-mono">
                                                        SN: {asset.serial_number}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                                                {asset.category?.name || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                                                {asset.department?.name || asset.location || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-neutral-500">
                                                {asset.purchase_date?.slice(0, 10)}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-right font-medium">
                                                {formatCurrency(asset.purchase_cost)}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-right text-rose-600 dark:text-rose-400">
                                                {formatCurrency(asset.accumulated_depreciation)}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(asset.book_value)}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                                    {asset.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {/* Summary Footer */}
                            {assets.length > 0 && (
                                <tfoot>
                                    <tr className="bg-neutral-100/90 dark:bg-neutral-900 font-bold border-t-2 border-neutral-300 dark:border-neutral-700">
                                        <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                                            TOTAL KESELURUHAN ({assets.length} Aset):
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-right font-bold">
                                            {formatCurrency(totalCost)}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(totalAccDep)}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
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

export default AssetRegisterReport;
