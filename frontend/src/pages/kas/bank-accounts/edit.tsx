import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { BankAccount } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Rekening Bank', href: '/kas/bank-accounts' },
    { title: 'Edit Rekening' },
];

export default function BankAccountEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [account, setAccount] = useState<BankAccount | null>(null);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [bankAccountsCOA, setBankAccountsCOA] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [namaBank, setNamaBank] = useState('');
    const [nomorRekening, setNomorRekening] = useState('');
    const [namaRekening, setNamaRekening] = useState('');
    const [kodeRekening, setKodeRekening] = useState('');
    const [jenisRekening, setJenisRekening] = useState<'tabungan' | 'giro' | 'deposito' | 'kredit'>('tabungan');
    const [daftarAkunId, setDaftarAkunId] = useState<string>('');
    const [cabang, setCabang] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setFetching(true);
            try {
                const [accRes, bankRes] = await Promise.all([
                    api.get('/daftar-akun'),
                    api.get(`/kas/bank-accounts/${id}`),
                ]);

                const dataAccounts: ChartOfAccount[] = accRes.data.data || [];
                setAccounts(dataAccounts);
                const bankCoa = dataAccounts.filter(
                    (a) =>
                        a.kode_akun.startsWith('1102') ||
                        a.nama_akun.toLowerCase().includes('bank')
                );
                setBankAccountsCOA(bankCoa.length > 0 ? bankCoa : dataAccounts);

                const b: BankAccount = bankRes.data.data;
                setAccount(b);

                setNamaBank(b.nama_bank);
                setNomorRekening(b.nomor_rekening);
                setNamaRekening(b.nama_rekening);
                setKodeRekening(b.kode_rekening || '');
                setJenisRekening((b.jenis_rekening as any) || 'tabungan');
                setDaftarAkunId(b.daftar_akun_id ? String(b.daftar_akun_id) : '');
                setCabang(b.cabang || '');
                setKeterangan(b.keterangan || '');
                setIsActive(b.is_active ?? b.is_aktif ?? true);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Gagal memuat data rekening bank');
                navigate('/kas/bank-accounts');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            loadData();
        }
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!namaBank.trim() || !nomorRekening.trim() || !namaRekening.trim()) {
            toast.error('Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/kas/bank-accounts/${id}`, {
                nama_bank: namaBank.trim(),
                nomor_rekening: nomorRekening.trim(),
                nama_rekening: namaRekening.trim(),
                kode_rekening: kodeRekening.trim(),
                jenis_rekening: jenisRekening,
                daftar_akun_id: daftarAkunId ? Number(daftarAkunId) : null,
                cabang: cabang.trim(),
                keterangan: keterangan.trim(),
                is_active: isActive,
            });

            toast.success('Rekening bank berhasil diperbarui');
            navigate('/kas/bank-accounts');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui rekening bank');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full max-w-full">
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                        Memuat data rekening bank...
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* Satu Kontainer Card Utuh */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar: Icon-Only Back Button + Title on Left */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/bank-accounts')}
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
                                        Edit Rekening Bank: {account?.nama_bank} - {account?.nomor_rekening}
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Perbarui data rekening dan konfigurasi akun buku besar
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Form Parameter Strip */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Nama Bank */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Nama Bank <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={namaBank}
                                        onChange={(e) => setNamaBank(e.target.value)}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                {/* Nomor Rekening */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Nomor Rekening <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={nomorRekening}
                                        onChange={(e) => setNomorRekening(e.target.value)}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>

                                {/* Nama Rekening */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Nama Pemilik (A/N) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={namaRekening}
                                        onChange={(e) => setNamaRekening(e.target.value)}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                {/* Jenis Rekening (Sesuai Laravel: Tabungan, Giro, Deposito, Kredit) */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Jenis Rekening
                                    </label>
                                    <NativeSearchableSelect
                                        value={jenisRekening}
                                        onChange={(e) => setJenisRekening(e.target.value as any)}
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer"
                                    >
                                        <option value="tabungan">Tabungan</option>
                                        <option value="giro">Giro</option>
                                        <option value="deposito">Deposito</option>
                                        <option value="kredit">Kredit</option>
                                    </NativeSearchableSelect>
                                </div>
                            </div>
                        </div>

                        {/* 3. Account Linkage & Status Strip (SearchableAccountSelect) */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Akun Terkait (SearchableAccountSelect) */}
                                <div>
                                    <SearchableAccountSelect
                                        accounts={bankAccountsCOA.length > 0 ? bankAccountsCOA : accounts}
                                        value={daftarAkunId}
                                        onValueChange={(val) => setDaftarAkunId(val)}
                                        label="Akun Terkait (COA) *"
                                        placeholder="Cari akun rekening bank..."
                                    />
                                </div>

                                {/* Cabang */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Kantor Cabang
                                    </label>
                                    <Input
                                        value={cabang}
                                        onChange={(e) => setCabang(e.target.value)}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                {/* Kode Rekening Internal */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Kode Internal Rekening
                                    </label>
                                    <Input
                                        value={kodeRekening}
                                        onChange={(e) => setKodeRekening(e.target.value)}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>

                                {/* Status Aktif */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Status Rekening
                                    </label>
                                    <NativeSearchableSelect
                                        value={isActive ? 'true' : 'false'}
                                        onChange={(e) => setIsActive(e.target.value === 'true')}
                                        className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none font-medium cursor-pointer"
                                    >
                                        <option value="true">Aktif Digunakan</option>
                                        <option value="false">Nonaktif (Arsip)</option>
                                    </NativeSearchableSelect>
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="mt-4">
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Catatan / Keterangan
                                </label>
                                <Textarea
                                    rows={2}
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    className="text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-sans"
                                />
                            </div>
                        </div>

                        {/* 4. Action Footer */}
                        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/kas/bank-accounts')}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-3 shadow-none"
                            >
                                Kembali
                            </Button>
                            <Can permission="kas.bank-account.edit">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={loading}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>Simpan Perubahan</span>
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
