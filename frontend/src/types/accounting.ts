export type JenisAkun = 'aset' | 'kewajiban' | 'ekuitas' | 'pendapatan' | 'beban';
export type SaldoNormal = 'debit' | 'kredit';

export interface ChartOfAccount {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: JenisAkun;
    sub_jenis?: string;
    saldo_normal: SaldoNormal;
    induk_akun_id?: number | null;
    induk_akun?: ChartOfAccount;
    sub_akun?: ChartOfAccount[];
    level: number;
    is_aktif: boolean;
    keterangan?: string;
}

export type JournalStatus = 'draft' | 'posted' | 'reversed';
export type JenisJurnal = 'umum' | 'penyesuaian' | 'penutup' | 'pembalik';

export interface JournalDetail {
    id?: number;
    daftar_akun_id: number;
    daftar_akun?: ChartOfAccount;
    jumlah_debit: number | string;
    jumlah_kredit: number | string;
    keterangan?: string;
}

export interface Journal {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    jenis_referensi?: string;
    nomor_referensi?: string;
    jenis_jurnal: JenisJurnal;
    keterangan?: string;
    total_debit: number | string;
    total_kredit: number | string;
    status: JournalStatus;
    details: JournalDetail[];
    created_at: string;
}

export interface BukuBesarEntry {
    tanggal_transaksi: string;
    nomor_jurnal: string;
    keterangan: string;
    debit: number | string;
    kredit: number | string;
    saldo: number | string;
}

export interface BukuBesarResponse {
    akun: ChartOfAccount;
    saldo_awal: number | string;
    total_debit: number | string;
    total_kredit: number | string;
    saldo_akhir: number | string;
    transactions: BukuBesarEntry[];
}

export interface BukuBesarAccountSummary {
    akun: ChartOfAccount;
    saldo_awal: number | string;
    mutasi_debet: number | string;
    mutasi_kredit: number | string;
    saldo_akhir: number | string;
    transaksi_count: number;
}

export interface BukuBesarSummaryResponse {
    periode_dari: string;
    periode_sampai: string;
    total_saldo_awal: number | string;
    total_mutasi_debet: number | string;
    total_mutasi_kredit: number | string;
    total_saldo_akhir: number | string;
    accounts: BukuBesarAccountSummary[];
}

export interface TemplatePenyesuaian {
    id: string;
    nama: string;
    kategori: string;
    keterangan: string;
    debit_hint: string;
    kredit_hint: string;
    debit_filter?: string;
    kredit_filter?: string;
}

export interface DampakJurnalDetail {
    nomor_jurnal: string;
    tanggal: string;
    keterangan: string;
    debit: number | string;
    kredit: number | string;
    net: number | string;
}

export interface DampakAkunItem {
    akun_id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
    total_debit: number | string;
    total_kredit: number | string;
    net: number | string;
    jurnal_list: DampakJurnalDetail[];
}

export interface DampakPenyesuaianResponse {
    periode_dari: string;
    periode_sampai: string;
    total_jurnal_penyesuaian: number;
    dampak_pendapatan: number | string;
    dampak_beban: number | string;
    dampak_laba_rugi: number | string;
    dampak_aset: number | string;
    dampak_kewajiban: number | string;
    dampak_modal: number | string;
    dampak_per_jenis_akun: {
        aset: DampakAkunItem[];
        kewajiban: DampakAkunItem[];
        ekuitas: DampakAkunItem[];
        pendapatan: DampakAkunItem[];
        beban: DampakAkunItem[];
    };
}

export interface ArusKasDetail {
    tanggal: string;
    keterangan: string;
    referensi: string;
    kas_masuk: number | string;
    kas_keluar: number | string;
    net: number | string;
}

export interface ArusKasAccountGroup {
    akun: ChartOfAccount;
    saldo_awal: number | string;
    total_masuk: number | string;
    total_keluar: number | string;
    net: number | string;
    saldo_akhir: number | string;
    transaksi: ArusKasDetail[];
}

export interface ArusKasResponse {
    periode_dari: string;
    periode_sampai: string;
    total_saldo_awal: number | string;
    total_kas_masuk: number | string;
    total_kas_keluar: number | string;
    net_arus_kas: number | string;
    total_saldo_akhir: number | string;
    accounts: ArusKasAccountGroup[];
}

export interface DetailLabaDitahanBulan {
    bulan: string;
    tahun: number;
    bulan_num: number;
    periode_dari: string;
    periode_sampai: string;
    laba_rugi: number | string;
    saldo_akumulasi: number | string;
}

export interface DetailModalAccount {
    akun: ChartOfAccount;
    saldo_awal: number | string;
    mutasi: number | string;
    saldo_akhir: number | string;
}

export interface PerubahanModalResponse {
    periode_dari: string;
    periode_sampai: string;
    saldo_awal_modal: number | string;
    laba_ditahan: number | string;
    detail_laba_ditahan_per_bulan: DetailLabaDitahanBulan[];
    laba_rugi_periode: number | string;
    tambahan_investasi: number | string;
    penarikan: number | string;
    saldo_akhir_modal: number | string;
    detail_modal: DetailModalAccount[];
}

export interface AnalisisRasioResponse {
    periode_dari?: string;
    periode_sampai?: string;
    tanggal?: string;
    total_aset_lancar: number | string;
    total_kewajiban_lancar: number | string;
    total_kas: number | string;
    total_persediaan: number | string;
    total_aset: number | string;
    total_kewajiban: number | string;
    total_ekuitas: number | string;
    modal_kerja: number | string;
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    debt_to_asset_ratio: number;
    debt_to_equity_ratio: number;
}

