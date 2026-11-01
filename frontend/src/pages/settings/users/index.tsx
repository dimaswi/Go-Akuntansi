import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Shield, UserCheck, RefreshCw, KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserItem {
    id: number;
    name: string;
    nip: string;
    role_id: number;
    department_id: number;
    created_at: string;
    role?: {
        id: number;
        name: string;
        display_name: string;
    };
}

export const UsersIndex: React.FC = () => {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            if (res.data?.data) {
                setUsers(res.data.data);
            }
        } catch {
            toast.error('Gagal memuat data pengguna');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.nip.toLowerCase().includes(search.toLowerCase()) ||
            (u.role?.display_name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Pengaturan & Akses', href: '#' },
                { title: 'Manajemen Pengguna' },
            ]}
        >
            <div className="space-y-6">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama, NIP, atau peran..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Segarkan
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 w-16">No</th>
                                    <th className="px-5 py-3.5">Pegawai & NIP</th>
                                    <th className="px-5 py-3.5">Role / Peran</th>
                                    <th className="px-5 py-3.5">Departemen ID</th>
                                    <th className="px-5 py-3.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                                                <span>Memuat daftar pengguna...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <p className="font-medium">Tidak ada data pengguna ditemukan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u, idx) => (
                                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                        {u.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-foreground">{u.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                                                            <span>NIP: {u.nip}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge variant="outline" className="gap-1.5 font-normal capitalize">
                                                    <Shield className="w-3 h-3 text-primary" />
                                                    {u.role?.display_name || u.role?.name || (u.role_id ? `Role #${u.role_id}` : 'Staff')}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                                                {u.department_id ? `Dept #${u.department_id}` : '-'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Aktif
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                        <span>Total {filteredUsers.length} pengguna terdaftar</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default UsersIndex;
