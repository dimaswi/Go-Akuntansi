import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { BankAccount } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Building2,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit3,
    Trash2,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Bank Account', href: '/kas/bank-accounts' },
];

export default function BankAccountIndex() {
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [jenisFilter, setJenisFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(10);

    // Dialog state
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteAcc, setDeleteAcc] = useState<BankAccount | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {};
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (jenisFilter !== 'all') params.jenis_rekening = jenisFilter;
            if (statusFilter !== 'all') params.is_aktif = statusFilter === 'aktif';

            const res = await api.get('/kas/bank-accounts', { params });
            setAccounts(res.data?.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat daftar rekening bank');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, jenisFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAccounts();
        }, 200);
        return () => clearTimeout(timer);
    }, [fetchAccounts]);

    const handleReset = () => {
        setSearchTerm('');
        setJenisFilter('all');
        setStatusFilter('all');
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setActionLoading(true);
        try {
            await api.delete(`/kas/bank-accounts/${deleteId}`);
            toast.success(`Rekening ${deleteAcc?.nama_bank || ''} berhasil dihapus`);
            setDeleteId(null);
            setDeleteAcc(null);
            fetchAccounts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus rekening bank');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSaldo = async (acc: BankAccount) => {
        try {
            await api.post(`/kas/bank-accounts/${acc.id}/update-saldo`);
            toast.success(`Saldo rekening ${acc.nama_bank} berhasil disinkronisasi`);
            fetchAccounts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyinkronkan saldo');
        }
    };

    const totalSaldoBerjalan = accounts.reduce((acc, curr) => acc + (Number(curr.saldo_berjalan) || 0), 0);
    const totalAktif = accounts.filter((a) => a.is_aktif).length;

    const total = accounts.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginatedAccounts = accounts.slice((currentPage - 1) * perPage, currentPage * perPage);

    const hasActiveFilters = searchTerm !== '' || jenisFilter !== 'all' || statusFilter !== 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* Satu Kontainer Card Utuh (Single Unified Card Container) */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Building2 className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Rekening Bank (Bank Accounts)
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                                    <span>Total {accounts.length} Rekening ({totalAktif} Aktif)</span>
                                    <span>•</span>
                                    <span>Saldo Kas Bank: {formatRupiah(totalSaldoBerjalan)}</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                    title="Reset semua filter ke default"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fetchAccounts()}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="kas.bank-account.create">
                                <Button
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    onClick={() => navigate('/kas/bank-accounts/create')}
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Rekening</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Search */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Cari Bank / No. Rekening / Nama
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari nama bank, no rekening..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Jenis Rekening */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Jenis Rekening
                                </label>
                                <NativeSearchableSelect
                                    value={jenisFilter}
                                    onChange={(e) => setJenisFilter(e.target.value)}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Jenis</option>
                                    <option value="tabungan">Tabungan (Savings)</option>
                                    <option value="giro">Giro (Checking)</option>
                                    <option value="deposito">Deposito (Time Deposit)</option>
                                    <option value="kredit">Kredit (Credit Line)</option>
                                </NativeSearchableSelect>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Status Rekening
                                </label>
                                <NativeSearchableSelect
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Non-Aktif</option>
                                </NativeSearchableSelect>
                            </div>
                        </div>
                    </div>

                    {/* 3. Strip Ringkasan Rekening Bank (Flat Divided Strip like Buku Besar - No Floating Nested Cards) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-xs font-mono">
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Total Saldo Bank</span>
                            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block mt-0.5">
                                {formatRupiah(totalSaldoBerjalan)}
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Rekening Aktif</span>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                                {totalAktif} Rekening
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Rekening Non-Aktif</span>
                            <span className="text-sm font-bold text-neutral-500 block mt-0.5">
                                {accounts.length - totalAktif} Rekening
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Total Rekening</span>
                            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block mt-0.5">
                                {accounts.length} Akun Bank
                            </span>
                        </div>
                    </div>

                    {/* 3. Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-left w-10 whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 text-left w-36 whitespace-nowrap">Kode Rekening</th>
                                    <th className="py-2.5 px-3 text-left w-44">Bank & Cabang</th>
                                    <th className="py-2.5 px-3 text-left w-48">Nama Rekening & No. Rek</th>
                                    <th className="py-2.5 px-3 text-center w-24 whitespace-nowrap">Jenis</th>
                                    <th className="py-2.5 px-3 text-left">Akun COA (Buku Besar)</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Saldo Awal</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Saldo Berjalan</th>
                                    <th className="py-2.5 px-3 text-center w-20 whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 text-right w-32 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-neutral-500 text-xs">
                                            <RefreshCw className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                                            Memuat data rekening bank...
                                        </td>
                                    </tr>
                                ) : accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-neutral-500 text-xs italic font-mono">
                                            Tidak ada data rekening bank yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAccounts.map((acc, idx) => (
                                        <tr
                                            key={acc.id}
                                            onClick={() => navigate(`/kas/bank-accounts/${acc.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-1.5 px-3 font-mono text-neutral-500 text-xs whitespace-nowrap">
                                                {(currentPage - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-1.5 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {acc.kode_rekening || '-'}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-3 max-w-[180px]">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                                                    {acc.nama_bank}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 leading-none truncate">
                                                    {acc.cabang || '-'}
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-3 max-w-[180px]">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100 text-xs truncate">
                                                    {acc.nama_rekening}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 font-mono leading-none truncate">
                                                    {acc.nomor_rekening}
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'inline-block px-1.5 py-0.5 rounded-none text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap',
                                                        acc.jenis_rekening === 'giro'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                            : acc.jenis_rekening === 'deposito'
                                                                ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                    )}
                                                >
                                                    {acc.jenis_rekening}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-3 text-xs font-mono text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                                                {acc.daftar_akun ? (
                                                    <span title={`${acc.daftar_akun.kode_akun} - ${acc.daftar_akun.nama_akun}`}>{acc.daftar_akun.kode_akun} - {acc.daftar_akun.nama_akun}</span>
                                                ) : (
                                                    <span className="italic text-neutral-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-1.5 px-3 text-right font-mono text-xs tabular-nums text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                {formatRupiah(Number(acc.saldo_awal) || 0)}
                                            </td>
                                            <td className="py-1.5 px-3 text-right font-mono font-bold text-xs tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                                {formatRupiah(Number(acc.saldo_berjalan) || 0)}
                                            </td>
                                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'inline-block px-1.5 py-0 rounded-none text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap',
                                                        acc.is_aktif
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                                                    )}
                                                >
                                                    {acc.is_aktif ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td
                                                className="py-1.5 px-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <Can permission="kas.bank-account.view">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded-none text-neutral-600 hover:text-neutral-900"
                                                            onClick={() => navigate(`/kas/bank-accounts/${acc.id}`)}
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    <Can permission="kas.bank-account.edit">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded-none text-neutral-600 hover:text-neutral-900"
                                                            onClick={() => navigate(`/kas/bank-accounts/${acc.id}/edit`)}
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded-none text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            onClick={() => handleUpdateSaldo(acc)}
                                                            title="Hitung Ulang Saldo dari Mutasi"
                                                        >
                                                            <RefreshCw className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    <Can permission="kas.bank-account.delete">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded-none text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                            onClick={() => {
                                                                setDeleteId(acc.id);
                                                                setDeleteAcc(acc);
                                                            }}
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Footer Section */}
                    <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                        <div>
                            Menampilkan{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100">
                                {total > 0 ? (currentPage - 1) * perPage + 1 : 0}
                            </strong>
                            –
                            <strong className="text-neutral-900 dark:text-neutral-100">
                                {Math.min(currentPage * perPage, total)}
                            </strong>{' '}
                            dari <strong className="text-neutral-900 dark:text-neutral-100">{total}</strong> rekening bank
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-neutral-500 font-sans">Baris per halaman:</span>
                                <NativeSearchableSelect
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="h-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-mono"
                                >
                                    {[10, 20, 50, 100].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800"
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setPage(1)}
                                    title="Halaman Pertama"
                                >
                                    <ChevronsLeft className="size-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 rounded-none border-neutral-200 dark:border-neutral-800 text-xs"
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="size-3.5 mr-0.5" />
                                    Sebelumnya
                                </Button>

                                <span className="px-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                    Hal {currentPage} / {totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 rounded-none border-neutral-200 dark:border-neutral-800 text-xs"
                                    disabled={currentPage >= totalPages || loading}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Selanjutnya
                                    <ChevronRight className="size-3.5 ml-0.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800"
                                    disabled={currentPage >= totalPages || loading}
                                    onClick={() => setPage(totalPages)}
                                    title="Halaman Terakhir"
                                >
                                    <ChevronsRight className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog Hapus */}
            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => {
                    if (!open && !actionLoading) {
                        setDeleteId(null);
                        setDeleteAcc(null);
                    }
                }}
                title="Hapus Rekening Bank"
                description={`Apakah Anda yakin ingin menghapus rekening ${deleteAcc?.nama_bank || ''} - ${deleteAcc?.nomor_rekening || ''}? Tindakan ini tidak dapat dibatalkan jika rekening memiliki mutasi.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="destructive"
                loading={actionLoading}
                onConfirm={handleDeleteConfirm}
            />
        </AppLayout>
    );
}
