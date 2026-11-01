import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { BankAccount, BankTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Edit3,
    Plus,
    RefreshCw,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Search,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Rekening Bank', href: '/kas/bank-accounts' },
    { title: 'Buku Rekening' },
];

export default function BankAccountShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [account, setAccount] = useState<BankAccount | null>(null);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [accRes, txRes] = await Promise.all([
                api.get(`/kas/bank-accounts/${id}`),
                api.get('/kas/bank-transactions', { params: { bank_account_id: id, limit: 50 } }),
            ]);

            setAccount(accRes.data.data);
            setTransactions(txRes.data.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat rincian rekening bank');
            navigate('/kas/bank-accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const handleUpdateSaldo = async () => {
        if (!account) return;
        setSyncing(true);
        try {
            await api.post(`/kas/bank-accounts/${account.id}/update-saldo`);
            toast.success('Saldo rekening bank berhasil dihitung ulang dan disinkronkan');
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghitung ulang saldo');
        } finally {
            setSyncing(false);
        }
    };

    if (loading || !account) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat data buku rekening...
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

                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/bank-accounts')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Building2 className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            {account.nama_bank} - {account.nomor_rekening}
                                        </h1>
                                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 border font-semibold bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700">
                                            {account.jenis_rekening}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        A/N: {account.nama_rekening} • {account.cabang || 'Cabang Utama'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons on Right */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Can permission="kas.bank-account.edit">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUpdateSaldo}
                                    disabled={syncing}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none gap-1.5"
                                    title="Hitung Ulang Saldo dari Seluruh Mutasi"
                                >
                                    <RefreshCw className={cn('size-3.5', syncing && 'animate-spin')} />
                                    <span>Hitung Ulang Saldo</span>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none gap-1.5"
                                >
                                    <Link to={`/kas/bank-accounts/${account.id}/edit`}>
                                        <Edit3 className="size-3.5" />
                                        <span>Edit</span>
                                    </Link>
                                </Button>
                            </Can>

                            <Can permission={['kas.bank-transaction.create', 'kas.cash-management.daily-entry']}>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Link to={`/kas/bank-transactions/create?bank_account_id=${account.id}`}>
                                        <Plus className="size-3.5" />
                                        <span>Mutasi Bank Baru</span>
                                    </Link>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Flat KPI Financial Strip (Divided seamlessly) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-xs font-mono">
                        <div className="px-4 py-2.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 block">Saldo Awal</span>
                            <span className="text-sm font-bold text-neutral-900 dark:text-white block mt-0.5">
                                {formatRupiah(Number(account.saldo_awal) || 0)}
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 block">Saldo Berjalan (Sistem)</span>
                            <span className={cn(
                                'text-sm font-bold block mt-0.5',
                                Number(account.saldo_berjalan) < 0 ? 'text-rose-600 font-semibold' : 'text-neutral-900 dark:text-white'
                            )}>
                                {formatRupiah(Number(account.saldo_berjalan) || 0)}
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 block">Kaitan Akun COA</span>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block mt-0.5 truncate">
                                {account.daftar_akun ? `${account.daftar_akun.kode_akun} - ${account.daftar_akun.nama_akun}` : 'Belum Ditautkan'}
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 block">Status Rekening</span>
                            <span className={cn(
                                'text-xs font-bold block mt-0.5 uppercase',
                                (account.is_active ?? account.is_aktif) ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-500'
                            )}>
                                {(account.is_active ?? account.is_aktif) ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </div>
                    </div>

                    {/* 3. Subheader: Riwayat Mutasi Rekening */}
                    <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                Buku Riwayat Mutasi Rekening Koran (50 Transaksi Terakhir)
                            </span>
                            <p className="text-[11px] text-neutral-500 font-mono">
                                {transactions.length} Mutasi Terdaftar
                            </p>
                        </div>
                    </div>

                    {/* 4. Flat Direct Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-mono">
                                    <th className="py-2.5 px-3 w-36">No. Transaksi</th>
                                    <th className="py-2.5 px-3 w-28">Tanggal</th>
                                    <th className="py-2.5 px-3 w-32">Jenis Mutasi</th>
                                    <th className="py-2.5 px-3">Uraian / Pihak Terkait</th>
                                    <th className="py-2.5 px-3 text-right w-36">Jumlah (Rp)</th>
                                    <th className="py-2.5 px-3 text-center w-28">Koran</th>
                                    <th className="py-2.5 px-3 text-center w-24">Status</th>
                                    <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-neutral-400 font-mono">
                                            Belum ada mutasi transaksi untuk rekening ini
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                                            <td className="py-2 px-3 font-mono font-bold text-neutral-900 dark:text-white">
                                                {tx.nomor_transaksi}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                {tx.tanggal_transaksi ? tx.tanggal_transaksi.split('T')[0] : '-'}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={cn(
                                                    'inline-flex items-center gap-1 font-mono text-[11px] font-semibold',
                                                    tx.jenis_transaksi === 'masuk' ? 'text-emerald-700' : 'text-rose-700'
                                                )}>
                                                    {tx.jenis_transaksi === 'masuk' ? (
                                                        <ArrowDownLeft className="size-3" />
                                                    ) : (
                                                        <ArrowUpRight className="size-3" />
                                                    )}
                                                    {tx.jenis_transaksi === 'masuk' ? 'Setoran / Masuk' : 'Tarikan / Keluar'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="font-medium text-neutral-900 dark:text-white">
                                                    {tx.pihak_terkait || '-'}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 truncate max-w-xs font-sans">
                                                    {tx.keterangan || '-'}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                                                {formatRupiah(tx.jumlah)}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className={cn(
                                                    'inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono uppercase font-semibold border',
                                                    tx.is_reconciled
                                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                                        : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                                                )}>
                                                    {tx.is_reconciled ? 'Cocok' : 'Belum'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className={cn(
                                                    'inline-flex items-center px-2 py-0.5 text-[11px] font-mono uppercase font-semibold border',
                                                    tx.status === 'posted'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                        : 'bg-amber-50 text-amber-700 border-amber-300'
                                                )}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs rounded-none font-mono text-neutral-600 hover:text-neutral-900"
                                                >
                                                    <Link to={`/kas/bank-transactions/${tx.id}`}>
                                                        Lihat
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
