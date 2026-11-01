import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, Asset } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Boxes,
    ArrowLeft,
    Edit,
    Calendar,
    DollarSign,
    TrendingDown,
    Wrench,
    ArrowRightLeft,
    Trash2,
    RefreshCw,
} from 'lucide-react';

export const AssetShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'depreciation' | 'maintenance' | 'transfers'>('depreciation');

    const fetchAsset = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await assetApi.getAsset(id);
            if (res.data?.success) {
                setAsset(res.data.data);
            }
        } catch (err) {
            toast.error('Gagal memuat detail aset');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAsset();
    }, [id]);

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
        { title: 'Aset', href: '/aset' },
        { title: 'Daftar Aset', href: '/aset/assets' },
        { title: asset ? `${asset.code} - ${asset.name}` : 'Detail Aset' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat data aset tetap...
                </div>
            </AppLayout>
        );
    }

    if (!asset) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Aset tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/aset/assets">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Boxes className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        {asset.code}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                            asset.status === 'ACTIVE'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                : asset.status === 'MAINTENANCE'
                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                        )}
                                    >
                                        {asset.status}
                                    </span>
                                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                                        Kondisi: {asset.condition}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    {asset.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Can permission="aset.assets.edit">
                                <Link to={`/aset/assets/${asset.id}/edit`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 gap-1.5 shadow-none"
                                    >
                                        <Edit className="size-3.5" />
                                        <span>Ubah Data</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Metadata Strip (Clean, Flat, No nested border cards) */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Harga Perolehan
                            </span>
                            <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                {formatCurrency(asset.purchase_cost)}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                Tgl: {asset.purchase_date?.slice(0, 10)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-0.5">
                                Akumulasi Penyusutan
                            </span>
                            <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                                {formatCurrency(asset.accumulated_depreciation)}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                {asset.last_depreciation_date ? `s.d ${asset.last_depreciation_date.slice(0, 10)}` : 'Belum disusutkan'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                Nilai Buku Saat Ini
                            </span>
                            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(asset.book_value)}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                Residu: {formatCurrency(asset.residual_value)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Umur & Tarif
                            </span>
                            <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                {asset.useful_life_months} Bulan
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                {Math.round(asset.useful_life_months / 12 * 10) / 10} Thn • {asset.depreciation_rate}% / Thn
                            </div>
                        </div>
                    </div>

                    {/* Metadata & Specs Grid */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-neutral-200 dark:border-neutral-800 text-xs">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Klasifikasi & Kategori
                            </span>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                                {asset.category?.name || '-'}
                            </div>
                            <div className="text-neutral-500 font-mono text-[11px]">
                                {asset.category?.depreciation_method || 'straight_line'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Merk / Model / Seri
                            </span>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                                {[asset.brand, asset.model].filter(Boolean).join(' ') || '-'}
                            </div>
                            <div className="text-neutral-500 font-mono text-[11px]">
                                {asset.serial_number ? `SN: ${asset.serial_number}` : 'SN: -'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Penempatan & Lokasi
                            </span>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                                {asset.department?.name || 'Gudang Pusat / Bebas'}
                            </div>
                            <div className="text-neutral-500 text-[11px]">
                                {asset.location || 'Lokasi belum dispesifikasi'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Pengadaan & PIC
                            </span>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                                PIC: {asset.assigned_to || '-'}
                            </div>
                            <div className="text-neutral-500 text-[11px]">
                                Vendor: {asset.vendor_supplier || '-'}
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-4 flex items-center gap-4 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('depreciation')}
                            className={cn(
                                'py-3 border-b-2 font-mono flex items-center gap-1.5 transition-colors',
                                activeTab === 'depreciation'
                                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                            )}
                        >
                            <TrendingDown className="size-3.5" />
                            <span>Jadwal & Histori Penyusutan</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('maintenance')}
                            className={cn(
                                'py-3 border-b-2 font-mono flex items-center gap-1.5 transition-colors',
                                activeTab === 'maintenance'
                                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                            )}
                        >
                            <Wrench className="size-3.5" />
                            <span>Histori Pemeliharaan</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('transfers')}
                            className={cn(
                                'py-3 border-b-2 font-mono flex items-center gap-1.5 transition-colors',
                                activeTab === 'transfers'
                                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                            )}
                        >
                            <ArrowRightLeft className="size-3.5" />
                            <span>Riwayat Mutasi & Lokasi</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                        {activeTab === 'depreciation' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3">Periode</th>
                                            <th className="py-2.5 px-3 text-right">Beban Penyusutan</th>
                                            <th className="py-2.5 px-3 text-right">Akumulasi Penyusutan</th>
                                            <th className="py-2.5 px-3 text-right">Nilai Buku Akhir</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                        {asset.depreciations && asset.depreciations.length > 0 ? (
                                            asset.depreciations.map((d) => (
                                                <tr key={d.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <td className="py-2 px-3">{d.period_date?.slice(0, 7)}</td>
                                                    <td className="py-2 px-3 text-right font-medium text-rose-600">
                                                        {formatCurrency(d.depreciation_amount)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-neutral-600 dark:text-neutral-400">
                                                        {formatCurrency(d.accumulated_depreciation)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-neutral-900 dark:text-white">
                                                        {formatCurrency(d.book_value)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                                            POSTED
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-neutral-400 italic font-mono">
                                                    Belum ada jadwal atau riwayat eksekusi penyusutan untuk aset ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'maintenance' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3">Tanggal</th>
                                            <th className="py-2.5 px-3">Jenis Servis</th>
                                            <th className="py-2.5 px-3">Vendor / Teknisi</th>
                                            <th className="py-2.5 px-3 text-right">Biaya Servis</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                        {asset.maintenances && asset.maintenances.length > 0 ? (
                                            asset.maintenances.map((m) => (
                                                <tr key={m.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <td className="py-2 px-3">{m.maintenance_date?.slice(0, 10)}</td>
                                                    <td className="py-2 px-3 font-semibold">{m.service_type}</td>
                                                    <td className="py-2 px-3">{m.vendor_name || '-'}</td>
                                                    <td className="py-2 px-3 text-right">{formatCurrency(m.cost)}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="px-2 py-0.5 text-[10px] bg-neutral-100 text-neutral-700 border border-neutral-300">
                                                            {m.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-neutral-400 italic font-mono">
                                                    Belum ada riwayat pemeliharaan tercatat.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'transfers' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3">No Mutasi</th>
                                            <th className="py-2.5 px-3">Tanggal</th>
                                            <th className="py-2.5 px-3">Dari Unit / Lokasi</th>
                                            <th className="py-2.5 px-3">Ke Unit / Lokasi</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                        {asset.transfers && asset.transfers.length > 0 ? (
                                            asset.transfers.map((t) => (
                                                <tr key={t.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <td className="py-2 px-3 font-bold">{t.transfer_number}</td>
                                                    <td className="py-2 px-3">{t.transfer_date?.slice(0, 10)}</td>
                                                    <td className="py-2 px-3">{t.from_department?.name || t.from_location || '-'}</td>
                                                    <td className="py-2 px-3">{t.to_department?.name || t.to_location || '-'}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="px-2 py-0.5 text-[10px] bg-neutral-100 text-neutral-700 border border-neutral-300">
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-neutral-400 italic font-mono">
                                                    Belum ada riwayat mutasi aset.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AssetShow;
