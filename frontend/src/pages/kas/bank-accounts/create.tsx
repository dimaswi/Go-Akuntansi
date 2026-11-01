import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Rekening Bank', href: '/kas/bank-accounts' },
    { title: 'Tambah Rekening' },
];

export default function BankAccountCreate() {
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [bankAccountsCOA, setBankAccountsCOA] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);

    const [namaBank, setNamaBank] = useState('');
    const [nomorRekening, setNomorRekening] = useState('');
    const [namaRekening, setNamaRekening] = useState('');
    const [kodeRekening, setKodeRekening] = useState('');
    const [jenisRekening, setJenisRekening] = useState<'tabungan' | 'giro' | 'deposito' | 'kredit'>('tabungan');
    const [daftarAkunId, setDaftarAkunId] = useState<string>('');
    const [saldoAwal, setSaldoAwal] = useState('0');
    const [cabang, setCabang] = useState('');
    const [keterangan, setKeterangan] = useState('');

    useEffect(() => {
        api.get('/daftar-akun')
            .then((res) => {
                const data: ChartOfAccount[] = res.data.data || [];
                setAccounts(data);
                // Filter akun bank (kode 1102 atau nama mengandung Bank)
                const bankAccounts = data.filter(
                    (a) =>
                        a.kode_akun.startsWith('1102') ||
                        a.nama_akun.toLowerCase().includes('bank')
                );
                setBankAccountsCOA(bankAccounts.length > 0 ? bankAccounts : data);
                if (bankAccounts.length > 0) {
                    setDaftarAkunId(String(bankAccounts[0].id));
                }
            })
            .catch(() => toast.error('Gagal memuat bagan akun'));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!namaBank.trim() || !nomorRekening.trim() || !namaRekening.trim()) {
            toast.error('Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi');
            return;
        }

        const saldo = parseFloat(saldoAwal);
        if (isNaN(saldo)) {
            toast.error('Saldo awal harus berupa angka valid');
            return;
        }

        setLoading(true);
        try {
            await api.post('/kas/bank-accounts', {
                nama_bank: namaBank.trim(),
                nomor_rekening: nomorRekening.trim(),
                nama_rekening: namaRekening.trim(),
                kode_rekening: kodeRekening.trim(),
                jenis_rekening: jenisRekening,
                daftar_akun_id: daftarAkunId ? Number(daftarAkunId) : null,
                saldo_awal: saldo,
                cabang: cabang.trim(),
                keterangan: keterangan.trim(),
                is_active: true,
            });

            toast.success('Rekening bank berhasil didaftarkan');
            navigate('/kas/bank-accounts');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menambahkan rekening bank');
        } finally {
            setLoading(false);
        }
    };

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
                                        Tambah Rekening Bank Baru
                                    </h1>
                                    <p className="text-[11px] text-neutral-500 font-mono">
                                        Daftarkan rekening bank, giro, atau tabungan entitas bisnis
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
                                        placeholder="Contoh: Bank Central Asia (BCA)"
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
                                        placeholder="Contoh: 1234567890"
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
                                        placeholder="Contoh: PT Akuntansi Digital"
                                        value={namaRekening}
                                        onChange={(e) => setNamaRekening(e.target.value)}
                                        required
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                {/* Jenis Rekening (Sesuai Laravel: Tabungan, Giro, Deposito, Kredit) */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Jenis Rekening <span className="text-rose-500">*</span>
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

                        {/* 3. Account Linkage & Financial Strip (SearchableAccountSelect) */}
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

                                {/* Saldo Awal */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Saldo Awal (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={saldoAwal}
                                            onChange={(e) => setSaldoAwal(e.target.value)}
                                            placeholder="0"
                                            className="h-8 text-xs font-mono font-bold rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                        />
                                        {saldoAwal && Number(saldoAwal) > 0 && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-neutral-500 pointer-events-none">
                                                {formatRupiah(Number(saldoAwal))}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Cabang */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Kantor Cabang
                                    </label>
                                    <Input
                                        placeholder="Contoh: KCU Sudirman Jakarta"
                                        value={cabang}
                                        onChange={(e) => setCabang(e.target.value)}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>

                                {/* Kode Rekening Internal */}
                                <div>
                                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                        Kode Rekening (Opsional)
                                    </label>
                                    <Input
                                        placeholder="Contoh: BANK-BCA-01"
                                        value={kodeRekening}
                                        onChange={(e) => setKodeRekening(e.target.value)}
                                        className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="mt-4">
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Catatan / Keterangan
                                </label>
                                <Textarea
                                    rows={2}
                                    placeholder="Catatan tambahan mengenai rekening ini..."
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
                                Batal
                            </Button>
                            <Can permission="kas.bank-account.create">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={loading}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Save className="size-3.5" />
                                    <span>Simpan Rekening</span>
                                </Button>
                            </Can>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
