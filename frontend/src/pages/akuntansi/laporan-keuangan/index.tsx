import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Can } from '@/components/can';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Activity,
    FileText,
    FileEdit,
    PieChart,
    Search,
    ArrowRight,
    HelpCircle,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LaporanItem {
    id: string;
    kode: string;
    name: string;
    category: string;
    description: string;
    cakupan: string;
    standar: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Laporan Keuangan', href: '/akuntansi/laporan-keuangan' },
];

export default function LaporanKeuanganIndex() {
    const [searchTerm, setSearchTerm] = useState('');

    const laporanList: LaporanItem[] = [
        {
            id: 'neraca',
            kode: 'FS-01',
            name: 'Neraca (Balance Sheet)',
            category: 'Laporan Posisi Keuangan',
            description: 'Laporan posisi aset lancar, aset tetap, kewajiban hutang, dan permodalan ekuitas pada tanggal tertentu.',
            cakupan: 'Posisi Kumulatif Per Tanggal',
            standar: 'PSAK 1 / SAK ETAP',
            href: '/akuntansi/laporan-keuangan/neraca',
            icon: BarChart3,
        },
        {
            id: 'laba-rugi',
            kode: 'FS-02',
            name: 'Laba Rugi (Income Statement)',
            category: 'Kinerja Operasional',
            description: 'Laporan akumulasi pendapatan operasional, beban pokok, beban usaha, dan hasil laba/rugi bersih periode berjalan.',
            cakupan: 'Periode Berjalan (Bulan/Tahun)',
            standar: 'PSAK 1 / SAK ETAP',
            href: '/akuntansi/laporan-keuangan/laba-rugi',
            icon: TrendingUp,
        },
        {
            id: 'arus-kas',
            kode: 'FS-03',
            name: 'Arus Kas (Statement of Cash Flows)',
            category: 'Likuiditas Kas',
            description: 'Laporan penerimaan dan pengeluaran kas dari aktivitas operasional, investasi aset, dan pendanaan modal.',
            cakupan: 'Periode Berjalan',
            standar: 'PSAK 2',
            href: '/akuntansi/laporan-keuangan/arus-kas',
            icon: DollarSign,
        },
        {
            id: 'perubahan-modal',
            kode: 'FS-04',
            name: 'Perubahan Modal (Statement of Changes in Equity)',
            category: 'Struktur Permodalan',
            description: 'Laporan pergerakan saldo modal pemilik, penambahan laba tahun berjalan, setoran modal, dan penarikan prive.',
            cakupan: 'Periode Berjalan',
            standar: 'PSAK 1',
            href: '/akuntansi/laporan-keuangan/perubahan-modal',
            icon: Activity,
        },
        {
            id: 'analisis-rasio',
            kode: 'FS-05',
            name: 'Analisis Rasio Keuangan (Financial Ratios)',
            category: 'Analisis Manajerial',
            description: 'Indikator kesehatan keuangan: rasio likuiditas (Current/Quick), solvabilitas (Debt-to-Equity), dan profitabilitas.',
            cakupan: 'Berdasarkan Posisi Neraca & Laba Rugi',
            standar: 'Manajerial & Audit',
            href: '/akuntansi/laporan-keuangan/analisis-rasio',
            icon: PieChart,
        },
        {
            id: 'dampak-penyesuaian',
            kode: 'FS-06',
            name: 'Dampak Jurnal Penyesuaian (AJP Impact)',
            category: 'Audit & Penutupan',
            description: 'Laporan perbandingan saldo buku besar sebelum dan setelah jurnal penyesuaian (AJP) diposting.',
            cakupan: 'Periode Tutup Buku',
            standar: 'Standar Audit',
            href: '/akuntansi/laporan-keuangan/dampak-penyesuaian',
            icon: FileEdit,
        },
    ];

    const filteredLaporan = useMemo(() => {
        if (!searchTerm.trim()) return laporanList;
        const q = searchTerm.toLowerCase();
        return laporanList.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                item.kode.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q)
        );
    }, [searchTerm, laporanList]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none">
                    {/* Header: Title, Search, and Action Buttons */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                                    Daftar Laporan Keuangan (Financial Statements)
                                </h1>
                                <p className="text-[11px] text-neutral-500">
                                    Kompilasi laporan keuangan resmi, rasio analisis, dan permodalan sesuai standar akuntansi
                                </p>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari laporan keuangan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Sub-header Strip */}
                    <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            Tabel Katalog Laporan ({filteredLaporan.length} Jenis Laporan)
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                            Modul Keuangan & ERP SIM
                        </span>
                    </div>

                    {/* The Full List Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                    <th className="py-2.5 px-4 text-left w-20">Kode</th>
                                    <th className="py-2.5 px-4 text-left w-64">Nama Laporan</th>
                                    <th className="py-2.5 px-4 text-left">Deskripsi & Fungsi</th>
                                    <th className="py-2.5 px-4 text-left w-52">Cakupan Periode</th>
                                    <th className="py-2.5 px-4 text-left w-36">Standar</th>
                                    <th className="py-2.5 px-4 text-center w-28">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                                {filteredLaporan.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-neutral-400 italic">
                                            Tidak ada laporan keuangan yang cocok dengan pencarian "{searchTerm}".
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLaporan.map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <tr
                                                key={item.id}
                                                className={cn(
                                                    'hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors',
                                                    index % 2 === 0
                                                        ? 'bg-white dark:bg-neutral-950'
                                                        : 'bg-neutral-50/20 dark:bg-neutral-900/20'
                                                )}
                                            >
                                                {/* Kode Laporan */}
                                                <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                    <span className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 text-[11px]">
                                                        {item.kode}
                                                    </span>
                                                </td>

                                                {/* Nama Laporan + Icon */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-7 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                                                            <Icon className="size-3.5 text-neutral-800 dark:text-neutral-200" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-400 mt-0.5">
                                                                {item.category}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Deskripsi */}
                                                <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                    {item.description}
                                                </td>

                                                {/* Cakupan Periode */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                                                        <Calendar className="size-3 text-neutral-400 shrink-0" />
                                                        <span className="text-[11px] font-medium">
                                                            {item.cakupan}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Standar */}
                                                <td className="py-3 px-4">
                                                    <span className="text-[11px] font-semibold border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 whitespace-nowrap">
                                                        {item.standar}
                                                    </span>
                                                </td>

                                                {/* Aksi: Tombol Buka Laporan */}
                                                <td className="py-3 px-4 text-center">
                                                    <Can permission="akuntansi.laporan.view">
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            className="h-7 rounded-none bg-neutral-900 hover:bg-neutral-800 text-white text-xs px-2.5 shadow-none gap-1"
                                                        >
                                                            <Link to={item.href}>
                                                                <span>Buka</span>
                                                                <ArrowRight className="size-3" />
                                                            </Link>
                                                        </Button>
                                                    </Can>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ─── Bottom Reference Guide (Di dalam satu card utuh) ─────────── */}
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
                            <HelpCircle className="size-4 text-neutral-500" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                                Prinsip & Persamaan Dasar Standar Akuntansi
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* 1. Neraca */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                                    <span>1. Posisi Neraca</span>
                                    <span className="font-mono text-[11px] text-neutral-400">FS-01</span>
                                </div>
                                <div className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 mt-1 font-semibold">
                                    Aset = Kewajiban + Ekuitas
                                </div>
                                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                                    Posisi total aktiva harus selalu seimbang (*balance*) dengan total pasiva per tanggal tutup buku.
                                </p>
                            </div>

                            {/* 2. Laba Rugi */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                                    <span>2. Hasil Laba Rugi</span>
                                    <span className="font-mono text-[11px] text-neutral-400">FS-02</span>
                                </div>
                                <div className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 mt-1 font-semibold">
                                    Laba = Pendapatan - Beban
                                </div>
                                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                                    Mengukur profitabilitas operasional dan non-operasional dalam satu rentang periode tertentu.
                                </p>
                            </div>

                            {/* 3. Arus Kas */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                                    <span>3. Arus Kas Bersih</span>
                                    <span className="font-mono text-[11px] text-neutral-400">FS-03</span>
                                </div>
                                <div className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 mt-1 font-semibold">
                                    ΔKas = Operasi + Invest + Dana
                                </div>
                                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                                    Melacak likuiditas kas nyata yang masuk dan keluar dari mutasi kas & transaksi bank.
                                </p>
                            </div>

                            {/* 4. Perubahan Modal */}
                            <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                                    <span>4. Ekuitas Pemilik</span>
                                    <span className="font-mono text-[11px] text-neutral-400">FS-04</span>
                                </div>
                                <div className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 mt-1 font-semibold">
                                    Modal Akhir = Awal + Laba - Prive
                                </div>
                                <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                                    Rekonsiliasi modal dari laba bersih berjalan setelah dikurangi penarikan atau dividen.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
