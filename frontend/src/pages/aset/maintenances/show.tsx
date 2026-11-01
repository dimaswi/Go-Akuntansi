import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetMaintenance } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Wrench, ArrowLeft, Edit, RefreshCw } from 'lucide-react';

export const AssetMaintenanceShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [maintenance, setMaintenance] = useState<AssetMaintenance | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await assetApi.getMaintenance(id);
                if (res.data?.success) {
                    setMaintenance(res.data.data);
                }
            } catch (err) {
                toast.error('Gagal memuat catatan pemeliharaan');
                navigate('/aset/maintenances');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, navigate]);

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
        { title: 'Maintenance', href: '/aset/maintenances' },
        { title: maintenance ? `Pemeliharaan #${maintenance.id}` : 'Detail Pemeliharaan' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat rincian pemeliharaan...
                </div>
            </AppLayout>
        );
    }

    if (!maintenance) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Catatan pemeliharaan tidak ditemukan.
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
                            <Link to="/aset/maintenances">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Wrench className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Pemeliharaan #{maintenance.id}: {maintenance.service_type}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                            maintenance.status === 'COMPLETED'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                : maintenance.status === 'IN_PROGRESS'
                                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                                                : maintenance.status === 'SCHEDULED'
                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                        )}
                                    >
                                        {maintenance.status}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Aset: {maintenance.asset?.code || `AST-${maintenance.asset_id}`} - {maintenance.asset?.name || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="aset.maintenances.edit">
                                <Link to={`/aset/maintenances/${maintenance.id}/edit`}>
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

                    {/* Metadata Overview Strip */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Tanggal Servis
                            </span>
                            <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                {maintenance.maintenance_date?.slice(0, 10)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Total Biaya Servis
                            </span>
                            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(maintenance.cost)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Vendor / Bengkel
                            </span>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {maintenance.vendor_name || maintenance.vendor || '-'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Servis Berikutnya
                            </span>
                            <div className="text-sm font-mono text-neutral-900 dark:text-white">
                                {maintenance.next_maintenance_date ? maintenance.next_maintenance_date.slice(0, 10) : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Details Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Wrench className="size-3.5 text-neutral-600" />
                                    <span>Informasi Lengkap Pemeliharaan</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Aset Terkait
                                    </span>
                                    <Link
                                        to={`/aset/assets/${maintenance.asset_id}`}
                                        className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline block"
                                    >
                                        {maintenance.asset?.code || `AST-${maintenance.asset_id}`}
                                    </Link>
                                    <div className="font-medium text-neutral-900 dark:text-white">
                                        {maintenance.asset?.name || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Teknisi Pelaksana (PIC)
                                    </span>
                                    <div className="font-medium text-neutral-900 dark:text-white">
                                        {maintenance.performed_by || maintenance.technician || '-'}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Jenis Servis
                                    </span>
                                    <div className="font-semibold text-neutral-900 dark:text-white">
                                        {maintenance.service_type}
                                    </div>
                                </div>
                            </div>

                            {maintenance.description && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Deskripsi Pekerjaan / Tindakan Servis
                                    </span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        {maintenance.description}
                                    </p>
                                </div>
                            )}

                            {maintenance.notes && (
                                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Catatan / Garansi
                                    </span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        {maintenance.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AssetMaintenanceShow;
