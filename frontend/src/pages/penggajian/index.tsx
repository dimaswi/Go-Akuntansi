import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { salaryApi, SalaryBatch, SalarySummary } from '@/api/salary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Can } from '@/components/can';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Banknote,
    FileSpreadsheet,
    Send,
    Edit3,
    Trash2,
    Eye,
    Plus,
    RefreshCw,
    Search,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CheckCircle2,
    Clock,
    Users,
} from 'lucide-react';

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

export const SalaryBatchesIndex: React.FC = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState<SalaryBatch[]>([]);
    const [summary, setSummary] = useState<SalarySummary>({
        total_draft: 0,
        total_done: 0,
        total_posted: 0,
        total_employees_all: 0,
        total_gaji_bersih_posted: 0,
    });
    const [loading, setLoading] = useState<boolean>(true);

    // Filters
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [monthFilter, setMonthFilter] = useState<string>('');

    // Pagination
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    // Delete Modal
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; batch: SalaryBatch | null }>({
        open: false,
        batch: null,
    });
    const [deleting, setDeleting] = useState<boolean>(false);

    // Quick Edit Description Modal
    const [editDialog, setEditDialog] = useState<{ open: boolean; batch: SalaryBatch | null; description: string }>({
        open: false,
        batch: null,
        description: '',
    });
    const [savingEdit, setSavingEdit] = useState<boolean>(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const res = await salaryApi.getBatches({
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                period_year: yearFilter || undefined,
                period_month: monthFilter || undefined,
            });
            if (res.data?.success) {
                setBatches(res.data.data || []);
                if (res.data.summary) {
                    setSummary(res.data.summary);
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal memuat daftar batch gaji');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, [statusFilter, yearFilter, monthFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchBatches();
    };

    const handleDelete = async () => {
        if (!deleteDialog.batch) return;
        try {
            setDeleting(true);
            await salaryApi.deleteBatch(deleteDialog.batch.id);
            toast.success('Batch gaji berhasil dihapus');
            setDeleteDialog({ open: false, batch: null });
            fetchBatches();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus batch gaji');
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editDialog.batch) return;
        try {
            setSavingEdit(true);
            await salaryApi.updateBatch(editDialog.batch.id, { description: editDialog.description });
            toast.success('Keterangan batch berhasil diperbarui');
            setEditDialog({ open: false, batch: null, description: '' });
            fetchBatches();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal memperbarui batch');
        } finally {
            setSavingEdit(false);
        }
    };

    const formatCurrency = (val: number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    // Client-side pagination over fetched batches
    const totalPages = Math.max(1, Math.ceil(batches.length / perPage));
    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return batches.slice(start, start + perPage);
    }, [batches, page, perPage]);

    const hasActiveFilters = search !== '' || statusFilter !== 'all' || yearFilter !== '' || monthFilter !== '';

    const breadcrumbs = [
        { title: 'Penggajian', href: '/penggajian' },
        { title: 'Daftar Batch Gaji' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* Main Unified Box */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Banknote className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Penggajian & Upah Karyawan (Payroll)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {batches.length} Batch Periode Gaji</span>
                                    {loading && <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        setStatusFilter('all');
                                        setYearFilter('');
                                        setMonthFilter('');
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchBatches}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="penggajian.create">
                                <Link to="/penggajian/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Buat Batch Baru</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
                            <div className="relative min-w-[220px] flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari batch number, keterangan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 text-xs pl-8 pr-3 rounded-none bg-white dark:bg-neutral-950 font-mono"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 px-3 shadow-none"
                            >
                                Cari
                            </Button>

                            <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800 hidden sm:block mx-1" />

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="h-8 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none px-2 text-neutral-700 dark:text-neutral-300 font-sans"
                            >
                                <option value="all">Semua Status</option>
                                <option value="draft">Draft</option>
                                <option value="done">Done</option>
                                <option value="posted">Posted</option>
                            </select>

                            {/* Year Filter */}
                            <select
                                value={yearFilter}
                                onChange={(e) => {
                                    setYearFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="h-8 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none px-2 text-neutral-700 dark:text-neutral-300 font-sans"
                            >
                                <option value="">Semua Tahun</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            {/* Month Filter */}
                            <select
                                value={monthFilter}
                                onChange={(e) => {
                                    setMonthFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="h-8 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none px-2 text-neutral-700 dark:text-neutral-300 font-sans"
                            >
                                <option value="">Semua Bulan</option>
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-sans">
                                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                                    <th className="py-2.5 px-3 w-44">Batch Number</th>
                                    <th className="py-2.5 px-3 w-36">Periode</th>
                                    <th className="py-2.5 px-3">Keterangan</th>
                                    <th className="py-2.5 px-3 w-24 text-center">Karyawan</th>
                                    <th className="py-2.5 px-3 w-40 text-right">Total Gaji Bersih</th>
                                    <th className="py-2.5 px-3 w-28 text-center">Status</th>
                                    <th className="py-2.5 px-3 w-36 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                {paginated.length > 0 ? (
                                    paginated.map((row, idx) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition-colors"
                                        >
                                            <td className="py-2 px-3 text-center text-neutral-400">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 font-bold text-neutral-900 dark:text-white">
                                                {row.batch_number}
                                            </td>
                                            <td className="py-2 px-3 font-sans font-medium text-neutral-700 dark:text-neutral-300">
                                                {row.period_display}
                                            </td>
                                            <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400 truncate max-w-xs">
                                                {row.description || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold text-neutral-900 dark:text-white">
                                                {row.total_employees}
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-neutral-900 dark:text-white">
                                                {formatCurrency(row.total_gaji_bersih)}
                                            </td>
                                            <td className="py-2 px-3 text-center font-sans">
                                                <div>
                                                    <span
                                                        className={cn(
                                                            'px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border',
                                                            row.status === 'posted'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                                : row.status === 'done'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                        )}
                                                    >
                                                        {row.status}
                                                    </span>
                                                    {row.journal && (
                                                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                                            {row.journal.nomor_jurnal}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-center font-sans">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Isi Gaji / Spreadsheet icon */}
                                                    {row.status !== 'posted' ? (
                                                        <Can permission="penggajian.input-gaji">
                                                            <Link
                                                                to={`/penggajian/batches/${row.id}/input-gaji`}
                                                                title="Input / Edit Rincian Gaji"
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-blue-600 shadow-none hover:bg-blue-50"
                                                                >
                                                                    <FileSpreadsheet className="size-3.5" />
                                                                </Button>
                                                            </Link>
                                                        </Can>
                                                    ) : (
                                                        <Can permission="penggajian.view">
                                                            <Link
                                                                to={`/penggajian/batches/${row.id}/input-gaji`}
                                                                title="Lihat Rincian Gaji"
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-neutral-600 shadow-none hover:bg-neutral-50"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </Button>
                                                            </Link>
                                                        </Can>
                                                    )}

                                                    {/* Post to journal */}
                                                    {row.status !== 'posted' && row.total_employees > 0 && (
                                                        <Can permission="penggajian.post-to-journal">
                                                            <Link
                                                                to={`/penggajian/batches/${row.id}/post-to-journal`}
                                                                title="Posting ke Jurnal Akuntansi"
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-emerald-600 shadow-none hover:bg-emerald-50"
                                                                >
                                                                    <Send className="size-3.5" />
                                                                </Button>
                                                            </Link>
                                                        </Can>
                                                    )}

                                                    {/* Edit Description */}
                                                    {row.status !== 'posted' && (
                                                        <Can permission="penggajian.edit">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditDialog({
                                                                    open: true,
                                                                    batch: row,
                                                                    description: row.description || '',
                                                                })}
                                                                className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-amber-600 shadow-none hover:bg-amber-50"
                                                                title="Ubah Keterangan Batch"
                                                            >
                                                                <Edit3 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    )}

                                                    {/* Delete */}
                                                    {row.status !== 'posted' && (
                                                        <Can permission="penggajian.delete">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setDeleteDialog({ open: true, batch: row })}
                                                                className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 text-rose-600 shadow-none hover:bg-rose-50"
                                                                title="Hapus Batch Gaji"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-neutral-400 italic">
                                            {loading ? 'Memuat data batch gaji...' : 'Belum ada data batch gaji.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs">
                        <div className="flex items-center gap-2 text-neutral-500 font-mono">
                            <span>Per halaman:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-7 w-16 text-xs bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-none px-1.5 font-mono text-neutral-900 dark:text-neutral-100"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="ml-2">
                                Menampilkan {batches.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, batches.length)} dari {batches.length} data
                            </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono">
                            <span className="text-neutral-500 mr-2">
                                Hal {page} dari {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                                className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page === totalPages}
                                className="h-7 w-7 p-0 rounded-none border border-neutral-200 dark:border-neutral-800"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ ...deleteDialog, open })}>
                <DialogContent className="rounded-none sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase tracking-tight">Konfirmasi Hapus Batch</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500 font-mono">
                            Apakah Anda yakin ingin menghapus batch <strong>{deleteDialog.batch?.batch_number}</strong>?
                            <br />Seluruh rincian gaji karyawan dalam batch ini juga akan terhapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: false, batch: null })}
                            disabled={deleting}
                            className="rounded-none h-8 text-xs"
                        >
                            Batal
                        </Button>
                        <Can permission="penggajian.delete">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-none h-8 text-xs font-semibold shadow-none"
                            >
                                {deleting ? 'Menghapus...' : 'Ya, Hapus Batch'}
                            </Button>
                        </Can>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Description Modal */}
            <Dialog open={editDialog.open} onOpenChange={(open) => !savingEdit && setEditDialog({ ...editDialog, open })}>
                <DialogContent className="rounded-none sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase tracking-tight">Ubah Keterangan Batch</DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500 font-mono">
                            Batch: <strong>{editDialog.batch?.batch_number}</strong> ({editDialog.batch?.period_display})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                            Keterangan
                        </label>
                        <Input
                            type="text"
                            value={editDialog.description}
                            onChange={(e) => setEditDialog({ ...editDialog, description: e.target.value })}
                            className="h-8 text-xs rounded-none font-mono"
                            placeholder="Contoh: Gaji Bulan Oktober 2026..."
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditDialog({ open: false, batch: null, description: '' })}
                            disabled={savingEdit}
                            className="rounded-none h-8 text-xs"
                        >
                            Batal
                        </Button>
                        <Can permission="penggajian.edit">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={savingEdit}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-none h-8 text-xs font-semibold shadow-none"
                            >
                                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </Can>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default SalaryBatchesIndex;

