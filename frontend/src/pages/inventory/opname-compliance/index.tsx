import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/api/client';
import { Can } from '@/components/can';
import {
    Shield,
    Search,
    RefreshCw,
    Eye,
    RotateCcw,
    CheckCircle2,
    AlertTriangle,
    Building2,
    Calendar,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

interface ComplianceItem {
    id: number;
    name: string;
    code: string;
    last_opname_date?: string | null;
    status_label: 'Patuh' | 'Perlu Opname' | 'Terlambat';
    is_compliant: boolean;
    days_since?: number;
}

export const OpnameComplianceIndex: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<ComplianceItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    const fetchCompliance = async () => {
        try {
            setLoading(true);
            const [deptRes, opnRes] = await Promise.all([
                api.get('/departments'),
                api.get('/inventory/stock-opnames'),
            ]);

            const rawDepts = deptRes.data?.data;
            const depts = Array.isArray(rawDepts) ? rawDepts : (Array.isArray(rawDepts?.data) ? rawDepts.data : []);
            const rawOpnames = opnRes.data?.data;
            const opnames = Array.isArray(rawOpnames) ? rawOpnames : (Array.isArray(rawOpnames?.data) ? rawOpnames.data : []);

            const list: ComplianceItem[] = depts.map((d: any) => {
                const deptOpnames = opnames.filter((o: any) => o.department_id === d.id);
                const last = deptOpnames[0];
                const isCompliant = Boolean(last);
                return {
                    id: d.id,
                    name: d.name,
                    code: d.code || `DEP-${d.id}`,
                    last_opname_date: last?.opname_date ? last.opname_date.split('T')[0] : null,
                    is_compliant: isCompliant,
                    status_label: isCompliant ? 'Patuh' : 'Perlu Opname',
                };
            });

            setDepartments(list);
        } catch {
            toast.error('Gagal memuat status kepatuhan opname');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompliance();
    }, []);

    const deptList = Array.isArray(departments) ? departments : [];
    const filtered = deptList.filter((d) => {
        const q = search.toLowerCase();
        const matchSearch = d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q);
        const matchStatus =
            statusFilter === 'all' ||
            (statusFilter === 'compliant' && d.is_compliant) ||
            (statusFilter === 'pending' && !d.is_compliant);
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const compliantCount = filtered.filter((d) => d.is_compliant).length;
    const nonCompliantCount = filtered.length - compliantCount;
    const rate = filtered.length > 0 ? Math.round((compliantCount / filtered.length) * 100) : 100;
    const hasActiveFilters = search !== '' || statusFilter !== 'all';

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Shield className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Monitoring Kepatuhan Stock Opname
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Tingkat Kepatuhan: {rate}%</span>
                                    <span>•</span>
                                    <span>{compliantCount} dari {filtered.length} Unit Tertib Opname</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
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
                                onClick={fetchCompliance}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="inventory.stock-opnames.create">
                                <Link to="/inventory/stock-opnames/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Calendar className="size-3.5" />
                                        <span>Buka Sesi Opname</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Kode Unit / Instalasi
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari unit atau instalasi..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Status Kepatuhan
                                </label>
                                <NativeSearchableSelect
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Unit</option>
                                    <option value="compliant">Tertib Opname</option>
                                    <option value="pending">Perlu Jadwal Opname</option>
                                </NativeSearchableSelect>
                            </div>
                        </div>
                    </div>

                    {/* 3. Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 w-40 whitespace-nowrap">Kode Unit</th>
                                    <th className="py-2.5 px-3">Nama Departemen / Instalasi</th>
                                    <th className="py-2.5 px-3 w-44 text-center whitespace-nowrap">Terakhir Opname</th>
                                    <th className="py-2.5 px-3 w-40 text-center whitespace-nowrap">Status Kepatuhan</th>
                                    <th className="py-2.5 px-3 w-24 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat status kepatuhan opname...
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Tidak ada data unit.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((d, idx) => (
                                        <tr
                                            key={d.id}
                                            onClick={() => navigate(`/inventory/department-stocks/${d.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {d.code}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="size-3.5 text-neutral-400 shrink-0" />
                                                    <span>{d.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                {d.last_opname_date || 'Belum Pernah'}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                {d.is_compliant ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-none">
                                                        <CheckCircle2 className="size-3" />
                                                        Tertib Opname
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-none">
                                                        <AlertTriangle className="size-3" />
                                                        Perlu Jadwal
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className="py-2 px-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => navigate(`/inventory/department-stocks/${d.id}`)}
                                                        className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                        title="Lihat Stok Unit"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Pagination Footer Bar */}
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <span>Baris per halaman:</span>
                            <NativeSearchableSelect
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 text-xs rounded-none shadow-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </NativeSearchableSelect>
                            <span className="font-mono text-neutral-400 ml-2">
                                Menampilkan {paginated.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, filtered.length)} dari {filtered.length} data
                            </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>
                            <span className="px-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                Hal {page} dari {totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default OpnameComplianceIndex;
