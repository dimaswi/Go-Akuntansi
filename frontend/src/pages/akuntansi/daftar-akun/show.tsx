import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    FolderTree,
    Edit3,
    BookOpen,
    RefreshCw,
    Wallet,
    Layers,
    CheckCircle2,
    XCircle,
    Building2,
    TrendingUp,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { Can } from '@/components/can';
import { toast } from 'sonner';

interface AccountDetail {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
    sub_jenis?: string;
    saldo_normal: 'debit' | 'kredit';
    saldo_berjalan: number | string;
    level: number;
    induk_akun_id?: number | null;
    induk_akun?: {
        id: number;
        kode_akun: string;
        nama_akun: string;
    };
    is_aktif: boolean;
    keterangan?: string;
}

export default function DaftarAkunShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [account, setAccount] = useState<AccountDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAccount = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/daftar-akun/${id}`);
            if (res.data?.data) {
                setAccount(res.data.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat detail akun');
            navigate('/akuntansi/daftar-akun');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAccount();
        }
    }, [id]);

    const breadcrumbs = [
        { title: 'Akuntansi', href: '/akuntansi' },
        { title: 'Daftar Akun', href: '/akuntansi/daftar-akun' },
        { title: account?.kode_akun ? `${account.kode_akun} - ${account.nama_akun}` : 'Detail Akun' },
    ];

    if (loading || !account) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-sm text-neutral-500 font-mono shadow-none">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat data detail akun...
                </div>
            </AppLayout>
        );
    }

    const saldoNum = Number(account.saldo_berjalan || 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/akuntansi/daftar-akun')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <FolderTree className="size-4" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Detail Akun: {account.kode_akun}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                                        <span>{account.nama_akun}</span>
                                        <span>•</span>
                                        <span>Level {account.level}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Can permission="akuntansi.buku-besar.view">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/akuntansi/buku-besar/${account.id}`)}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 font-semibold gap-1.5 shadow-none"
                                >
                                    <BookOpen className="size-3.5" />
                                    <span>Buku Besar</span>
                                </Button>
                            </Can>

                            <Can permission="akuntansi.daftar-akun.edit">
                                <Button
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    onClick={() => navigate(`/akuntansi/daftar-akun/${account.id}/edit`)}
                                >
                                    <Edit3 className="size-3.5" />
                                    <span>Edit Akun</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. KPI Metrics Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="p-3.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                Saldo Berjalan
                            </span>
                            <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                {formatRupiah(saldoNum)}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                Posisi Saldo: {account.saldo_normal.toUpperCase()}
                            </div>
                        </div>

                        <div className="p-3.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                Kategori Akun
                            </span>
                            <div className="text-base font-bold text-neutral-900 dark:text-white mt-1 capitalize">
                                {account.jenis_akun}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                Sub: {account.sub_jenis || '-'}
                            </div>
                        </div>

                        <div className="p-3.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                Tingkat Hierarki
                            </span>
                            <div className="text-base font-bold font-mono text-neutral-900 dark:text-white mt-1">
                                Level {account.level}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                {account.level === 1 ? 'Header Utama' : account.induk_akun ? `Sub dari ${account.induk_akun.kode_akun}` : 'Akun Sub'}
                            </div>
                        </div>

                        <div className="p-3.5">
                            <span className="text-[11px] uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider block">
                                Status Operasional
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                {account.is_aktif ? (
                                    <Badge variant="outline" className="rounded-none bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-xs">
                                        <CheckCircle2 className="size-3 mr-1" />
                                        Aktif
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="rounded-none bg-rose-50 text-rose-700 border-rose-300 font-mono text-xs">
                                        <XCircle className="size-3 mr-1" />
                                        Nonaktif
                                    </Badge>
                                )}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                                {account.is_aktif ? 'Dapat dipilih pada jurnal transaksi' : 'Tidak aktif untuk posting'}
                            </div>
                        </div>
                    </div>

                    {/* 3. Detail Specifications */}
                    <div className="p-6 space-y-6 bg-white dark:bg-neutral-950">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                                Parameter Bagan Akun
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-none">
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                        Kode Akun
                                    </label>
                                    <div className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-0.5">
                                        {account.kode_akun}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                        Nama Akun
                                    </label>
                                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                        {account.nama_akun}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                        Jenis / Klasifikasi
                                    </label>
                                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5 capitalize">
                                        {account.jenis_akun} {account.sub_jenis ? `(${account.sub_jenis})` : ''}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                        Saldo Normal
                                    </label>
                                    <div className="text-sm font-mono font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 uppercase">
                                        {account.saldo_normal}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                        Akun Induk (Parent)
                                    </label>
                                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">
                                        {account.induk_akun ? (
                                            <Link
                                                to={`/akuntansi/daftar-akun/${account.induk_akun.id}`}
                                                className="text-neutral-900 dark:text-neutral-100 hover:underline font-mono"
                                            >
                                                {account.induk_akun.kode_akun} - {account.induk_akun.nama_akun}
                                            </Link>
                                        ) : (
                                            <span className="text-neutral-500">- Tidak Memiliki Induk (Level Root) -</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                                        Keterangan / Catatan
                                    </label>
                                    <div className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5">
                                        {account.keterangan || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Footer Actions */}
                    <div className="px-6 py-3.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/akuntansi/daftar-akun')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                        >
                            <ArrowLeft className="size-3.5 mr-1.5" />
                            Kembali ke Daftar Akun
                        </Button>

                        <div className="flex items-center gap-2">
                            <Can permission="akuntansi.buku-besar.view">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(`/akuntansi/buku-besar/${account.id}`)}
                                    className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs font-semibold px-3 shadow-none"
                                >
                                    <BookOpen className="size-3.5 mr-1.5" />
                                    Buku Besar
                                </Button>
                            </Can>

                            <Can permission="akuntansi.daftar-akun.edit">
                                <Button
                                    type="button"
                                    onClick={() => navigate(`/akuntansi/daftar-akun/${account.id}/edit`)}
                                    className="h-8 rounded-none bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold px-3 shadow-none"
                                >
                                    <Edit3 className="size-3.5 mr-1.5" />
                                    Edit Akun
                                </Button>
                            </Can>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

