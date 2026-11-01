import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, InventoryDashboardStats } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Can } from '@/components/can';
import {
    Boxes,
    Package,
    AlertTriangle,
    ShoppingCart,
    Clock,
    RefreshCw,
    Plus,
    FileText,
    ArrowRightLeft,
    CheckCircle2,
    SlidersHorizontal,
    TrendingUp,
    Building2,
    ChevronRight,
} from 'lucide-react';

export const InventoryDashboard: React.FC = () => {
    const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getDashboardStats();
            if (res.data?.success) {
                setStats(res.data.data);
            }
        } catch (err: any) {
            console.error('Failed to load inventory stats', err);
            toast.error('Gagal memuat statistik inventaris');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatCurrency = (val: string | number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                {/* Enterprise Unified Card Container */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Boxes className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Dashboard Persediaan & Logistik
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Monitoring Posisi Stok & Valuasi Persediaan</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchStats}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Can permission="inventory.purchases.create">
                                <Link to="/inventory/purchases/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Buat Pengadaan (PO)</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* KPI Strip 1 - Posisi Utama Inventaris */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                        {/* KPI 1: Total SKU */}
                        <div className="p-4 sm:px-6">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Master Barang
                                </span>
                                <Package className="size-4 text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                                {loading ? '...' : (stats?.total_sku || 0)} <span className="text-xs font-normal text-neutral-500 font-sans">SKU</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                                Tersebar di <span className="font-semibold text-neutral-700 dark:text-neutral-300">{stats?.total_categories || 0}</span> kategori
                            </div>
                        </div>

                        {/* KPI 2: Total Nilai Aset Stok */}
                        <div className="p-4 sm:px-6">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    Total Nilai Persediaan
                                </span>
                                <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                                {loading ? '...' : formatCurrency(stats?.total_inventory_value)}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1">
                                Berdasarkan biaya standar & perolehan riil
                            </div>
                        </div>

                        {/* KPI 3: Stok Menipis / Kritis */}
                        <div className="p-4 sm:px-6">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    Stok Kritis (Under Min)
                                </span>
                                <AlertTriangle className="size-4 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-500">
                                    {loading ? '...' : (stats?.low_stock_count || 0)}
                                </div>
                                <span className="text-xs px-2 py-0.5 font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                                    Perlu Reorder
                                </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1">
                                Qty di bawah batas minimum reorder level
                            </div>
                        </div>

                        {/* KPI 4: Pengadaan Bulan Ini */}
                        <div className="p-4 sm:px-6">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    Pengadaan (PO) Bulan Ini
                                </span>
                                <ShoppingCart className="size-4 text-neutral-400" />
                            </div>
                            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                                {loading ? '...' : formatCurrency(stats?.nominal_po_bulan_ini)}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{stats?.total_po_bulan_ini || 0}</span> berkas PO dibuat
                            </div>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                        
                        {/* Left Column (2 Cols): Peringatan Stok Menipis & PO Terkini */}
                        <div className="lg:col-span-2 flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
                            
                            {/* Critical Low Stock Alert Table */}
                            <div className="p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                            Daftar Barang Memerlukan Pemesanan Ulang (Low Stock)
                                        </h2>
                                    </div>
                                    <Link to="/inventory/items?low_stock=true" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1">
                                        Lihat Semua <ChevronRight className="size-3.5" />
                                    </Link>
                                </div>

                                <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 uppercase font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                            <tr>
                                                <th className="px-3 py-2">Kode</th>
                                                <th className="px-3 py-2">Nama Barang</th>
                                                <th className="px-3 py-2 text-right">Stok Fisik</th>
                                                <th className="px-3 py-2 text-right">Batas Min</th>
                                                <th className="px-3 py-2 text-center">Status</th>
                                                <th className="px-3 py-2 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-4 text-neutral-500">Memuat data...</td>
                                                </tr>
                                            ) : (stats?.critical_items && stats.critical_items.length > 0) ? (
                                                stats.critical_items.map((it) => (
                                                    <tr key={it.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50">
                                                        <td className="px-3 py-2 font-mono font-medium text-neutral-700 dark:text-neutral-300">
                                                            {it.code}
                                                        </td>
                                                        <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                                                            {it.name}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 dark:text-amber-500">
                                                            {Number(it.total_stock || 0)} {it.unit_of_measure}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono text-neutral-500">
                                                            {Number(it.reorder_level || 0)} {it.unit_of_measure}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                                                                Kritis
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <Can permission="inventory.purchases.create">
                                                                <Link to="/inventory/purchases/create">
                                                                    <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] rounded-none border-neutral-300">
                                                                        + PO
                                                                    </Button>
                                                                </Link>
                                                            </Can>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-5 text-neutral-500">
                                                        <CheckCircle2 className="size-5 mx-auto text-emerald-500 mb-1" />
                                                        Seluruh stok barang berada dalam kondisi aman di atas batas minimum.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Purchases (PO) */}
                            <div className="p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="size-4 text-neutral-600 dark:text-neutral-400" />
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                            Pengadaan Barang (PO) Terkini
                                        </h2>
                                    </div>
                                    <Link to="/inventory/purchases" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1">
                                        Semua Pengadaan <ChevronRight className="size-3.5" />
                                    </Link>
                                </div>

                                <div className="border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 uppercase font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                            <tr>
                                                <th className="px-3 py-2">No. PO</th>
                                                <th className="px-3 py-2">Tanggal</th>
                                                <th className="px-3 py-2">Pemasok / Vendor</th>
                                                <th className="px-3 py-2 text-right">Total (Rp)</th>
                                                <th className="px-3 py-2 text-center">Status</th>
                                                <th className="px-3 py-2 text-center">Jurnal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-4 text-neutral-500">Memuat data...</td>
                                                </tr>
                                            ) : (stats?.recent_purchases && stats.recent_purchases.length > 0) ? (
                                                stats.recent_purchases.map((p) => (
                                                    <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50">
                                                        <td className="px-3 py-2 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                                            <Link to={`/inventory/purchases/${p.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                                                                {p.purchase_number}
                                                            </Link>
                                                        </td>
                                                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400 font-mono">
                                                            {p.purchase_date}
                                                        </td>
                                                        <td className="px-3 py-2 font-medium text-neutral-800 dark:text-neutral-200">
                                                            {p.supplier?.name || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono font-semibold">
                                                            {formatCurrency(p.total_amount)}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                                                p.status === 'received' || p.status === 'completed'
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                                    : p.status === 'ordered'
                                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200'
                                                                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300'
                                                            }`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {p.jurnal_posted ? (
                                                                <span className="text-emerald-600 font-semibold text-[11px]">POSTED</span>
                                                            ) : (
                                                                <span className="text-neutral-400 text-[11px]">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-5 text-neutral-500">
                                                        Belum ada transaksi pengadaan barang.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Fast Navigation & Action Links */}
                        <div className="p-4 sm:p-5 flex flex-col justify-between bg-neutral-50/30 dark:bg-neutral-900/30">
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Modul Inventaris & Logistik
                                    </h2>
                                    <p className="text-[11px] text-neutral-500">
                                        Akses cepat pengelolaan master barang, mutasi gudang, dan pembukuan stok
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Can permission="inventory.items.view">
                                        <Link
                                            to="/inventory/items"
                                            className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Package className="size-4 text-neutral-600 dark:text-neutral-400" />
                                                <div>
                                                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Master Data Barang</div>
                                                    <div className="text-[10px] text-neutral-500">Katalog SKU, satuan, biaya standar</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-neutral-400" />
                                        </Link>
                                    </Can>

                                    <Can permission="inventory.purchases.view">
                                        <Link
                                            to="/inventory/purchases"
                                            className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <ShoppingCart className="size-4 text-neutral-600 dark:text-neutral-400" />
                                                <div>
                                                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Pengadaan Barang (PO)</div>
                                                    <div className="text-[10px] text-neutral-500">Penerimaan barang & hutang dagang</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-neutral-400" />
                                        </Link>
                                    </Can>

                                    <Can permission="inventory.stock-transfers.view">
                                        <Link
                                            to="/inventory/stock-transfers"
                                            className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <ArrowRightLeft className="size-4 text-neutral-600 dark:text-neutral-400" />
                                                <div>
                                                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Transfer Stok Antar Unit</div>
                                                    <div className="text-[10px] text-neutral-500">Distribusi dari gudang ke departemen</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-neutral-400" />
                                        </Link>
                                    </Can>

                                    <Can permission="inventory.stock-adjustments.view">
                                        <Link
                                            to="/inventory/stock-adjustments"
                                            className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <SlidersHorizontal className="size-4 text-neutral-600 dark:text-neutral-400" />
                                                <div>
                                                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Penyesuaian Stok Fisik</div>
                                                    <div className="text-[10px] text-neutral-500">Koreksi rusak, hilang, & posting selisih</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-neutral-400" />
                                        </Link>
                                    </Can>

                                    <Can permission="inventory.stock-opnames.view">
                                        <Link
                                            to="/inventory/stock-opnames"
                                            className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <CheckCircle2 className="size-4 text-neutral-600 dark:text-neutral-400" />
                                                <div>
                                                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Stock Opname Fisik</div>
                                                    <div className="text-[10px] text-neutral-500">Pencocokan fisik berkala vs sistem</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-neutral-400" />
                                        </Link>
                                    </Can>

                                    <Can permission="inventory.reports.view">
                                        <Link
                                            to="/inventory/reports"
                                            className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FileText className="size-4 text-neutral-600 dark:text-neutral-400" />
                                                <div>
                                                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Laporan Posisi & Nilai Stok</div>
                                                    <div className="text-[10px] text-neutral-500">Rekapitulasi persediaan per gudang</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-neutral-400" />
                                        </Link>
                                    </Can>
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mt-4">
                                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                                    Total Kewajiban Hutang Pengadaan
                                </div>
                                <div className="text-base font-bold font-mono text-red-600 dark:text-red-400">
                                    {loading ? '...' : formatCurrency(stats?.total_ap_outstanding)}
                                </div>
                                <div className="text-[10px] text-neutral-400 mt-0.5">
                                    Outstanding Hutang Usaha belum terbayar
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Status Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-2.5 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span>Integrasi Akuntansi: <strong>Aktif (Persediaan terhubung dengan Buku Besar)</strong></span>
                        </div>
                        <div>
                            Sistem Manajemen Persediaan & Logistik • SIMKEP Modul Administrasi
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
};

export default InventoryDashboard;
