import api from './client';

export interface SalaryBatch {
    id: number;
    batch_number: string;
    period_month: number;
    period_year: number;
    period_display: string;
    description?: string;
    total_employees: number;
    total_pendapatan: number;
    total_potongan: number;
    total_gaji_bersih: number;
    status: 'draft' | 'done' | 'posted';
    payment_account_id: number;
    payment_account?: { id: number; kode_akun: string; nama_akun: string; jenis_akun: string };
    journal_id?: number;
    journal?: { id: number; nomor_jurnal: string };
    created_by: number;
    creator?: { id: number; name: string };
    posted_by?: number;
    posted_at?: string;
    created_at: string;
    can_edit: boolean;
    can_post: boolean;
    details?: SalaryDetail[];
}

export interface SalaryDetail {
    id?: number;
    salary_batch_id?: number;
    user_id?: number | null;
    nip?: string;
    nama_pegawai: string;
    nomor_whatsapp?: string;
    // Pendapatan
    gaji_pokok: number;
    tunjangan_sia: number;
    tunjangan_transportasi: number;
    tunjangan_jabatan: number;
    uang_jaga_utama: number;
    uang_jaga_pratama: number;
    jasa_pelayanan_pratama: number;
    jasa_pelayanan_rawat_inap: number;
    jasa_pelayanan_rawat_jalan: number;
    jasa_pelayanan_rawat_jalan_bpjs: number;
    tugas_tambahan: number;
    total_pendapatan?: number;
    // Potongan
    pph_21: number;
    infaq: number;
    bpjs_kesehatan: number;
    bpjs_ketenagakerjaan: number;
    denda_absen: number;
    arisan_keluarga: number;
    denda_ngaji: number;
    kasbon: number;
    total_potongan?: number;
    // Bersih
    gaji_bersih?: number;
    salary_batch?: SalaryBatch;
}

export interface SalarySummary {
    total_draft: number;
    total_done: number;
    total_posted: number;
    total_employees_all: number;
    total_gaji_bersih_posted: number;
}

export interface PersonalSalarySummary {
    total_slips: number;
    total_gaji_bersih: number;
    latest_period?: string;
}

export interface JournalPreviewEntry {
    account_name: string;
    type: 'debit' | 'credit';
    amount: number;
}

export interface PostJournalDetail {
    daftar_akun_id: number;
    keterangan: string;
    jumlah_debit: number;
    jumlah_kredit: number;
}

export const salaryApi = {
    getBatches: (params?: { search?: string; status?: string; period_year?: string; period_month?: string }) =>
        api.get<{ success: boolean; data: SalaryBatch[]; summary: SalarySummary }>('/penggajian/batches', { params }),

    getBatch: (id: number | string) =>
        api.get<{ success: boolean; data: SalaryBatch }>(`/penggajian/batches/${id}`),

    createBatch: (payload: {
        period_month: number;
        period_year: number;
        description?: string;
        payment_account_id: number;
    }) => api.post<{ success: boolean; message: string; data: SalaryBatch }>('/penggajian/batches', payload),

    updateBatch: (id: number | string, payload: { description: string }) =>
        api.put<{ success: boolean; message: string }>(`/penggajian/batches/${id}`, payload),

    deleteBatch: (id: number | string) =>
        api.delete<{ success: boolean; message: string }>(`/penggajian/batches/${id}`),

    getUsersWithNIP: () =>
        api.get<{ success: boolean; data: { id: number; name: string; nip: string }[] }>('/penggajian/users'),

    saveSalaryDetails: (batchId: number | string, details: SalaryDetail[]) =>
        api.post<{ success: boolean; message: string }>(`/penggajian/batches/${batchId}/gaji`, { details }),

    getJournalPreview: (batchIds: (number | string)[]) =>
        api.get<{ success: boolean; data: JournalPreviewEntry[] }>('/penggajian/journal-preview', {
            params: { batch_ids: batchIds.join(',') },
        }),

    postToJournal: (payload: { batch_ids: number[]; detail_jurnal: PostJournalDetail[] }) =>
        api.post<{ success: boolean; message: string; data: any }>('/penggajian/post-to-journal', payload),

    getMySalarySlips: (params?: { period_year?: string; period_month?: string }) =>
        api.get<{ success: boolean; data: SalaryDetail[]; summary: PersonalSalarySummary }>('/penggajian/my-salary', { params }),

    getSalarySlip: (id: number | string) =>
        api.get<{ success: boolean; data: SalaryDetail }>(`/penggajian/slips/${id}`),

    downloadExcelTemplate: (batchId: number | string, details?: SalaryDetail[]) => {
        if (details && details.length > 0) {
            return api.post(`/penggajian/batches/${batchId}/excel-template`, { details }, { responseType: 'blob' });
        }
        return api.get(`/penggajian/batches/${batchId}/excel-template`, { responseType: 'blob' });
    },

    getSlipPdfUrl: (id: number | string, inline = false) =>
        `/api/v1/penggajian/slips/${id}/pdf${inline ? '?inline=true' : ''}`,

    getSlipPrintUrl: (id: number | string, autoPrint = true) =>
        `/api/v1/penggajian/slips/${id}/print${autoPrint ? '?auto_print=true' : ''}`,
};

