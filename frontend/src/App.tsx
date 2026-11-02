import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/auth-context';

// Auth Pages
import LoginPage from '@/pages/auth/login';

// User Management Pages (Index, Create, Edit, Show)
import UsersIndex from '@/pages/users/index';
import UserCreate from '@/pages/users/create';
import UserEdit from '@/pages/users/edit';
import UserShow from '@/pages/users/show';

// Role Management Pages (Index, Create, Edit, Show)
import RolesIndex from '@/pages/roles/index';
import RoleCreate from '@/pages/roles/create';
import RoleEdit from '@/pages/roles/edit';
import RoleShow from '@/pages/roles/show';

// Permission Management Pages (Index, Create, Edit, Show)
import PermissionsIndex from '@/pages/permissions/index';
import PermissionCreate from '@/pages/permissions/create';
import PermissionEdit from '@/pages/permissions/edit';
import PermissionShow from '@/pages/permissions/show';

// Account Management Page
import AccountPage from '@/pages/account/index';

// Modul Akuntansi Pages
import AkuntansiIndex from '@/pages/akuntansi/index';
import DaftarAkunIndex from '@/pages/akuntansi/daftar-akun/index';
import DaftarAkunCreate from '@/pages/akuntansi/daftar-akun/create';
import DaftarAkunEdit from '@/pages/akuntansi/daftar-akun/edit';
import DaftarAkunShow from '@/pages/akuntansi/daftar-akun/show';
import JurnalIndex from '@/pages/akuntansi/jurnal/index';
import JurnalCreate from '@/pages/akuntansi/jurnal/create';
import JurnalEdit from '@/pages/akuntansi/jurnal/edit';
import JurnalShow from '@/pages/akuntansi/jurnal/show';
import JurnalPenyesuaianIndex from '@/pages/akuntansi/jurnal-penyesuaian/index';
import JurnalPenyesuaianCreate from '@/pages/akuntansi/jurnal-penyesuaian/create';
import JurnalPenyesuaianEdit from '@/pages/akuntansi/jurnal-penyesuaian/edit';
import JurnalPenyesuaianShow from '@/pages/akuntansi/jurnal-penyesuaian/show';
import BukuBesarIndex from '@/pages/akuntansi/buku-besar/index';
import BukuBesarShow from '@/pages/akuntansi/buku-besar/show';
import LaporanKeuanganIndex from '@/pages/akuntansi/laporan-keuangan/index';
import LaporanNeraca from '@/pages/akuntansi/laporan-keuangan/neraca';
import LaporanLabaRugi from '@/pages/akuntansi/laporan-keuangan/laba-rugi';
import LaporanArusKas from '@/pages/akuntansi/laporan-keuangan/arus-kas';
import LaporanPerubahanModal from '@/pages/akuntansi/laporan-keuangan/perubahan-modal';
import LaporanAnalisisRasio from '@/pages/akuntansi/laporan-keuangan/analisis-rasio';
import DampakPenyesuaianPage from '@/pages/akuntansi/laporan-keuangan/dampak-penyesuaian';

// Modul Kas & Bank Pages
import CashTransactionIndex from '@/pages/kas/cash-transactions/index';
import CashTransactionCreate from '@/pages/kas/cash-transactions/create';
import CashTransactionEdit from '@/pages/kas/cash-transactions/edit';
import CashTransactionShow from '@/pages/kas/cash-transactions/show';
import CashTransactionPostToJournal from '@/pages/kas/cash-transactions/post-to-journal';

import BankAccountIndex from '@/pages/kas/bank-accounts/index';
import BankAccountCreate from '@/pages/kas/bank-accounts/create';
import BankAccountEdit from '@/pages/kas/bank-accounts/edit';
import BankAccountShow from '@/pages/kas/bank-accounts/show';

import BankTransactionIndex from '@/pages/kas/bank-transactions/index';
import BankTransactionCreate from '@/pages/kas/bank-transactions/create';
import BankTransactionEdit from '@/pages/kas/bank-transactions/edit';
import BankTransactionShow from '@/pages/kas/bank-transactions/show';
import BankTransactionPostToJournal from '@/pages/kas/bank-transactions/post-to-journal';

import GiroTransactionIndex from '@/pages/kas/giro-transactions/index';
import GiroTransactionCreate from '@/pages/kas/giro-transactions/create';
import GiroTransactionEdit from '@/pages/kas/giro-transactions/edit';
import GiroTransactionShow from '@/pages/kas/giro-transactions/show';
import GiroTransactionPostToJournal from '@/pages/kas/giro-transactions/post-to-journal';

import GiroReport from '@/pages/kas/reports/giro-report';

// Modul Persediaan & Logistik (Inventory) Pages
import InventoryDashboard from '@/pages/inventory/dashboard';
import InventoryItemsIndex from '@/pages/inventory/items/index';
import InventoryItemCreate from '@/pages/inventory/items/create';
import InventoryItemEdit from '@/pages/inventory/items/edit';
import InventoryItemShow from '@/pages/inventory/items/show';

import InventoryCategoriesIndex from '@/pages/inventory/categories/index';
import CategoryCreate from '@/pages/inventory/categories/create';
import CategoryEdit from '@/pages/inventory/categories/edit';
import CategoryShow from '@/pages/inventory/categories/show';

import InventorySuppliersIndex from '@/pages/inventory/suppliers/index';
import SupplierCreate from '@/pages/inventory/suppliers/create';
import SupplierEdit from '@/pages/inventory/suppliers/edit';
import SupplierShow from '@/pages/inventory/suppliers/show';

import InventoryPurchasesIndex from '@/pages/inventory/purchases/index';
import InventoryPurchaseCreate from '@/pages/inventory/purchases/create';
import InventoryPurchaseShow from '@/pages/inventory/purchases/show';
import PurchaseEdit from '@/pages/inventory/purchases/edit';

import PurchasePaymentsIndex from '@/pages/inventory/purchase-payments/index';
import PurchasePaymentCreate from '@/pages/inventory/purchase-payments/create';
import PurchasePaymentShow from '@/pages/inventory/purchase-payments/show';

import StockAdjustmentsIndex from '@/pages/inventory/stock-adjustments/index';
import StockAdjustmentCreate from '@/pages/inventory/stock-adjustments/create';
import StockAdjustmentShow from '@/pages/inventory/stock-adjustments/show';

import StockTransfersIndex from '@/pages/inventory/stock-transfers/index';
import StockTransferCreate from '@/pages/inventory/stock-transfers/create';
import StockTransferShow from '@/pages/inventory/stock-transfers/show';

import StockRequestsIndex from '@/pages/inventory/stock-requests/index';
import StockRequestCreate from '@/pages/inventory/stock-requests/create';
import StockRequestShow from '@/pages/inventory/stock-requests/show';

import CentralWarehouseIndex from '@/pages/inventory/central-warehouse/index';

import DepartmentStocksIndex from '@/pages/inventory/department-stocks/index';
import DepartmentStockShow from '@/pages/inventory/department-stocks/show';

import InventoryDepartmentsIndex from '@/pages/inventory/departments/index';
import DepartmentCreate from '@/pages/inventory/departments/create';
import DepartmentEdit from '@/pages/inventory/departments/edit';
import DepartmentShow from '@/pages/inventory/departments/show';
import DepartmentUsers from '@/pages/inventory/departments/users';

import StockOpnamesIndex from '@/pages/inventory/stock-opnames/index';
import StockOpnameCreate from '@/pages/inventory/stock-opnames/create';
import StockOpnameShow from '@/pages/inventory/stock-opnames/show';

import InventoryReportsIndex from '@/pages/inventory/reports/index';
import OpnameComplianceIndex from '@/pages/inventory/opname-compliance/index';

// Modul Aset (Fixed Assets) Pages
import AssetCategoriesIndex from '@/pages/aset/categories/index';
import AssetCategoryCreate from '@/pages/aset/categories/create';
import AssetCategoryEdit from '@/pages/aset/categories/edit';
import AssetCategoryShow from '@/pages/aset/categories/show';
import AssetsIndex from '@/pages/aset/assets/index';
import AssetCreate from '@/pages/aset/assets/create';
import AssetEdit from '@/pages/aset/assets/edit';
import AssetShow from '@/pages/aset/assets/show';
import AssetDepreciationsIndex from '@/pages/aset/depreciations/index';
import AssetMaintenancesIndex from '@/pages/aset/maintenances/index';
import AssetMaintenanceCreate from '@/pages/aset/maintenances/create';
import AssetMaintenanceEdit from '@/pages/aset/maintenances/edit';
import AssetMaintenanceShow from '@/pages/aset/maintenances/show';

import AssetDisposalsIndex from '@/pages/aset/disposals/index';
import AssetDisposalCreate from '@/pages/aset/disposals/create';
import AssetDisposalEdit from '@/pages/aset/disposals/edit';
import AssetDisposalShow from '@/pages/aset/disposals/show';

import AssetTransfersIndex from '@/pages/aset/transfers/index';
import AssetTransferCreate from '@/pages/aset/transfers/create';
import AssetTransferEdit from '@/pages/aset/transfers/edit';
import AssetTransferShow from '@/pages/aset/transfers/show';

import AssetBudgetsIndex from '@/pages/aset/budgets/index';
import AssetBudgetCreate from '@/pages/aset/budgets/create';
import AssetBudgetShow from '@/pages/aset/budgets/show';

import AssetRegisterReport from '@/pages/aset/reports/register';
import AssetDepreciationReport from '@/pages/aset/reports/depreciation';

// Modul Penggajian (Payroll) Pages
import { SalaryBatchesIndex } from '@/pages/penggajian/index';
import { SalaryBatchCreate } from '@/pages/penggajian/create';
import { SalaryInputGaji } from '@/pages/penggajian/input-gaji';
import { SalaryPostToJournal } from '@/pages/penggajian/post-to-journal';
import { MySalaryPage } from '@/pages/penggajian/my-salary';
import { SalarySlipPage } from '@/pages/penggajian/slip';
import ProtectedRoute from '@/components/protected-route';

export const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" richColors />
                <Routes>
                    {/* Login Public */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected ERP Routes */}
                    <Route element={<ProtectedRoute />}>
                        {/* Dashboard Modul Akuntansi */}
                        <Route path="/" element={<AkuntansiIndex />} />
                        <Route path="/akuntansi" element={<AkuntansiIndex />} />

                    {/* Daftar Akun (Index, Create, Edit, Show) */}
                    <Route path="/akuntansi/daftar-akun" element={<DaftarAkunIndex />} />
                    <Route path="/akuntansi/daftar-akun/create" element={<DaftarAkunCreate />} />
                    <Route path="/akuntansi/daftar-akun/:id" element={<DaftarAkunShow />} />
                    <Route path="/akuntansi/daftar-akun/:id/edit" element={<DaftarAkunEdit />} />

                    {/* Jurnal (Index, Create, Edit, Show) */}
                    <Route path="/akuntansi/jurnal" element={<JurnalIndex />} />
                    <Route path="/akuntansi/jurnal/create" element={<JurnalCreate />} />
                    <Route path="/akuntansi/jurnal/:id" element={<JurnalShow />} />
                    <Route path="/akuntansi/jurnal/:id/edit" element={<JurnalEdit />} />

                    {/* Jurnal Penyesuaian (Index, Create, Edit, Show) */}
                    <Route path="/akuntansi/jurnal-penyesuaian" element={<JurnalPenyesuaianIndex />} />
                    <Route path="/akuntansi/jurnal-penyesuaian/create" element={<JurnalPenyesuaianCreate />} />
                    <Route path="/akuntansi/jurnal-penyesuaian/:id" element={<JurnalPenyesuaianShow />} />
                    <Route path="/akuntansi/jurnal-penyesuaian/:id/edit" element={<JurnalPenyesuaianEdit />} />

                    {/* Buku Besar (Index, Show) */}
                    <Route path="/akuntansi/buku-besar" element={<BukuBesarIndex />} />
                    <Route path="/akuntansi/buku-besar/:id" element={<BukuBesarShow />} />

                    {/* Laporan Keuangan (Index, Neraca, Laba-Rugi, Arus Kas, Perubahan Modal, Dampak Penyesuaian) */}
                    <Route path="/akuntansi/laporan-keuangan" element={<LaporanKeuanganIndex />} />
                    <Route path="/akuntansi/laporan" element={<Navigate to="/akuntansi/laporan-keuangan" replace />} />
                    <Route path="/akuntansi/laporan-keuangan/neraca" element={<LaporanNeraca />} />
                    <Route path="/akuntansi/laporan-keuangan/laba-rugi" element={<LaporanLabaRugi />} />
                    <Route path="/akuntansi/laporan-keuangan/arus-kas" element={<LaporanArusKas />} />
                    <Route path="/akuntansi/laporan-keuangan/perubahan-modal" element={<LaporanPerubahanModal />} />
                    <Route path="/akuntansi/laporan-keuangan/analisis-rasio" element={<LaporanAnalisisRasio />} />
                    <Route path="/akuntansi/laporan-keuangan/dampak-penyesuaian" element={<DampakPenyesuaianPage />} />

                    {/* Modul Kas & Bank */}
                    <Route path="/kas" element={<Navigate to="/kas/cash-transactions" replace />} />
                    
                    {/* Transaksi Kas */}
                    <Route path="/kas/cash-transactions" element={<CashTransactionIndex />} />
                    <Route path="/kas/cash-transactions/create" element={<CashTransactionCreate />} />
                    <Route path="/kas/cash-transactions/:id" element={<CashTransactionShow />} />
                    <Route path="/kas/cash-transactions/:id/edit" element={<CashTransactionEdit />} />
                    <Route path="/kas/cash-transactions/:id/post-to-journal" element={<CashTransactionPostToJournal />} />

                    {/* Bank Account */}
                    <Route path="/kas/bank-accounts" element={<BankAccountIndex />} />
                    <Route path="/kas/bank-accounts/create" element={<BankAccountCreate />} />
                    <Route path="/kas/bank-accounts/:id" element={<BankAccountShow />} />
                    <Route path="/kas/bank-accounts/:id/edit" element={<BankAccountEdit />} />

                    {/* Transaksi Bank */}
                    <Route path="/kas/bank-transactions" element={<BankTransactionIndex />} />
                    <Route path="/kas/bank-transactions/create" element={<BankTransactionCreate />} />
                    <Route path="/kas/bank-transactions/:id" element={<BankTransactionShow />} />
                    <Route path="/kas/bank-transactions/:id/edit" element={<BankTransactionEdit />} />
                    <Route path="/kas/bank-transactions/:id/post-to-journal" element={<BankTransactionPostToJournal />} />

                    {/* Transaksi Giro */}
                    <Route path="/kas/giro-transactions" element={<GiroTransactionIndex />} />
                    <Route path="/kas/giro-transactions/create" element={<GiroTransactionCreate />} />
                    <Route path="/kas/giro-transactions/:id" element={<GiroTransactionShow />} />
                    <Route path="/kas/giro-transactions/:id/edit" element={<GiroTransactionEdit />} />
                    <Route path="/kas/giro-transactions/:id/post-to-journal" element={<GiroTransactionPostToJournal />} />

                    {/* Laporan Kas & Bank */}
                    <Route path="/kas/reports/giro" element={<GiroReport />} />
                    <Route path="/kas/reports/cash-flow" element={<Navigate to="/akuntansi/laporan-keuangan/arus-kas" replace />} />

                    {/* Modul Persediaan (Inventory) */}
                    <Route path="/inventory" element={<Navigate to="/inventory/dashboard" replace />} />
                    <Route path="/inventory/dashboard" element={<InventoryDashboard />} />

                    {/* Master Barang */}
                    <Route path="/inventory/items" element={<InventoryItemsIndex />} />
                    <Route path="/inventory/items/create" element={<InventoryItemCreate />} />
                    <Route path="/inventory/items/:id" element={<InventoryItemShow />} />
                    <Route path="/inventory/items/:id/edit" element={<InventoryItemEdit />} />

                    {/* Master Kategori & Pemasok */}
                    <Route path="/inventory/categories" element={<InventoryCategoriesIndex />} />
                    <Route path="/inventory/categories/create" element={<CategoryCreate />} />
                    <Route path="/inventory/categories/:id" element={<CategoryShow />} />
                    <Route path="/inventory/categories/:id/edit" element={<CategoryEdit />} />

                    <Route path="/inventory/suppliers" element={<InventorySuppliersIndex />} />
                    <Route path="/inventory/suppliers/create" element={<SupplierCreate />} />
                    <Route path="/inventory/suppliers/:id" element={<SupplierShow />} />
                    <Route path="/inventory/suppliers/:id/edit" element={<SupplierEdit />} />

                    {/* Pengadaan / Pembelian PO & Pembayaran */}
                    <Route path="/inventory/purchases" element={<InventoryPurchasesIndex />} />
                    <Route path="/inventory/purchases/create" element={<InventoryPurchaseCreate />} />
                    <Route path="/inventory/purchases/:id" element={<InventoryPurchaseShow />} />
                    <Route path="/inventory/purchases/:id/edit" element={<PurchaseEdit />} />

                    <Route path="/inventory/purchase-payments" element={<PurchasePaymentsIndex />} />
                    <Route path="/inventory/purchase-payments/create" element={<PurchasePaymentCreate />} />
                    <Route path="/inventory/purchase-payments/:id" element={<PurchasePaymentShow />} />

                    {/* Mutasi, Penyesuaian, Opname, Laporan */}
                    <Route path="/inventory/stock-adjustments" element={<StockAdjustmentsIndex />} />
                    <Route path="/inventory/stock-adjustments/create" element={<StockAdjustmentCreate />} />
                    <Route path="/inventory/stock-adjustments/:id" element={<StockAdjustmentShow />} />

                    <Route path="/inventory/stock-transfers" element={<StockTransfersIndex />} />
                    <Route path="/inventory/stock-transfers/create" element={<StockTransferCreate />} />
                    <Route path="/inventory/stock-transfers/:id" element={<StockTransferShow />} />

                    <Route path="/inventory/stock-requests" element={<StockRequestsIndex />} />
                    <Route path="/inventory/stock-requests/create" element={<StockRequestCreate />} />
                    <Route path="/inventory/stock-requests/:id" element={<StockRequestShow />} />

                    <Route path="/inventory/central-warehouse" element={<CentralWarehouseIndex />} />

                    <Route path="/inventory/department-stocks" element={<DepartmentStocksIndex />} />
                    <Route path="/inventory/department-stocks/:id" element={<DepartmentStockShow />} />

                    <Route path="/inventory/departments" element={<InventoryDepartmentsIndex />} />
                    <Route path="/inventory/departments/create" element={<DepartmentCreate />} />
                    <Route path="/inventory/departments/:id" element={<DepartmentShow />} />
                    <Route path="/inventory/departments/:id/edit" element={<DepartmentEdit />} />
                    <Route path="/inventory/departments/:id/users" element={<DepartmentUsers />} />

                    <Route path="/inventory/stock-opnames" element={<StockOpnamesIndex />} />
                    <Route path="/inventory/stock-opnames/create" element={<StockOpnameCreate />} />
                    <Route path="/inventory/stock-opnames/:id" element={<StockOpnameShow />} />

                    <Route path="/inventory/reports" element={<InventoryReportsIndex />} />
                    <Route path="/inventory/opname-compliance" element={<OpnameComplianceIndex />} />

                    {/* Modul Aset (Fixed Assets) */}
                    <Route path="/aset" element={<Navigate to="/aset/categories" replace />} />
                    <Route path="/aset/dashboard" element={<Navigate to="/aset/categories" replace />} />
                    <Route path="/aset/categories" element={<AssetCategoriesIndex />} />
                    <Route path="/aset/categories/create" element={<AssetCategoryCreate />} />
                    <Route path="/aset/categories/:id" element={<AssetCategoryShow />} />
                    <Route path="/aset/categories/:id/edit" element={<AssetCategoryEdit />} />
                    <Route path="/aset/assets" element={<AssetsIndex />} />
                    <Route path="/aset/assets/create" element={<AssetCreate />} />
                    <Route path="/aset/assets/:id" element={<AssetShow />} />
                    <Route path="/aset/assets/:id/edit" element={<AssetEdit />} />
                    <Route path="/aset/depreciations" element={<AssetDepreciationsIndex />} />

                    <Route path="/aset/maintenances" element={<AssetMaintenancesIndex />} />
                    <Route path="/aset/maintenances/create" element={<AssetMaintenanceCreate />} />
                    <Route path="/aset/maintenances/:id" element={<AssetMaintenanceShow />} />
                    <Route path="/aset/maintenances/:id/edit" element={<AssetMaintenanceEdit />} />

                    <Route path="/aset/disposals" element={<AssetDisposalsIndex />} />
                    <Route path="/aset/disposals/create" element={<AssetDisposalCreate />} />
                    <Route path="/aset/disposals/:id" element={<AssetDisposalShow />} />
                    <Route path="/aset/disposals/:id/edit" element={<AssetDisposalEdit />} />

                    <Route path="/aset/transfers" element={<AssetTransfersIndex />} />
                    <Route path="/aset/transfers/create" element={<AssetTransferCreate />} />
                    <Route path="/aset/transfers/:id" element={<AssetTransferShow />} />
                    <Route path="/aset/transfers/:id/edit" element={<AssetTransferEdit />} />

                    <Route path="/aset/budgets" element={<AssetBudgetsIndex />} />
                    <Route path="/aset/budgets/create" element={<AssetBudgetCreate />} />
                    <Route path="/aset/budgets/:id" element={<AssetBudgetShow />} />
                    <Route path="/aset/reports/register" element={<AssetRegisterReport />} />
                    <Route path="/aset/reports/depreciation" element={<AssetDepreciationReport />} />

                    {/* Modul Penggajian (Payroll) */}
                    <Route path="/penggajian" element={<SalaryBatchesIndex />} />
                    <Route path="/penggajian/create" element={<SalaryBatchCreate />} />
                    <Route path="/penggajian/batches/:id/input-gaji" element={<SalaryInputGaji />} />
                    <Route path="/penggajian/batches/:id/post-to-journal" element={<SalaryPostToJournal />} />
                    <Route path="/penggajian/my-salary" element={<MySalaryPage />} />
                    <Route path="/penggajian/slips/:id" element={<SalarySlipPage />} />
                    <Route path="/penggajian/my-salary/:id" element={<SalarySlipPage />} />

                    {/* User Management (Index, Create, Edit, Show) */}
                    <Route path="/users" element={<UsersIndex />} />
                    <Route path="/users/create" element={<UserCreate />} />
                    <Route path="/users/:id" element={<UserShow />} />
                    <Route path="/users/:id/edit" element={<UserEdit />} />

                    {/* Role Management (Index, Create, Edit, Show) */}
                    <Route path="/roles" element={<RolesIndex />} />
                    <Route path="/roles/create" element={<RoleCreate />} />
                    <Route path="/roles/:id" element={<RoleShow />} />
                    <Route path="/roles/:id/edit" element={<RoleEdit />} />

                    {/* Permission Management (Index, Create, Edit, Show) */}
                    <Route path="/permissions" element={<PermissionsIndex />} />
                    <Route path="/permissions/create" element={<PermissionCreate />} />
                    <Route path="/permissions/:id" element={<PermissionShow />} />
                    <Route path="/permissions/:id/edit" element={<PermissionEdit />} />

                    {/* Account Settings */}
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/settings" element={<Navigate to="/account" replace />} />
                    <Route path="/settings/account" element={<Navigate to="/account" replace />} />

                    {/* Aliases for settings paths */}
                    <Route path="/settings/users" element={<Navigate to="/users" replace />} />
                    <Route path="/settings/roles" element={<Navigate to="/roles" replace />} />
                    <Route path="/settings/permissions" element={<Navigate to="/permissions" replace />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
