import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Edit2, Layers, Package, Users } from 'lucide-react';
import { Can } from '@/components/can';

export const DepartmentShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [department, setDepartment] = useState<any | null>(null);
    const [parentDept, setParentDept] = useState<any | null>(null);
    const [stocks, setStocks] = useState<any[]>([]);
    const [deptUsers, setDeptUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [deptRes, allDepts, stockRes, usersRes] = await Promise.all([
                    inventoryApi.getDepartment(id),
                    inventoryApi.getDepartments(),
                    inventoryApi.getStockSummary({ department_id: Number(id) }),
                    api.get('/users', { params: { page: 1, limit: 500, per_page: 500 } }).catch(() => ({ data: null })),
                ]);

                if (deptRes.data?.success) {
                    const d = deptRes.data.data;
                    setDepartment(d);

                    if (d.parent_id && allDepts.data?.success) {
                        const parent = (allDepts.data.data || []).find((x: any) => String(x.id) === String(d.parent_id));
                        setParentDept(parent || null);
                    }
                }

                if (stockRes.data?.success) {
                    setStocks(stockRes.data.data || []);
                }

                if (usersRes?.data) {
                    const rawUsers =
                        usersRes.data?.data?.data ||
                        usersRes.data?.data?.items ||
                        (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
                    const assigned = rawUsers.filter(
                        (u: any) => Number(u.department_id || u.department?.id || 0) === Number(id)
                    );
                    setDeptUsers(assigned);
                }
            } catch {
                toast.error('Gagal memuat rincian departemen');
                navigate('/inventory/departments');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    if (loading || !department) {
        return (
            <AppLayout>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    Memuat data departemen...
                </div>
            </AppLayout>
        );
    }

    const totalQty = stocks.reduce((sum, s) => sum + Number(s.quantity_on_hand || 0), 0);

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/inventory/departments')}
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
                                            {department.name}
                                        </h1>
                                        <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                            department.is_active !== false
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300'
                                        }`}>
                                            {department.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Kode: {department.code}</span>
                                        <span>•</span>
                                        <span>Level: {department.level || 1}</span>
                                        <span>•</span>
                                        <span>{deptUsers.length} User</span>
                                        <span>•</span>
                                        <span>{stocks.length} SKU Persediaan</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="inventory.departments.edit">
                                <Link to={`/inventory/departments/${department.id}/users`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-none h-8 px-3 text-xs font-semibold gap-1.5 border-neutral-200 dark:border-neutral-800 shadow-none"
                                    >
                                        <Users className="size-3.5" />
                                        <span>Kelola Users ({deptUsers.length})</span>
                                    </Button>
                                </Link>
                            </Can>
                            <Can permission="inventory.departments.edit">
                                <Link to={`/inventory/departments/${department.id}/edit`}>
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Edit2 className="size-3.5" />
                                        <span>Edit Departemen</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* Content Details */}
                    <div className="w-full max-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                            <div className="p-4 space-y-3 text-xs">
                                <h3 className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
                                    <Building2 className="size-3.5" /> Informasi Organisasi
                                </h3>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Nama Lengkap:</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">{department.name}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Kode Singkatan:</span>
                                    <span className="font-mono font-bold">{department.code}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Tingkat / Level:</span>
                                    <span>Tingkat {department.level || 1}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-neutral-500">Induk Departemen:</span>
                                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                        {parentDept ? `${parentDept.name} (${parentDept.code})` : 'Unit Tingkat Utama (Root)'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-3 text-xs">
                                <h3 className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
                                    <Layers className="size-3.5" /> Ringkasan Persediaan Unit
                                </h3>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Jumlah Jenis Barang (SKU):</span>
                                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{stocks.length} SKU</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-neutral-500">Total Kuantitas Fisik:</span>
                                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{totalQty} Unit</span>
                                </div>
                                <div className="pt-2">
                                    <Link to={`/inventory/department-stocks/${department.id}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs shadow-none gap-1.5 font-medium"
                                        >
                                            <Package className="size-3.5" />
                                            <span>Buka Kartu Persediaan Fisik Unit</span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Users in Department Section */}
                        <div>
                            <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                    <Users className="size-3.5" />
                                    <span>Daftar User di Departemen ({deptUsers.length})</span>
                                </h3>
                                <Link to={`/inventory/departments/${department.id}/users`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none gap-1"
                                    >
                                        <Users className="size-3" />
                                        <span>Assign / Kelola Users</span>
                                    </Button>
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                                            <th className="py-2.5 px-3 w-36">NIP</th>
                                            <th className="py-2.5 px-3">Nama Pegawai</th>
                                            <th className="py-2.5 px-3 w-48">Role / Jabatan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {deptUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-neutral-400 text-xs italic font-mono">
                                                    Belum ada user yang ditugaskan di departemen ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            deptUsers.map((u, idx) => (
                                                <tr key={u.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50">
                                                    <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                            {u.nip}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">
                                                        {u.name}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                            {u.role?.display_name || u.role?.name || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
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
export default DepartmentShow;
