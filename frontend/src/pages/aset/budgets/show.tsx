import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetBudget } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DollarSign, ArrowLeft, RefreshCw } from 'lucide-react';

export const AssetBudgetShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [budget, setBudget] = useState<AssetBudget | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await assetApi.getBudget(id);
            if (res.data?.success) {
                setBudget(res.data.data);
            }
        } catch (err) {
            toast.error('Gagal memuat rincian anggaran aset');
            navigate('/aset/budgets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
        { title: 'RAB (Anggaran)', href: '/aset/budgets' },
        { title: budget ? (budget.budget_code || (budget as any).code || `RAB TA ${budget.fiscal_year}`) : 'Detail RAB' },
    ];

    const renderPriorityBadge = (priority?: string) => {
        const p = (priority || '').toUpperCase();
        if (p === 'HIGH' || p === 'TINGGI') {
            return (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                    HIGH
                </span>
            );
        }
        if (p === 'MEDIUM' || p === 'SEDANG') {
            return (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                    MEDIUM
                </span>
            );
        }
        if (p === 'LOW' || p === 'RENDAH') {
            return (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                    LOW
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                {priority || '-'}
            </span>
        );
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat rincian anggaran aset...
                </div>
            </AppLayout>
        );
    }

    if (!budget) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Anggaran aset tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    const total = Number(budget.total_amount || budget.total_budget || 0);
    const realized = Number(budget.realized_amount || budget.realized_budget || 0);
    const remaining = total - realized;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/aset/budgets">
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
                                <DollarSign className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        {budget.name || budget.budget_name || (budget as any).title}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                            budget.status === 'APPROVED'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                        )}
                                    >
                                        {budget.status}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Kode: {budget.budget_code || (budget as any).code} • Tahun Anggaran: {budget.fiscal_year}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Overview Strip */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Unit Pengusul
                            </span>
                            <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {budget.department?.name || 'Seluruh Unit / Bebas'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Total Pagu Anggaran
                            </span>
                            <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                                {formatCurrency(total)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Realisasi Belanja (AP)
                            </span>
                            <div className="text-sm font-bold font-mono text-rose-600">
                                {formatCurrency(realized)}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                                Sisa Pagu Anggaran
                            </span>
                            <div className="text-sm font-bold font-mono text-emerald-600">
                                {formatCurrency(remaining)}
                            </div>
                        </div>
                    </div>

                    {/* Details Body - Flat layout without nested border cards */}
                    <div className="p-4 space-y-6 text-xs">
                        {budget.notes && (
                            <div>
                                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                    Latar Belakang / Justifikasi
                                </span>
                                <p className="text-neutral-700 dark:text-neutral-300">
                                    {budget.notes}
                                </p>
                            </div>
                        )}

                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <DollarSign className="size-3.5 text-neutral-600" />
                                    <span>Rincian Item Belanja Modal yang Disetujui</span>
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse border border-neutral-200 dark:border-neutral-800">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-10 text-center">No</th>
                                            <th className="py-2.5 px-3">Nama Item & Spesifikasi</th>
                                            <th className="py-2.5 px-3 w-40">Kategori Aset</th>
                                            <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                                            <th className="py-2.5 px-3 text-right">Estimasi Satuan</th>
                                            <th className="py-2.5 px-3 text-right">Total Anggaran</th>
                                            <th className="py-2.5 px-3 text-right">Terealisasi</th>
                                            <th className="py-2.5 px-3 w-24 text-center">Prioritas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 font-mono">
                                        {budget.items && budget.items.length > 0 ? (
                                            budget.items.map((it, idx) => (
                                                <tr key={it.id || idx} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <td className="py-2 px-3 text-center text-neutral-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="font-semibold text-neutral-900 dark:text-white font-sans">
                                                            {it.item_name}
                                                        </div>
                                                        {it.specification && (
                                                            <div className="text-[11px] text-neutral-500 font-sans">
                                                                {it.specification}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                                        {it.category?.name || '-'}
                                                    </td>
                                                    <td className="py-2 px-3 text-center text-neutral-900 dark:text-white font-bold">
                                                        {it.quantity}
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-neutral-600 dark:text-neutral-400">
                                                        {formatCurrency(it.estimated_cost)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-neutral-900 dark:text-white">
                                                        {formatCurrency(it.total_cost || Number(it.quantity) * Number(it.estimated_cost))}
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-rose-600">
                                                        {formatCurrency(it.realized_amount)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center font-sans">
                                                        {renderPriorityBadge(it.priority)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-neutral-400 italic">
                                                    Belum ada rincian item dalam anggaran ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AssetBudgetShow;
