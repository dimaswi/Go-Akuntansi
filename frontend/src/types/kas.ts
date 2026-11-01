import { ChartOfAccount } from './accounting';

export type JenisRekening = 'giro' | 'tabungan' | 'deposito' | 'kredit' | string;

export interface BankAccount {
    id: number;
    kode_rekening: string;
    nama_bank: string;
    nama_rekening: string;
    nomor_rekening: string;
    cabang?: string;
    saldo_awal: number;
    saldo_berjalan: number;
    daftar_akun_id?: number | null;
    daftar_akun?: ChartOfAccount | null;
    jenis_rekening: JenisRekening;
    keterangan?: string;
    is_aktif: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export type JenisTransaksiKas = 'penerimaan' | 'pengeluaran' | string;

export interface CashTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: 'penerimaan' | 'pengeluaran' | string;
    kategori_transaksi?: string;
    jumlah: number;
    keterangan: string;
    pihak_terkait?: string;
    referensi?: string;
    daftar_akun_kas_id: number;
    daftar_akun_kas?: ChartOfAccount | null;
    daftar_akun_lawan_id?: number | null;
    daftar_akun_lawan?: ChartOfAccount | null;
    jurnal_id?: number | null;
    jurnal?: { id: number; nomor_jurnal: string; tanggal_transaksi?: string; details?: any[] } | null;
    status: 'draft' | 'posted' | 'cancelled' | string;
    user_id?: number;
    user?: { id: number; name: string };
    posted_at?: string | null;
    posted_by?: number | null;
    poster?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
}

export interface CashSummary {
    total_penerimaan: number;
    total_pengeluaran: number;
    total_draft: number;
    saldo_kas: number;
}

export type JenisTransaksiBank = 'setoran' | 'penarikan' | 'transfer' | 'penerimaan' | 'pengeluaran' | string;

export interface BankTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    tanggal_efektif?: string | null;
    jenis_transaksi: JenisTransaksiBank;
    kategori_transaksi?: string;
    bank_account_id: number;
    bank_account?: BankAccount | null;
    jumlah: number;
    keterangan: string;
    referensi?: string;
    nomor_referensi?: string;
    pihak_terkait?: string;
    daftar_akun_lawan_id?: number | null;
    daftar_akun_lawan?: ChartOfAccount | null;
    jurnal_id?: number | null;
    jurnal?: { id: number; nomor_jurnal: string; tanggal_transaksi?: string; details?: any[] } | null;
    status: 'draft' | 'posted' | 'reconciled' | 'cancelled' | string;
    is_reconciled: boolean;
    tanggal_rekonsiliasi?: string | null;
    user_id?: number;
    user?: { id: number; name: string };
    posted_at?: string | null;
    posted_by?: number | null;
    poster?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
}

export interface BankSummary {
    total_masuk: number;
    total_keluar: number;
    total_draft: number;
    total_reconciled: number;
    net_bank: number;
}

export type JenisGiro = 'masuk' | 'keluar' | string;
export type StatusGiro = 'diterima' | 'diserahkan_ke_bank' | 'cair' | 'tolak' | 'batal' | string;

export interface GiroTransaction {
    id: number;
    nomor_giro: string;
    tanggal_giro?: string;
    tanggal_terima?: string;
    tanggal_jatuh_tempo: string;
    tanggal_cair?: string | null;
    jenis_giro: JenisGiro;
    status_giro: StatusGiro;
    status: 'draft' | 'posted' | string;
    bank_account_id: number;
    bank_account?: BankAccount | null;
    jumlah: number;
    penerbit?: string;
    nama_penerbit?: string;
    penerima?: string;
    bank_penerbit?: string;
    keterangan?: string;
    referensi?: string;
    nomor_referensi?: string;
    daftar_akun_id?: number | null;
    daftar_akun?: ChartOfAccount | null;
    daftar_akun_giro_id?: number | null;
    daftar_akun_giro?: ChartOfAccount | null;
    daftar_akun_lawan_id?: number | null;
    daftar_akun_lawan?: ChartOfAccount | null;
    jurnal_terima_id?: number | null;
    jurnal_cair_id?: number | null;
    jurnal_id?: number | null;
    jurnal?: { id: number; nomor_jurnal: string } | null;
    user_id?: number;
    user?: { id: number; name: string };
    posted_at?: string | null;
    posted_by?: number | null;
    posting_notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface GiroReportSummaryGroup {
    count: number;
    total: number;
}

export interface GiroReportResponse {
    summary: {
        masuk: GiroReportSummaryGroup;
        keluar: GiroReportSummaryGroup;
        cair: GiroReportSummaryGroup;
        outstanding: GiroReportSummaryGroup;
    };
    data: GiroTransaction[];
    items?: GiroTransaction[];
    statistics?: any[];
}
