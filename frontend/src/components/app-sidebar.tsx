import React from 'react';
import { NavMain, NavItem } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import {
    ArrowRightLeft,
    Banknote,
    BarChart,
    Book,
    BookOpen,
    BookOpenCheck,
    Box,
    Boxes,
    Building2,
    Calculator,
    CheckCircle2,
    ChevronsUpDown,
    ClipboardList,
    CreditCard,
    DollarSign,
    FileBarChart,
    FileText,
    Home,
    Landmark,
    LayoutGrid,
    Package,
    Receipt,
    Settings,
    Shield,
    ShoppingCart,
    SlidersHorizontal,
    Tag,
    TrendingUp,
    TrendingDown,
    Truck,
    User,
    KeyRound,
    Users,
    Wallet,
    Wrench,
    Trash2,
    FileSpreadsheet,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';

export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutGrid,
    },
    {
        title: 'Akuntansi',
        href: '/akuntansi',
        icon: Calculator,
        children: [
            {
                title: 'Daftar Akun',
                href: '/akuntansi/daftar-akun',
                permission: 'akuntansi.daftar-akun.view',
                icon: Book,
            },
            {
                title: 'Jurnal Umum',
                href: '/akuntansi/jurnal',
                permission: 'akuntansi.jurnal.view',
                icon: ClipboardList,
            },
            {
                title: 'Jurnal Penyesuaian',
                href: '/akuntansi/jurnal-penyesuaian',
                permission: 'akuntansi.jurnal-penyesuaian.view',
                icon: BookOpenCheck,
            },
            {
                title: 'Buku Besar',
                href: '/akuntansi/buku-besar',
                permission: 'akuntansi.buku-besar.view',
                icon: BookOpen,
            },
            {
                title: 'Laporan Keuangan',
                href: '/akuntansi/laporan-keuangan',
                permission: 'akuntansi.laporan.view',
                icon: FileBarChart,
            },
        ],
    },
    {
        title: 'Kas & Bank',
        href: '/kas/cash-transactions',
        permission: 'kas.cash-management.view',
        icon: Wallet,
        children: [
            {
                title: 'Transaksi Kas',
                href: '/kas/cash-transactions',
                permission: 'kas.cash-management.view',
                icon: Receipt,
            },
            {
                title: 'Bank Account',
                href: '/kas/bank-accounts',
                permission: 'kas.bank-account.view',
                icon: CreditCard,
            },
            {
                title: 'Transaksi Bank',
                href: '/kas/bank-transactions',
                permission: 'kas.cash-management.view',
                icon: ArrowRightLeft,
            },
            {
                title: 'Transaksi Giro',
                href: '/kas/giro-transactions',
                permission: 'kas.giro-transaction.view',
                icon: FileText,
            },
            {
                title: 'Laporan Arus Kas',
                href: '/akuntansi/laporan-keuangan/arus-kas',
                permission: 'laporan.cash-flow.view',
                icon: TrendingUp,
            },
            {
                title: 'Laporan Giro',
                href: '/kas/reports/giro',
                permission: 'laporan.giro-report.view',
                icon: BarChart,
            },
        ],
    },
    {
        title: 'Persediaan',
        href: '/inventory/items',
        permission: 'inventory.items.view',
        icon: Boxes,
        children: [
            {
                title: 'Kategori Barang',
                href: '/inventory/categories',
                permission: 'inventory.categories.view',
                icon: Tag,
            },
            {
                title: 'Supplier',
                href: '/inventory/suppliers',
                permission: 'inventory.suppliers.view',
                icon: Truck,
            },
            {
                title: 'Barang',
                href: '/inventory/items',
                permission: 'inventory.items.view',
                icon: Package,
            },
            {
                title: 'Pembelian',
                href: '/inventory/purchases',
                permission: 'inventory.purchases.view',
                icon: ShoppingCart,
            },
            {
                title: 'Pembayaran Pembelian',
                href: '/inventory/purchase-payments',
                permission: 'inventory.purchases.view-ap',
                icon: CreditCard,
            },
            {
                title: 'Stock Adjustment',
                href: '/inventory/stock-adjustments',
                permission: 'inventory.stock-adjustments.view',
                icon: SlidersHorizontal,
            },
            {
                title: 'Stock Opname',
                href: '/inventory/stock-opnames',
                permission: 'inventory.stock-opnames.view',
                icon: CheckCircle2,
            },
            {
                title: 'Transfer Stok',
                href: '/inventory/stock-transfers',
                permission: 'inventory.stock-transfers.view',
                icon: ArrowRightLeft,
            },
            {
                title: 'Permintaan Stok',
                href: '/inventory/stock-requests',
                permission: 'inventory.stock-requests.view',
                icon: ClipboardList,
            },
            {
                title: 'Gudang Pusat',
                href: '/inventory/central-warehouse',
                permission: 'inventory.central-warehouse.view',
                icon: Box,
            },
            {
                title: 'Stok Department',
                href: '/inventory/department-stocks',
                permission: 'inventory.department-stocks.view',
                icon: Building2,
            },
            {
                title: 'Departemen',
                href: '/inventory/departments',
                permission: 'inventory.departments.view',
                icon: Users,
            },
            {
                title: 'Laporan Inventory',
                href: '/inventory/reports',
                permission: 'inventory.reports.view',
                icon: FileBarChart,
            },
            {
                title: 'Kepatuhan Opname',
                href: '/inventory/opname-compliance',
                permission: 'inventory.stock-opnames.view',
                icon: Shield,
            },
        ],
    },
    {
        title: 'Aset',
        href: '/aset/categories',
        permission: 'aset.categories.view',
        icon: Landmark,
        children: [
            {
                title: 'Kategori Aset',
                href: '/aset/categories',
                permission: 'aset.categories.view',
                icon: Tag,
            },
            {
                title: 'Daftar Aset',
                href: '/aset/assets',
                permission: 'aset.assets.view',
                icon: Boxes,
            },
            {
                title: 'Penyusutan',
                href: '/aset/depreciations',
                permission: 'aset.depreciations.view',
                icon: TrendingDown,
            },
            {
                title: 'Maintenance',
                href: '/aset/maintenances',
                permission: 'aset.maintenances.view',
                icon: Wrench,
            },
            {
                title: 'Disposal',
                href: '/aset/disposals',
                permission: 'aset.disposals.view',
                icon: Trash2,
            },
            {
                title: 'Transfer',
                href: '/aset/transfers',
                permission: 'aset.transfers.view',
                icon: ArrowRightLeft,
            },
            {
                title: 'RAB (Anggaran)',
                href: '/aset/budgets',
                permission: 'aset.budgets.view',
                icon: DollarSign,
            },
            {
                title: 'Laporan Register',
                href: '/aset/reports/register',
                permission: 'aset.reports.view',
                icon: FileSpreadsheet,
            },
            {
                title: 'Laporan Penyusutan',
                href: '/aset/reports/depreciation',
                permission: 'aset.reports.view',
                icon: FileBarChart,
            },
        ],
    },
    {
        title: 'Penggajian',
        href: '/penggajian',
        permission: 'penggajian.view',
        icon: Banknote,
        children: [
            {
                title: 'Gaji',
                href: '/penggajian',
                permission: 'penggajian.view',
                icon: Banknote,
            },
            {
                title: 'Slip Gaji Saya',
                href: '/penggajian/my-salary',
                permission: 'penggajian.slip-saya.view',
                icon: FileText,
            },
        ],
    },
    {
        title: 'Pengaturan',
        href: '/settings',
        icon: Settings,
        children: [
            {
                title: 'Manajemen Pengguna',
                href: '/users',
                permission: 'user.view',
                icon: User,
            },
            {
                title: 'Peran & Akses',
                href: '/roles',
                permission: 'role.view',
                icon: Shield,
            },
            {
                title: 'Hak Akses',
                href: '/permissions',
                permission: 'permission.view',
                icon: KeyRound,
            },
        ],
    },
];

export function AppSidebar() {
    const { user, logout } = useAuth();

    return (
        <Sidebar>
            <SidebarHeader className="px-4 py-3">
                <Link to="/" className="flex items-center gap-3">
                    <img
                        src="/1.png"
                        alt="Logo"
                        className="size-9 object-contain rounded-full shrink-0"
                    />
                    <div className="flex flex-col text-left">
                        <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white leading-tight">
                            Akuntansi
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal leading-tight mt-0.5">
                            Sistem Keuangan & ERP
                        </span>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
            <SidebarFooter className="border-t p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs shrink-0">
                                        {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user?.name || 'Administrator'}</span>
                                        <span className="truncate text-xs text-muted-foreground">{user?.nip || user?.role?.name || 'Administrator'}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs shrink-0">
                                            {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                                        </div>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{user?.name || 'Administrator'}</span>
                                            <span className="truncate text-xs text-muted-foreground">{user?.nip || user?.role?.name || 'Administrator'}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/account" className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profil Akun</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                                    Keluar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
