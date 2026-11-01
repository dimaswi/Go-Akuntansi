import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/api/client';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    ArrowLeft,
    Users,
    UserPlus,
    UserMinus,
    Search,
    RefreshCw,
} from 'lucide-react';

interface UserRecord {
    id: number;
    name: string;
    nip: string;
    role_id?: number | null;
    department_id?: number | null;
    role?: {
        id: number;
        name: string;
        display_name?: string;
    } | null;
    department?: {
        id: number;
        code: string;
        name: string;
    } | null;
}

interface DepartmentRecord {
    id: number;
    code: string;
    name: string;
    level?: number;
    is_active?: boolean;
}

export const DepartmentUsers: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [department, setDepartment] = useState<DepartmentRecord | null>(null);
    const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [processing, setProcessing] = useState<boolean>(false);

    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [searchAvailable, setSearchAvailable] = useState<string>('');
    const [searchAssigned, setSearchAssigned] = useState<string>('');
    const [userToRemove, setUserToRemove] = useState<UserRecord | null>(null);

    const fetchData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [deptRes, usersRes] = await Promise.all([
                api.get(`/departments/${id}`),
                api.get('/users', { params: { page: 1, limit: 500, per_page: 500 } }),
            ]);

            if (deptRes.data?.success) {
                setDepartment(deptRes.data.data);
            }

            let rawUsers: UserRecord[] =
                usersRes.data?.data?.data ||
                usersRes.data?.data?.items ||
                (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);

            const totalPages = Number(usersRes.data?.meta?.total_pages || 1);
            if (totalPages > 1) {
                const pagePromises = [];
                for (let p = 2; p <= totalPages; p++) {
                    pagePromises.push(api.get('/users', { params: { page: p, limit: 500, per_page: 500 } }));
                }
                const extraPages = await Promise.all(pagePromises);
                for (const ep of extraPages) {
                    const more =
                        ep.data?.data?.data ||
                        ep.data?.data?.items ||
                        (Array.isArray(ep.data?.data) ? ep.data.data : []);
                    rawUsers = [...rawUsers, ...more];
                }
            }

            setAllUsers(rawUsers);
        } catch {
            toast.error('Gagal memuat data pengguna departemen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const deptIdNum = Number(id);

    const departmentUsers = allUsers.filter(
        (u) => Number(u.department_id || u.department?.id || 0) === deptIdNum
    );

    const availableUsers = allUsers.filter(
        (u) => Number(u.department_id || u.department?.id || 0) !== deptIdNum
    );

    const filteredAvailable = availableUsers.filter((u) => {
        if (!searchAvailable.trim()) return true;
        const q = searchAvailable.toLowerCase();
        return (
            u.name?.toLowerCase().includes(q) ||
            u.nip?.toLowerCase().includes(q) ||
            u.role?.display_name?.toLowerCase().includes(q) ||
            u.role?.name?.toLowerCase().includes(q) ||
            u.department?.name?.toLowerCase().includes(q)
        );
    });

    const filteredAssigned = departmentUsers.filter((u) => {
        if (!searchAssigned.trim()) return true;
        const q = searchAssigned.toLowerCase();
        return (
            u.name?.toLowerCase().includes(q) ||
            u.nip?.toLowerCase().includes(q) ||
            u.role?.display_name?.toLowerCase().includes(q) ||
            u.role?.name?.toLowerCase().includes(q)
        );
    });

    const handleToggleUser = (userId: number, checked: boolean) => {
        if (checked) {
            setSelectedUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        } else {
            setSelectedUsers((prev) => prev.filter((uid) => uid !== userId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(filteredAvailable.map((u) => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleAssignUsers = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Pilih minimal 1 user untuk di-assign ke departemen ini');
            return;
        }

        try {
            setProcessing(true);
            const targetUsers = allUsers.filter((u) => selectedUsers.includes(u.id));
            await Promise.all(
                targetUsers.map((u) =>
                    api.put(`/users/${u.id}`, {
                        name: u.name,
                        nip: u.nip,
                        role_id: u.role_id ?? u.role?.id ?? null,
                        department_id: deptIdNum,
                    })
                )
            );
            toast.success(`${targetUsers.length} user berhasil ditambahkan ke departemen ${department?.name || ''}`);
            setSelectedUsers([]);
            await fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menambahkan user ke departemen');
        } finally {
            setProcessing(false);
        }
    };

    const handleRemoveUser = async () => {
        if (!userToRemove) return;

        try {
            setProcessing(true);
            await api.put(`/users/${userToRemove.id}`, {
                name: userToRemove.name,
                nip: userToRemove.nip,
                role_id: userToRemove.role_id ?? userToRemove.role?.id ?? null,
                department_id: null,
            });
            toast.success(`User "${userToRemove.name}" berhasil dikeluarkan dari departemen`);
            setUserToRemove(null);
            await fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal mengeluarkan user dari departemen');
        } finally {
            setProcessing(false);
        }
    };

    const allFilteredSelected =
        filteredAvailable.length > 0 &&
        filteredAvailable.every((u) => selectedUsers.includes(u.id));

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar */}
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
                                    <Users className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            Kelola Users Departemen: {department?.name || '...'}
                                        </h1>
                                        {department?.code && (
                                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                                                {department.code}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Terdaftar: {departmentUsers.length} User</span>
                                        <span>•</span>
                                        <span>Tersedia: {availableUsers.length} User</span>
                                        <span>•</span>
                                        <span>Penugasan Personel & Hak Akses Unit Kerja</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                disabled={loading || processing}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', (loading || processing) && 'animate-spin')} />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Two-Column Divided Content (No Nested Bordered Cards) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
                        {/* Left Column: Available Users */}
                        <div className="flex flex-col">
                            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                            <UserPlus className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span>User Tersedia ({filteredAvailable.length})</span>
                                        </h2>
                                        <p className="text-[11px] text-neutral-500 mt-0.5">
                                            Pilih user yang akan ditempatkan ke departemen ini
                                        </p>
                                    </div>

                                    {availableUsers.length > 0 && (
                                        <Can permission="inventory.departments.edit">
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleAssignUsers}
                                                disabled={selectedUsers.length === 0 || processing}
                                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                            >
                                                <UserPlus className="size-3.5" />
                                                <span>Assign ({selectedUsers.length})</span>
                                            </Button>
                                        </Can>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                        <Input
                                            placeholder="Cari NIP, nama user, atau unit asal..."
                                            value={searchAvailable}
                                            onChange={(e) => setSearchAvailable(e.target.value)}
                                            className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                        />
                                    </div>
                                    {filteredAvailable.length > 0 && (
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={allFilteredSelected}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="size-3.5 accent-neutral-900 rounded-none cursor-pointer"
                                            />
                                            <span>Pilih Semua</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/95 dark:bg-neutral-900/95 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-10 text-center">Pilih</th>
                                            <th className="py-2.5 px-3 w-28 whitespace-nowrap">NIP</th>
                                            <th className="py-2.5 px-3">Nama Pegawai</th>
                                            <th className="py-2.5 px-3">Unit Saat Ini</th>
                                            <th className="py-2.5 px-3 w-28">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                                    Memuat daftar user...
                                                </td>
                                            </tr>
                                        ) : filteredAvailable.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                                    Tidak ada user tersedia.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAvailable.map((user) => {
                                                const isChecked = selectedUsers.includes(user.id);
                                                return (
                                                    <tr
                                                        key={user.id}
                                                        onClick={() => handleToggleUser(user.id, !isChecked)}
                                                        className={cn(
                                                            'hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none',
                                                            isChecked && 'bg-blue-50/40 dark:bg-blue-950/20'
                                                        )}
                                                    >
                                                        <td
                                                            className="py-2 px-3 text-center"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => handleToggleUser(user.id, e.target.checked)}
                                                                className="size-3.5 accent-neutral-900 rounded-none cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-3 whitespace-nowrap">
                                                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                                {user.nip}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">
                                                            {user.name}
                                                        </td>
                                                        <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
                                                            {user.department?.name ? (
                                                                <span className="text-[11px] font-mono">
                                                                    {user.department.name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-neutral-400 italic text-[11px]">Belum ada unit</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-3 whitespace-nowrap">
                                                            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                                {user.role?.display_name || user.role?.name || '-'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Column: Users in Department */}
                        <div className="flex flex-col">
                            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between gap-2 min-h-8">
                                    <div>
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                            <Users className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                                            <span>User di Departemen Ini ({filteredAssigned.length})</span>
                                        </h2>
                                        <p className="text-[11px] text-neutral-500 mt-0.5">
                                            Daftar user yang saat ini terdaftar di unit {department?.name || ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari user yang sudah terdaftar di unit ini..."
                                        value={searchAssigned}
                                        onChange={(e) => setSearchAssigned(e.target.value)}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/95 dark:bg-neutral-900/95 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                                            <th className="py-2.5 px-3 w-28 whitespace-nowrap">NIP</th>
                                            <th className="py-2.5 px-3">Nama Pegawai</th>
                                            <th className="py-2.5 px-3 w-32">Role</th>
                                            <th className="py-2.5 px-3 w-20 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                                    Memuat daftar user departemen...
                                                </td>
                                            </tr>
                                        ) : filteredAssigned.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                                    Belum ada user di departemen ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAssigned.map((user, idx) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition"
                                                >
                                                    <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2 px-3 whitespace-nowrap">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                            {user.nip}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">
                                                        {user.name}
                                                    </td>
                                                    <td className="py-2 px-3 whitespace-nowrap">
                                                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                            {user.role?.display_name || user.role?.name || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-right whitespace-nowrap">
                                                        <Can permission="inventory.departments.edit">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                disabled={processing}
                                                                onClick={() => setUserToRemove(user)}
                                                                className="size-7 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                                                                title="Keluarkan dari Departemen"
                                                            >
                                                                <UserMinus className="size-3.5" />
                                                            </Button>
                                                        </Can>
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

            <ConfirmDialog
                open={!!userToRemove}
                onOpenChange={(open) => !open && setUserToRemove(null)}
                title="Keluarkan User dari Departemen"
                description={`Apakah Anda yakin ingin mengeluarkan "${userToRemove?.name || ''}" dari departemen ${department?.name || 'ini'}?`}
                confirmText="Keluarkan User"
                variant="destructive"
                onConfirm={handleRemoveUser}
                loading={processing}
            />
        </AppLayout>
    );
};

export default DepartmentUsers;

