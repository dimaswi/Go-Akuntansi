import api from './client';

export interface AssetCategory {
    id: number;
    code: string;
    name: string;
    description?: string;
    default_useful_life_years?: number;
    default_depreciation_method?: string;
    default_salvage_percentage?: number;
    useful_life_months?: number;
    depreciation_method?: string;
    depreciation_rate?: string | number;
    account_asset_id?: number | null;
    account_depreciation_id?: number | null;
    account_expense_id?: number | null;
    is_active: boolean;
    assets_count?: number;
    account_asset?: { id: number; kode_akun: string; nama_akun: string };
    account_depreciation?: { id: number; kode_akun: string; nama_akun: string };
    account_expense?: { id: number; kode_akun: string; nama_akun: string };
}

export interface Asset {
    id: number;
    code: string;
    name: string;
    category_id: number;
    barcode?: string;
    serial_number?: string;
    brand?: string;
    model?: string;
    purchase_date: string;
    purchase_cost: number;
    residual_value: number;
    useful_life_months: number;
    depreciation_method: string;
    depreciation_rate?: number;
    accumulated_depreciation: number;
    book_value: number;
    last_depreciation_date?: string | null;
    status: 'ACTIVE' | 'MAINTENANCE' | 'DISPOSED' | 'TRANSFERRED' | 'WRITTEN_OFF';
    condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
    department_id?: number | null;
    location?: string;
    assigned_to?: string;
    vendor_supplier?: string;
    invoice_number?: string;
    notes?: string;
    category?: AssetCategory;
    department?: { id: number; code?: string; name: string };
    depreciations?: AssetDepreciation[];
    maintenances?: AssetMaintenance[];
    transfers?: AssetTransfer[];
}

export interface AssetDepreciation {
    id: number;
    asset_id: number;
    period_date: string;
    depreciation_amount: number;
    accumulated_depreciation: number;
    book_value: number;
    journal_id?: number | null;
    created_by?: number | null;
    notes?: string;
    asset?: Asset;
    journal?: any;
}

export interface AssetMaintenance {
    id: number;
    asset_id: number;
    maintenance_date: string;
    type?: string;
    service_type?: string;
    description: string;
    cost: number;
    vendor?: string;
    vendor_name?: string;
    technician?: string;
    performed_by?: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    next_maintenance_date?: string | null;
    notes?: string;
    asset?: Asset;
}

export interface AssetDisposal {
    id: number;
    asset_id: number;
    disposal_number?: string;
    disposal_date: string;
    disposal_type: string;
    sale_price?: number;
    sale_proceeds?: number;
    book_value?: number;
    book_value_at_disposal?: number;
    gain_loss?: number;
    reason: string;
    recipient?: string;
    disposal_to?: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    approved_by?: number | null;
    journal_id?: number | null;
    notes?: string;
    asset?: Asset;
}

export interface AssetTransfer {
    id: number;
    asset_id: number;
    transfer_number?: string;
    transfer_date: string;
    from_department_id?: number | null;
    to_department_id: number;
    from_location?: string;
    to_location: string;
    reason?: string;
    received_by?: string;
    notes?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approved_by?: number | null;
    asset?: Asset;
    from_department?: { id: number; name: string };
    to_department?: { id: number; name: string };
}

export interface AssetBudgetItem {
    id?: number;
    budget_id?: number;
    category_id?: number | null;
    name?: string;
    item_name?: string;
    specification?: string;
    quantity: number;
    estimated_cost: number;
    total_cost: number;
    realized_amount?: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'DRAFT' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    category?: AssetCategory;
}

export interface AssetBudget {
    id: number;
    budget_code: string;
    name?: string;
    budget_name?: string;
    fiscal_year: number;
    department_id?: number | null;
    total_budget?: number;
    total_amount?: number;
    realized_budget?: number;
    realized_amount?: number;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    notes?: string;
    department?: { id: number; name: string };
    items?: AssetBudgetItem[];
}

export interface AssetDashboardStats {
    total_assets: number;
    total_asset_value: number;
    total_book_value: number;
    total_accumulated_depreciation: number;
    active_assets: number;
    maintenance_assets: number;
    disposed_assets: number;
    categories_count: number;
}

export const assetApi = {
    // Dashboard Stats
    getDashboardStats: () => api.get<{ success: boolean; data: AssetDashboardStats }>('/aset/stats'),

    // Categories
    getCategories: (params?: { search?: string }) =>
        api.get<{ success: boolean; data: AssetCategory[] }>('/aset/categories', { params }),
    getCategory: (id: number | string) =>
        api.get<{ success: boolean; data: AssetCategory }>(`/aset/categories/${id}`),
    createCategory: (data: Partial<AssetCategory>) =>
        api.post<{ success: boolean; data: AssetCategory }>('/aset/categories', data),
    updateCategory: (id: number | string, data: Partial<AssetCategory>) =>
        api.put<{ success: boolean; data: AssetCategory }>(`/aset/categories/${id}`, data),
    deleteCategory: (id: number | string) =>
        api.delete<{ success: boolean; message: string }>(`/aset/categories/${id}`),

    // Assets
    getAssets: (params?: { page?: number; per_page?: number; search?: string; category_id?: number; department_id?: number; status?: string }) =>
        api.get<{ success: boolean; data: Asset[]; total: number; page: number; per_page: number }>('/aset/assets', { params }),
    getAsset: (id: number | string) =>
        api.get<{ success: boolean; data: Asset }>(`/aset/assets/${id}`),
    createAsset: (data: Partial<Asset>) =>
        api.post<{ success: boolean; data: Asset }>('/aset/assets', data),
    updateAsset: (id: number | string, data: Partial<Asset>) =>
        api.put<{ success: boolean; data: Asset }>(`/aset/assets/${id}`, data),
    deleteAsset: (id: number | string) =>
        api.delete<{ success: boolean; message: string }>(`/aset/assets/${id}`),

    // Depreciations
    getDepreciations: (params?: { asset_id?: number; period_date?: string }) =>
        api.get<{ success: boolean; data: AssetDepreciation[] }>('/aset/depreciations', { params }),
    runDepreciation: (data: { period_date: string }) =>
        api.post<{ success: boolean; message: string; processed: number }>('/aset/depreciations/run', data),

    // Maintenances
    getMaintenances: (params?: { asset_id?: number; status?: string }) =>
        api.get<{ success: boolean; data: AssetMaintenance[] }>('/aset/maintenances', { params }),
    getMaintenance: (id: number | string) =>
        api.get<{ success: boolean; data: AssetMaintenance }>(`/aset/maintenances/${id}`),
    createMaintenance: (data: Partial<AssetMaintenance>) =>
        api.post<{ success: boolean; data: AssetMaintenance }>('/aset/maintenances', data),
    updateMaintenance: (id: number | string, data: Partial<AssetMaintenance>) =>
        api.put<{ success: boolean; data: AssetMaintenance }>(`/aset/maintenances/${id}`, data),

    // Disposals
    getDisposals: (params?: { status?: string }) =>
        api.get<{ success: boolean; data: AssetDisposal[] }>('/aset/disposals', { params }),
    getDisposal: (id: number | string) =>
        api.get<{ success: boolean; data: AssetDisposal }>(`/aset/disposals/${id}`),
    createDisposal: (data: Partial<AssetDisposal>) =>
        api.post<{ success: boolean; data: AssetDisposal }>('/aset/disposals', data),
    updateDisposal: (id: number | string, data: Partial<AssetDisposal>) =>
        api.put<{ success: boolean; data: AssetDisposal }>(`/aset/disposals/${id}`, data),
    approveDisposal: (id: number | string) =>
        api.post<{ success: boolean; message: string }>(`/aset/disposals/${id}/approve`),

    // Transfers
    getTransfers: (params?: { asset_id?: number; status?: string }) =>
        api.get<{ success: boolean; data: AssetTransfer[] }>('/aset/transfers', { params }),
    getTransfer: (id: number | string) =>
        api.get<{ success: boolean; data: AssetTransfer }>(`/aset/transfers/${id}`),
    createTransfer: (data: Partial<AssetTransfer>) =>
        api.post<{ success: boolean; data: AssetTransfer }>('/aset/transfers', data),
    updateTransfer: (id: number | string, data: Partial<AssetTransfer>) =>
        api.put<{ success: boolean; data: AssetTransfer }>(`/aset/transfers/${id}`, data),
    approveTransfer: (id: number | string) =>
        api.post<{ success: boolean; message: string }>(`/aset/transfers/${id}/approve`),

    // Budgets (RAB)
    getBudgets: (params?: { fiscal_year?: number; status?: string }) =>
        api.get<{ success: boolean; data: AssetBudget[] }>('/aset/budgets', { params }),
    getBudget: (id: number | string) =>
        api.get<{ success: boolean; data: AssetBudget }>(`/aset/budgets/${id}`),
    createBudget: (data: Partial<AssetBudget>) =>
        api.post<{ success: boolean; data: AssetBudget }>('/aset/budgets', data),
};

