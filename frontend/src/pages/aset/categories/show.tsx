import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetCategory } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tag, ArrowLeft, Edit, RefreshCw, Sliders, BookOpen } from 'lucide-react';

const formatMethod = (method?: string) => {
    switch (method) {
        case 'straight_line':
        case 'STRAIGHT_LINE':
            return 'Garis Lurus (Straight Line)';
        case 'declining_balance':
        case 'DECLINING_BALANCE':
            return 'Saldo Menurun (Declining Balance)';
        case 'double_declining':
        case 'DOUBLE_DECLINING':
            return 'Saldo Menurun Ganda (Double Declining)';
        case 'sum_of_years_digits':
            return 'Jumlah Angka Tahun';
        case 'service_hours':
            return 'Jam Jasa (Service Hours)';
        case 'productive_output':
            return 'Satuan Hasil Produksi';
        default:
            return method || 'Garis Lurus';
    }
};

export const AssetCategoryShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [category, setCategory] = useState<AssetCategory | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchCategory = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await assetApi.getCategory(id);
                if (res.data?.success) {
                    setCategory(res.data.data);
                }
            } catch (err) {
                toast.error('Gagal memuat kategori aset');
                navigate('/aset/categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, [id, navigate]);

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Kategori Aset', href: '/aset/categories' },
        { title: category ? `${category.code} - ${category.name}` : 'Detail Kategori' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat rincian kategori aset...
                </div>
            </AppLayout>
        );
    }

    if (!category) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Kategori aset tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    const years = category.default_useful_life_years ?? (category.useful_life_months ? Math.round(category.useful_life_months / 12) : 0);
    const months = category.useful_life_months ?? (years ? years * 12 : 0);
    const rate = category.depreciation_rate ?? (years > 0 ? Math.round(1000 / years) / 10 : 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/aset/categories">
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
                                <Tag className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        {category.name}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                            category.is_active
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                        )}
                                    >
                                        {category.is_active ? 'Aktif' : 'Non-Aktif'}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Kode Kategori: {category.code}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="aset.categories.edit">
                                <Link to={`/aset/categories/${category.id}/edit`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 gap-1.5 shadow-none"
                                    >
                                        <Edit className="size-3.5" />
                                        <span>Ubah Kategori</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Content Details - Flat layout without nested cards */}
                    <div className="p-4 space-y-6 text-xs">
                        {/* Section 1: Parameter Depresiasi */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <Sliders className="size-3.5 text-neutral-600" />
                                    <span>1. Standar Parameter & Kebijakan Depresiasi</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                                        Masa Manfaat / Umur Ekonomis
                                    </span>
                                    <div className="font-semibold text-neutral-900 dark:text-white font-mono text-sm">
                                        {years > 0 ? `${years} Tahun (${months} Bulan)` : months > 0 ? `${months} Bulan` : '-'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                                        Metode Penyusutan
                                    </span>
                                    <div className="font-semibold text-neutral-900 dark:text-white font-mono text-sm">
                                        {formatMethod(category.default_depreciation_method || category.depreciation_method)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                                        Tarif & Nilai Residu
                                    </span>
                                    <div className="font-semibold text-neutral-900 dark:text-white font-mono text-sm">
                                        {rate ? `${rate}% / Tahun` : '-'} (Residu: {Number(category.default_salvage_percentage || 0)}%)
                                    </div>
                                </div>
                            </div>

                            {category.description && (
                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                        Keterangan
                                    </span>
                                    <p className="text-neutral-700 dark:text-neutral-300">
                                        {category.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Integrasi Chart of Accounts */}
                        <div>
                            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                                    <BookOpen className="size-3.5 text-neutral-600" />
                                    <span>2. Akun Terhubung Buku Besar (COA)</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                                        Akun Aset Tetap
                                    </span>
                                    <div className="font-mono text-neutral-900 dark:text-white font-medium">
                                        {category.account_asset ? (
                                            <div>
                                                <span className="font-bold">{category.account_asset.kode_akun}</span>
                                                <div className="text-neutral-500 text-[11px]">{category.account_asset.nama_akun}</div>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400 italic">Belum dihubungkan</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                                        Akun Akumulasi Penyusutan
                                    </span>
                                    <div className="font-mono text-neutral-900 dark:text-white font-medium">
                                        {category.account_depreciation ? (
                                            <div>
                                                <span className="font-bold">{category.account_depreciation.kode_akun}</span>
                                                <div className="text-neutral-500 text-[11px]">{category.account_depreciation.nama_akun}</div>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400 italic">Belum dihubungkan</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                                        Akun Beban Penyusutan
                                    </span>
                                    <div className="font-mono text-neutral-900 dark:text-white font-medium">
                                        {category.account_expense ? (
                                            <div>
                                                <span className="font-bold">{category.account_expense.kode_akun}</span>
                                                <div className="text-neutral-500 text-[11px]">{category.account_expense.nama_akun}</div>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400 italic">Belum dihubungkan</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AssetCategoryShow;
