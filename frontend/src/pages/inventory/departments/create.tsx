import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { Can } from '@/components/can';

export const DepartmentCreate: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [level, setLevel] = useState<number>(1);
    const [parentId, setParentId] = useState<number | ''>('');
    const [isActive, setIsActive] = useState<boolean>(true);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const res = await inventoryApi.getDepartments();
                if (res.data?.success) {
                    setDepartments(res.data.data || []);
                }
            } catch {
                // ignore
            }
        };
        fetchDepts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !name.trim()) {
            toast.error('Kode dan Nama Departemen wajib diisi');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                code: code.trim(),
                name: name.trim(),
                level: Number(level),
                parent_id: parentId ? Number(parentId) : null,
                is_active: isActive,
            };

            await inventoryApi.createDepartment(payload);
            toast.success('Departemen berhasil ditambahkan');
            navigate('/inventory/departments');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan departemen');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <form onSubmit={handleSubmit} className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
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
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Tambah Unit / Departemen Baru
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Master Struktur Organisasi & Sub-Gudang Rumah Sakit</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-4 space-y-4 w-full max-w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Kode Departemen <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="Contoh: FAR, IGD, POLI, LAB"
                                    className="mt-1.5 h-8 text-xs font-mono uppercase rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    required
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Nama Departemen / Ruangan <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Instalasi Farmasi, IGD Lt. 1"
                                    className="mt-1.5 h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Level Hierarki
                                </Label>
                                <NativeSearchableSelect
                                    value={level}
                                    onChange={(e) => setLevel(Number(e.target.value))}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                >
                                    <option value={1}>Level 1 (Divisi / Instalasi Utama)</option>
                                    <option value={2}>Level 2 (Unit / Bagian)</option>
                                    <option value={3}>Level 3 (Sub-Unit / Ruangan)</option>
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Induk Departemen (Parent)
                                </Label>
                                <NativeSearchableSelect
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                >
                                    <option value="">-- Tanpa Induk (Root) --</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({d.code})
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    Status Operasional
                                </Label>
                                <NativeSearchableSelect
                                    value={isActive ? '1' : '0'}
                                    onChange={(e) => setIsActive(e.target.value === '1')}
                                    className="w-full mt-1.5 h-8 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-none px-2 focus:outline-none"
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </NativeSearchableSelect>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer: Actions */}
                    <div className="px-4 py-3 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/inventory/departments')}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs px-3 shadow-none"
                        >
                            Batal
                        </Button>
                        <Can permission="inventory.departments.create">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving}
                                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                            >
                                <Save className="size-3.5" />
                                <span>{saving ? 'Menyimpan...' : 'Simpan Departemen'}</span>
                            </Button>
                        </Can>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};
export default DepartmentCreate;
