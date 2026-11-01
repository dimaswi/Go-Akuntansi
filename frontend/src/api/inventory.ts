import api from './client';

export interface ItemCategory {
    id: number;
    code: string;
    name: string;
    description?: string;
    parent_id?: number | null;
    category_type?: string;
    is_active: boolean;
}

export interface Supplier {
    id: number;
    code?: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
}

export interface Item {
    id: number;
    code: string;
    name: string;
    category_id?: number | null;
    supplier_id?: number | null;
    department_id?: number | null;
    description?: string;
    inventory_type?: string;
    unit_of_measure: string;
    pack_size?: number;
    reorder_level: string | number;
    max_level: string | number;
    safety_stock: string | number;
    standard_cost: string | number;
    last_purchase_cost: string | number;
    is_active: boolean;
    total_stock?: string | number;
    stock_value?: string | number;
    category?: ItemCategory;
    supplier?: Supplier;
}

export interface ItemStock {
    id: number;
    item_id: number;
    department_id?: number | null;
    quantity_on_hand: string | number;
    reserved_quantity: string | number;
    available_quantity: string | number;
    last_unit_cost: string | number;
    average_unit_cost: string | number;
    total_value: string | number;
    last_updated_at?: string;
    item?: Item;
    department?: { id: number; name: string; code?: string };
}

export interface PurchaseItem {
    id?: number;
    purchase_id?: number;
    item_id: number;
    quantity_ordered: number | string;
    quantity_received?: number | string;
    unit_price: number | string;
    total_price: number | string;
    batch_number?: string;
    expiry_date?: string | null;
    notes?: string;
    item_status?: string;
    item?: Item;
}

export interface Purchase {
    id: number;
    purchase_number: string;
    supplier_id: number;
    purchase_date: string;
    expected_delivery_date?: string | null;
    actual_delivery_date?: string | null;
    status: 'draft' | 'ordered' | 'received' | 'completed' | 'cancelled';
    subtotal: string | number;
    tax_amount: string | number;
    discount_amount: string | number;
    shipping_cost: string | number;
    total_amount: string | number;
    notes?: string;
    payment_terms?: string;
    ap_account_id?: number | null;
    ap_amount: string | number;
    ap_paid_amount: string | number;
    ap_outstanding: string | number;
    jurnal_posted: boolean;
    jurnal_id?: number | null;
    supplier?: Supplier;
    items?: PurchaseItem[];
}

export interface StockAdjustment {
    id: number;
    nomor_adjustment: string;
    tanggal_adjustment: string;
    tipe_adjustment: 'increase' | 'decrease';
    item_id: number;
    department_id?: number | null;
    quantity: string | number;
    unit_price: string | number;
    total_amount: string | number;
    keterangan?: string;
    status: 'draft' | 'approved' | 'rejected';
    jurnal_posted: boolean;
    item?: Item;
}

export interface StockTransfer {
    id: number;
    nomor_transfer: string;
    tanggal_transfer: string;
    item_id: number;
    from_department_id?: number | null;
    to_department_id: number;
    quantity: string | number;
    keterangan?: string;
    status: 'pending' | 'approved' | 'received' | 'cancelled';
    item?: Item;
    from_department?: { id: number; name: string };
    to_department?: { id: number; name: string };
}

export interface StockOpname {
    id: number;
    opname_number: string;
    department_id?: number | null;
    opname_date: string;
    status: 'draft' | 'in_progress' | 'completed' | 'rejected';
    notes?: string;
    total_items_counted: number;
    total_variance_value: string | number;
    department?: { id: number; name: string };
    items?: Array<{
        id: number;
        item_id: number;
        system_stock: string | number;
        physical_stock: string | number;
        difference: string | number;
        unit_cost: string | number;
        variance_value: string | number;
        notes?: string;
        item?: Item;
    }>;
}

export interface InventoryDashboardStats {
    total_sku: number;
    total_categories: number;
    total_suppliers: number;
    low_stock_count: number;
    total_inventory_value: string | number;
    total_po_bulan_ini: number;
    nominal_po_bulan_ini: string | number;
    total_ap_outstanding: string | number;
    critical_items: Item[];
    recent_purchases: Purchase[];
}

export const inventoryApi = {
    // Dashboard Stats
    getDashboardStats: () => api.get<{ success: boolean; data: InventoryDashboardStats }>('/inventory/dashboard/stats'),

    // Items
    getItems: (params?: { page?: number; per_page?: number; search?: string; category_id?: number; low_stock?: boolean }) =>
        api.get('/inventory/items', { params }),
    getItem: (id: number | string) => api.get(`/inventory/items/${id}`),
    createItem: (data: Partial<Item>) => api.post('/inventory/items', data),
    updateItem: (id: number | string, data: Partial<Item>) => api.put(`/inventory/items/${id}`, data),
    deleteItem: (id: number | string) => api.delete(`/inventory/items/${id}`),

    // Categories
    getCategories: () => api.get<{ success: boolean; data: ItemCategory[] }>('/inventory/categories'),
    createCategory: (data: Partial<ItemCategory>) => api.post('/inventory/categories', data),
    updateCategory: (id: number | string, data: Partial<ItemCategory>) => api.put(`/inventory/categories/${id}`, data),
    deleteCategory: (id: number | string) => api.delete(`/inventory/categories/${id}`),

    // Suppliers
    getSuppliers: (params?: { search?: string }) => api.get<{ success: boolean; data: Supplier[] }>('/inventory/suppliers', { params }),
    getSupplier: (id: number | string) => api.get(`/inventory/suppliers/${id}`),
    createSupplier: (data: Partial<Supplier>) => api.post('/inventory/suppliers', data),
    updateSupplier: (id: number | string, data: Partial<Supplier>) => api.put(`/inventory/suppliers/${id}`, data),
    deleteSupplier: (id: number | string) => api.delete(`/inventory/suppliers/${id}`),

    // Purchases
    getPurchases: (params?: { page?: number; per_page?: number; search?: string; status?: string; from_date?: string; to_date?: string }) =>
        api.get('/inventory/purchases', { params }),
    getPurchase: (id: number | string) => api.get(`/inventory/purchases/${id}`),
    createPurchase: (data: any) => api.post('/inventory/purchases', data),
    updatePurchase: (id: number | string, data: any) => api.put(`/inventory/purchases/${id}`, data),
    approvePurchase: (id: number | string) => api.post(`/inventory/purchases/${id}/approve`),
    receivePurchase: (id: number | string, data: { items: any[] }) => api.post(`/inventory/purchases/${id}/receive`, data),
    postPurchaseToJournal: (id: number | string, data: { debit_account_id: number; credit_account_id: number }) =>
        api.post(`/inventory/purchases/${id}/post-to-journal`, data),

    // Payments
    getPayments: (params?: { purchase_id?: number }) => api.get('/inventory/purchase-payments', { params }),
    getPayment: (id: number | string) => api.get(`/inventory/purchase-payments/${id}`),
    createPayment: (data: any) => api.post('/inventory/purchase-payments', data),

    // Stocks
    getStockSummary: (params?: { department_id?: number }) => api.get('/inventory/stocks/summary', { params }),

    // Adjustments
    getStockAdjustments: (params?: { page?: number; per_page?: number; search?: string }) =>
        api.get('/inventory/stock-adjustments', { params }),
    getStockAdjustment: (id: number | string) => api.get(`/inventory/stock-adjustments/${id}`),
    createStockAdjustment: (data: any) => api.post('/inventory/stock-adjustments', data),
    approveStockAdjustment: (id: number | string, data?: { debit_account_id?: number; credit_account_id?: number }) =>
        api.post(`/inventory/stock-adjustments/${id}/approve`, data),

    // Transfers
    getStockTransfers: (params?: { page?: number; per_page?: number; search?: string }) =>
        api.get('/inventory/stock-transfers', { params }),
    getStockTransfer: (id: number | string) => api.get(`/inventory/stock-transfers/${id}`),
    createStockTransfer: (data: any) => api.post('/inventory/stock-transfers', data),
    receiveStockTransfer: (id: number | string) => api.post(`/inventory/stock-transfers/${id}/receive`),

    // Opname
    getStockOpnames: (params?: { page?: number; per_page?: number; search?: string }) =>
        api.get('/inventory/stock-opnames', { params }),
    getStockOpname: (id: number | string) => api.get(`/inventory/stock-opnames/${id}`),
    createStockOpname: (data: any) => api.post('/inventory/stock-opnames', data),
    completeStockOpname: (id: number | string, data: { counts: any[] }) => api.post(`/inventory/stock-opnames/${id}/complete`, data),

    // Stock Requests
    getStockRequests: (params?: { page?: number; per_page?: number; search?: string }) =>
        api.get('/inventory/stock-requests', { params }),
    getStockRequest: (id: number | string) => api.get(`/inventory/stock-requests/${id}`),
    createStockRequest: (data: any) => api.post('/inventory/stock-requests', data),
    approveStockRequest: (id: number | string) => api.post(`/inventory/stock-requests/${id}/approve`),
    completeStockRequest: (id: number | string) => api.post(`/inventory/stock-requests/${id}/complete`),

    // Departments
    getDepartments: () => api.get('/departments'),
    getDepartment: (id: number | string) => api.get(`/departments/${id}`),
    createDepartment: (data: any) => api.post('/departments', data),
    updateDepartment: (id: number | string, data: any) => api.put(`/departments/${id}`, data),
    deleteDepartment: (id: number | string) => api.delete(`/departments/${id}`),
};

