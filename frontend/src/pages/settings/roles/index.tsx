import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, KeyRound, Check, RefreshCw, Lock, Sparkles, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionItem {
    id: number;
    name: string;
    display_name: string;
    description: string;
}

interface RoleItem {
    id: number;
    name: string;
    display_name: string;
    description: string;
    permissions?: PermissionItem[];
}

export const RolesIndex: React.FC = () => {
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [permissions, setPermissions] = useState<PermissionItem[]>([]);
    const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/roles'),
                api.get('/permissions'),
            ]);

            if (rolesRes.data?.data) {
                setRoles(rolesRes.data.data);
                if (rolesRes.data.data.length > 0) {
                    setSelectedRole(rolesRes.data.data[0]);
                }
            }
            if (permsRes.data?.data) {
                setPermissions(permsRes.data.data);
            }
        } catch {
            toast.error('Gagal memuat roles & permissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const roleHasPermission = (role: RoleItem | null, permName: string) => {
        if (!role) return false;
        if (role.name === 'admin' || role.name === 'superadmin') return true;
        return role.permissions?.some((p) => p.name === permName) ?? false;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Pengaturan & Akses', href: '#' },
                { title: 'Roles & Hak Akses' },
            ]}
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Role List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Daftar Peran (Roles)
                        </h2>
                        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="h-8 px-2">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">Memuat peran...</div>
                        ) : (
                            roles.map((r) => {
                                const isSelected = selectedRole?.id === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => setSelectedRole(r)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                                                ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                                                : 'bg-card border-border hover:bg-muted/40'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                    <span>{r.display_name || r.name}</span>
                                                    {r.name === 'admin' && (
                                                        <Badge variant="secondary" className="text-[11px] h-5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                            Akses Penuh
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {r.description || `Hak akses tingkat ${r.name}`}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {r.name === 'admin' ? permissions.length : r.permissions?.length || 0} Izin
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right: Permission Matrix */}
                <div className="lg:col-span-8">
                    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b bg-muted/30 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-primary" />
                                    Matriks Izin: {selectedRole?.display_name || selectedRole?.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Daftar izin operasional yang aktif untuk peran yang dipilih
                                </p>
                            </div>
                            {selectedRole?.name === 'admin' ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Semua Hak Akses Diberikan
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-xs">
                                    Mode Terbatas
                                </Badge>
                            )}
                        </div>

                        <div className="p-5">
                            {loading ? (
                                <div className="py-12 text-center text-sm text-muted-foreground">
                                    Memuat daftar izin...
                                </div>
                            ) : permissions.length === 0 ? (
                                <div className="py-12 text-center text-sm text-muted-foreground">
                                    Tidak ada izin sistem yang terdaftar
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {permissions.map((p) => {
                                        const granted = roleHasPermission(selectedRole, p.name);
                                        return (
                                            <div
                                                key={p.id}
                                                className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${granted
                                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                                        : 'bg-muted/20 border-border/60 opacity-60'
                                                    }`}
                                            >
                                                <div
                                                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 text-xs ${granted
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-muted border border-muted-foreground/30 text-transparent'
                                                        }`}
                                                >
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="text-xs font-semibold text-foreground">
                                                        {p.display_name || p.name}
                                                    </div>
                                                    <div className="text-[11px] font-mono text-muted-foreground">
                                                        {p.name}
                                                    </div>
                                                    {p.description && (
                                                        <div className="text-[11px] text-muted-foreground/80 line-clamp-1">
                                                            {p.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default RolesIndex;
