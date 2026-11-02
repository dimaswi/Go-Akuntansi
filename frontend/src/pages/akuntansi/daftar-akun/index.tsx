import React, { useEffect, useState, useMemo, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { ChartOfAccount, JenisAkun } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    ChevronRight,
    ChevronsDown,
    ChevronsUp,
    Edit3,
    Eye,
    FileSpreadsheet,
    Folder,
    FolderOpen,
    FolderTree,
    Layers,
    Plus,
    RefreshCw,
    Search,
    Trash,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Daftar Akun', href: '/akuntansi/daftar-akun' },
];

const jenisAkunLabels: Record<string, string> = {
    aset: 'Aset',
    kewajiban: 'Kewajiban',
    ekuitas: 'Modal / Ekuitas',
    modal: 'Modal / Ekuitas',
    pendapatan: 'Pendapatan',
    beban: 'Beban',
};

const badgeJenisAkun: Record<string, string> = {
    aset: 'border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    kewajiban: 'border-amber-200 bg-amber-50/50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    ekuitas: 'border-purple-200 bg-purple-50/50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    modal: 'border-purple-200 bg-purple-50/50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    pendapatan: 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    beban: 'border-rose-200 bg-rose-50/50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
};

export default function DaftarAkunIndex() {
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; nama: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const navigate = useNavigate();

    // ─── Fetch Data ──────────────────────────────────────────────────────────
    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/daftar-akun');
            const data: ChartOfAccount[] = res.data.data || [];
            setAccounts(data);

            // Default: Expand level 1 dan level 2
            const defaultExpanded = new Set<number>();
            for (const acc of data) {
                if (acc.level <= 2) {
                    defaultExpanded.add(acc.id);
                }
            }
            setExpandedIds(defaultExpanded);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat daftar akun');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    // ─── Hierarchy Maps ──────────────────────────────────────────────────────
    const { childrenMap, parentMap, parentIdSet, rootAccounts } = useMemo(() => {
        const cMap = new Map<number, ChartOfAccount[]>();
        const pMap = new Map<number, number>();
        const pSet = new Set<number>();
        const idMap = new Map<number, ChartOfAccount>();
        const codeMap = new Map<string, ChartOfAccount>();
        const level1Map = new Map<string, ChartOfAccount>();

        for (const acc of accounts) {
            idMap.set(acc.id, acc);
            codeMap.set(acc.kode_akun, acc);
            if (acc.level === 1) {
                const prefix = acc.kode_akun.charAt(0);
                level1Map.set(prefix, acc);
            }
        }

        for (const acc of accounts) {
            if (acc.level === 1) {
                // Root Level 1 item
                if (!cMap.has(0)) cMap.set(0, []);
                cMap.get(0)!.push(acc);
                continue;
            }

            // Cari parent: pertama coba induk_akun_id
            let pId: number | undefined = undefined;
            if (acc.induk_akun_id && idMap.has(acc.induk_akun_id)) {
                pId = acc.induk_akun_id;
            } else {
                // Fallback: cari parent dari kode akun prefix terpanjang
                const code = acc.kode_akun;
                for (let len = code.length - 1; len >= 1; len--) {
                    const subCode = code.substring(0, len);
                    if (codeMap.has(subCode)) {
                        pId = codeMap.get(subCode)!.id;
                        break;
                    }
                }
                // Jika masih belum ketemu, sambungkan ke Level 1 kategori utama berdasarkan karakter pertama kode
                if (!pId) {
                    const firstChar = code.charAt(0);
                    if (level1Map.has(firstChar)) {
                        pId = level1Map.get(firstChar)!.id;
                    }
                }
            }

            const finalParentId = pId || 0;
            if (!cMap.has(finalParentId)) {
                cMap.set(finalParentId, []);
            }
            cMap.get(finalParentId)!.push(acc);

            if (finalParentId > 0) {
                pMap.set(acc.id, finalParentId);
                pSet.add(finalParentId);
            }
        }

        // Sort children by kode_akun
        for (const [_, list] of cMap.entries()) {
            list.sort((a, b) => a.kode_akun.localeCompare(b.kode_akun, undefined, { numeric: true }));
        }

        const roots = cMap.get(0) || accounts.filter((a) => a.level === 1);
        return { childrenMap: cMap, parentMap: pMap, parentIdSet: pSet, rootAccounts: roots };
    }, [accounts]);

    // ─── KPI Metrics ─────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        let totalAset = 0;
        let totalKewajiban = 0;
        let totalEkuitas = 0;
        let totalPendapatan = 0;
        let totalBeban = 0;
        let countParent = 0;
        let countLeaf = 0;

        for (const a of accounts) {
            const isParent = a.level === 1 || parentIdSet.has(a.id);
            if (isParent) countParent++;
            else countLeaf++;

            const j = a.jenis_akun as string;
            if (j === 'aset') totalAset++;
            else if (j === 'kewajiban') totalKewajiban++;
            else if (j === 'ekuitas' || j === 'modal') totalEkuitas++;
            else if (j === 'pendapatan') totalPendapatan++;
            else if (j === 'beban') totalBeban++;
        }

        return {
            total: accounts.length,
            totalAset,
            totalKewajiban,
            totalEkuitas,
            totalPendapatan,
            totalBeban,
            countParent,
            countLeaf,
        };
    }, [accounts, parentIdSet]);

    // ─── Expand / Collapse Handlers ──────────────────────────────────────────
    const toggleNode = useCallback((id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        const allIds = new Set<number>();
        for (const a of accounts) {
            allIds.add(a.id);
        }
        setExpandedIds(allIds);
    }, [accounts]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    const expandLevel2 = useCallback(() => {
        const set = new Set<number>();
        for (const a of accounts) {
            if (a.level <= 2) {
                set.add(a.id);
            }
        }
        setExpandedIds(set);
    }, [accounts]);

    // ─── Search Auto-Expansion ───────────────────────────────────────────────
    const searchMatchInfo = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return {
                isSearching: false,
                matchingIds: new Set<number>(),
                ancestorIds: new Set<number>(),
            };
        }

        const matches = new Set<number>();
        const ancestors = new Set<number>();

        for (const acc of accounts) {
            const matchKode = acc.kode_akun.toLowerCase().includes(query);
            const matchNama = acc.nama_akun.toLowerCase().includes(query);

            if (matchKode || matchNama) {
                matches.add(acc.id);

                // Traverse ke atas untuk mencari seluruh leluhur
                let currId: number | undefined = acc.induk_akun_id || undefined;
                while (currId && currId > 0) {
                    ancestors.add(currId);
                    currId = parentMap.get(currId);
                }
            }
        }

        return {
            isSearching: true,
            matchingIds: matches,
            ancestorIds: ancestors,
        };
    }, [searchQuery, accounts, parentMap]);

    // ─── Delete Account ──────────────────────────────────────────────────────
    const handleDelete = (id: number, nama: string) => {
        setDeleteTarget({ id, nama });
    };

    // ─── Compute Visible Tree Rows ───────────────────────────────────────────
    const visibleRows = useMemo(() => {
        const result: ChartOfAccount[] = [];

        // Root items adalah akun Level 1 (Kategori Utama: 1 Aset, 2 Liabilitas, 3 Equitas, 4 Pendapatan, 5 Biaya)
        let rootItems = [...rootAccounts];

        // Filter category pada root items
        if (selectedCategory !== 'all') {
            rootItems = rootItems.filter((a) => {
                const j = a.jenis_akun as string;
                if (selectedCategory === 'ekuitas') {
                    return j === 'ekuitas' || j === 'modal';
                }
                return j === selectedCategory;
            });
        }

        // Recursive tree traversal
        const traverse = (items: ChartOfAccount[]) => {
            for (const item of items) {
                const isParent = item.level === 1 || parentIdSet.has(item.id);
                const children = childrenMap.get(item.id) || [];

                // Cek filter status
                let passStatus = true;
                if (selectedStatus === 'aktif') passStatus = item.is_aktif;
                else if (selectedStatus === 'nonaktif') passStatus = !item.is_aktif;

                // Cek filter tipe
                let passType = true;
                if (selectedType === 'induk') passType = isParent;
                else if (selectedType === 'transaksi') passType = !isParent;

                // Cek search
                let passSearch = true;
                if (searchMatchInfo.isSearching) {
                    passSearch =
                        searchMatchInfo.matchingIds.has(item.id) ||
                        searchMatchInfo.ancestorIds.has(item.id);
                }

                if (passStatus && passType && passSearch) {
                    result.push(item);
                }

                // Anak hanya di-render jika node ini terbuka (atau sedang search dan node ini adalah ancestor)
                const isExpanded =
                    expandedIds.has(item.id) ||
                    (searchMatchInfo.isSearching && searchMatchInfo.ancestorIds.has(item.id));

                if (isExpanded && children.length > 0) {
                    traverse(children);
                }
            }
        };

        traverse(rootItems);
        return result;
    }, [
        rootAccounts,
        childrenMap,
        parentIdSet,
        selectedCategory,
        selectedStatus,
        selectedType,
        searchMatchInfo,
        expandedIds,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* ─── Main Container Card ────────────────────────────────────────── */}
                <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-none shadow-none">
                    {/* Header Card */}
                    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <FolderTree className="h-5 w-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
                            <div>
                                <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Daftar Akun (Chart of Accounts)
                                </h2>
                                <p className="text-xs text-neutral-500">
                                    Daftar akun keuangan perusahaan
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={fetchAccounts}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 text-xs gap-1.5 px-3 bg-white dark:bg-neutral-900"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                                <span className="hidden sm:inline">Segarkan</span>
                            </Button>

                            <Can permission="akuntansi.daftar-akun.create">
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/akuntansi/daftar-akun/create')}
                                    className="h-8 rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-semibold gap-1.5 px-3.5 shadow-none"
                                >
                                    <Plus className="size-3.5" />
                                    Tambah Akun
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* ─── Category Filter Tabs ───────────────────────────────────── */}
                    <div className="flex items-center overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-2 py-1.5 gap-1">
                        {[
                            { key: 'all', label: 'Semua Akun', count: stats.total },
                            { key: 'aset', label: '1 • Aset', count: stats.totalAset },
                            { key: 'kewajiban', label: '2 • Kewajiban', count: stats.totalKewajiban },
                            { key: 'ekuitas', label: '3 • Modal / Ekuitas', count: stats.totalEkuitas },
                            { key: 'pendapatan', label: '4 • Pendapatan', count: stats.totalPendapatan },
                            { key: 'beban', label: '5 • Beban', count: stats.totalBeban },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedCategory(tab.key)}
                                className={cn(
                                    'px-3 py-1 text-xs font-medium rounded-none whitespace-nowrap transition-colors flex items-center gap-1.5',
                                    selectedCategory === tab.key
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold'
                                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:text-white',
                                )}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={cn(
                                        'text-[11px] font-mono px-1 rounded-sm',
                                        selectedCategory === tab.key
                                            ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800'
                                            : 'bg-neutral-200/70 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                                    )}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ─── Tree Controls & Filter Bar ─────────────────────────────── */}
                    <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-neutral-950">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
                            <Input
                                placeholder="Cari kode akun atau nama akun..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-8 pr-8 text-xs rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filters & Tree Expanders */}
                        <div className="flex items-center flex-wrap gap-2">
                            {/* Filter Tipe */}
                            <div className="w-48">
                                <SearchableSelect
                                    value={selectedType}
                                    onValueChange={(val) => setSelectedType(val)}
                                    placeholder="Semua Tipe Akun"
                                    searchPlaceholder="Cari tipe akun..."
                                    className="h-8 text-xs"
                                    options={[
                                        { value: 'all', label: 'Semua Tipe Akun' },
                                        { value: 'induk', label: 'Hanya Sub-Induk' },
                                        { value: 'transaksi', label: 'Hanya Transaksi (Postable)' },
                                    ]}
                                />
                            </div>

                            {/* Filter Status */}
                            <div className="w-40">
                                <SearchableSelect
                                    value={selectedStatus}
                                    onValueChange={(val) => setSelectedStatus(val)}
                                    placeholder="Semua Status"
                                    searchPlaceholder="Cari status..."
                                    className="h-8 text-xs"
                                    options={[
                                        { value: 'all', label: 'Semua Status' },
                                        { value: 'aktif', label: 'Aktif' },
                                        { value: 'nonaktif', label: 'Nonaktif' },
                                    ]}
                                />
                            </div>

                            {/* Expand All / Collapse All */}
                            <div className="flex items-center border border-neutral-200 dark:border-neutral-800">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={expandAll}
                                    className="h-8 px-2.5 rounded-none text-xs gap-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                                    title="Buka Seluruh Cabang Akun"
                                >
                                    <ChevronsDown className="size-3.5" />
                                    <span className="hidden sm:inline">Buka Semua</span>
                                </Button>
                                <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={expandLevel2}
                                    className="h-8 px-2 rounded-none text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                                    title="Tampilkan sampai Level 2"
                                >
                                    <span>Lv. 2</span>
                                </Button>
                                <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={collapseAll}
                                    className="h-8 px-2.5 rounded-none text-xs gap-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                                    title="Tutup Seluruh Cabang Akun"
                                >
                                    <ChevronsUp className="size-3.5" />
                                    <span className="hidden sm:inline">Tutup Semua</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ─── Modern Tree Table ──────────────────────────────────────── */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 select-none">
                                    <th className="py-2.5 px-3 w-40">Kode Akun</th>
                                    <th className="py-2.5 px-3 min-w-[320px]">Nama Akun (Hierarki)</th>
                                    <th className="py-2.5 px-3 w-32 text-center">Tipe Akun</th>
                                    <th className="py-2.5 px-3 w-36 text-center">Jenis Akun</th>
                                    <th className="py-2.5 px-3 w-28 text-center">Saldo Normal</th>
                                    <th className="py-2.5 px-3 w-24 text-center">Status</th>
                                    <th className="py-2.5 px-3 w-36 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                                {visibleRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-neutral-500">
                                            <FolderTree className="size-8 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                                            <p className="text-sm font-medium">Tidak ada akun yang sesuai kriteria.</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">
                                                Coba bersihkan pencarian atau ubah filter kategori.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    visibleRows.map((row) => {
                                        const children = childrenMap.get(row.id) || [];
                                        const hasChildren = children.length > 0;
                                        const isParent = row.level === 1 || hasChildren || parentIdSet.has(row.id);
                                        const isExpanded =
                                            expandedIds.has(row.id) ||
                                            (searchMatchInfo.isSearching &&
                                                searchMatchInfo.ancestorIds.has(row.id));

                                        // Indent calculation
                                        const indentPx = Math.max(0, row.level - 1) * 20;

                                        return (
                                            <tr
                                                key={row.id}
                                                className={cn(
                                                    'transition-colors group',
                                                    row.level === 1
                                                        ? 'bg-neutral-100/80 dark:bg-neutral-900 border-t-2 border-neutral-300 dark:border-neutral-700 font-bold hover:bg-neutral-200/60'
                                                        : isParent
                                                            ? 'bg-neutral-50/40 dark:bg-neutral-950/60 hover:bg-neutral-100/50'
                                                            : 'bg-white dark:bg-neutral-950 hover:bg-blue-50/20 dark:hover:bg-neutral-900/40',
                                                )}
                                            >
                                                {/* Kode Akun */}
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span
                                                        className={cn(
                                                            'font-mono text-xs inline-block rounded-none tracking-wide',
                                                            row.level === 1
                                                                ? 'font-bold bg-neutral-900 text-white dark:bg-white dark:text-black px-2.5 py-1 shadow-sm'
                                                                : row.level === 2
                                                                    ? 'font-semibold bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 px-2 py-0.5'
                                                                    : 'font-normal bg-neutral-50 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 border border-neutral-200/90 dark:border-neutral-800 px-2 py-0.5',
                                                        )}
                                                    >
                                                        {row.kode_akun}
                                                    </span>
                                                </td>

                                                {/* Nama Akun (Interactive Tree Node) */}
                                                <td className="py-2 px-3">
                                                    <div
                                                        className="flex items-center text-xs select-none"
                                                        style={{ paddingLeft: `${indentPx}px` }}
                                                    >
                                                        {/* Toggle expand/collapse button for parent nodes */}
                                                        {hasChildren ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleNode(row.id)}
                                                                className="mr-1.5 p-0.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors"
                                                                title={isExpanded ? 'Tutup Cabang' : 'Buka Cabang'}
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronDown className="size-3.5" />
                                                                ) : (
                                                                    <ChevronRight className="size-3.5" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            /* Leaf spacer connector */
                                                            <span className="w-5 h-5 mr-1.5 inline-flex items-center justify-center">
                                                                <span className="size-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                                            </span>
                                                        )}

                                                        {/* Icon + Label based on Level */}
                                                        {row.level === 1 ? (
                                                            <div className="flex items-center gap-2">
                                                                <Folder className="size-4 text-neutral-900 dark:text-neutral-100 fill-neutral-900/15 shrink-0" />
                                                                <span className="font-bold text-neutral-900 dark:text-neutral-50 tracking-wide uppercase text-xs sm:text-sm">
                                                                    {row.nama_akun}
                                                                </span>
                                                                <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-neutral-200/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-none">
                                                                    Kategori Utama
                                                                </span>
                                                                {hasChildren && (
                                                                    <span className="text-[11px] text-neutral-500 font-mono">
                                                                        ({children.length} sub)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : isParent ? (
                                                            <div className="flex items-center gap-2">
                                                                {isExpanded ? (
                                                                    <FolderOpen className="size-3.5 text-neutral-700 dark:text-neutral-300 shrink-0" />
                                                                ) : (
                                                                    <Folder className="size-3.5 text-neutral-600 dark:text-neutral-400 shrink-0" />
                                                                )}
                                                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                                    {row.nama_akun}
                                                                </span>
                                                                {hasChildren && (
                                                                    <span className="text-[11px] text-neutral-400 font-mono">
                                                                        ({children.length})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <FileSpreadsheet className="size-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                                                                <span className="font-normal text-neutral-700 dark:text-neutral-300">
                                                                    {row.nama_akun}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Tipe Akun */}
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    {row.level === 1 ? (
                                                        <span className="inline-block px-2 py-0.5 text-[11px] font-bold border border-neutral-300 bg-neutral-100 text-neutral-800 rounded-none">
                                                            Header
                                                        </span>
                                                    ) : isParent ? (
                                                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium border border-neutral-200 bg-neutral-50 text-neutral-600 rounded-none">
                                                            Sub-Induk
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium border border-sky-200 bg-sky-50/50 text-sky-700 rounded-none">
                                                            Transaksi
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Jenis Akun */}
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    <span
                                                        className={cn(
                                                            'inline-block px-2 py-0.5 text-[11px] font-medium rounded-full border',
                                                            badgeJenisAkun[row.jenis_akun] ||
                                                            'border-neutral-200 text-neutral-600',
                                                        )}
                                                    >
                                                        {jenisAkunLabels[row.jenis_akun] || row.jenis_akun}
                                                    </span>
                                                </td>

                                                {/* Saldo Normal */}
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    <span
                                                        className={cn(
                                                            'font-mono text-[11px] font-semibold px-2 py-0.5 rounded-none border',
                                                            row.saldo_normal === 'debit'
                                                                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'border-purple-200 bg-purple-50/50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
                                                        )}
                                                    >
                                                        {row.saldo_normal.toUpperCase()}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    {row.is_aktif ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-emerald-300 text-emerald-700 bg-emerald-50/40">
                                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-neutral-300 text-neutral-500 bg-neutral-50">
                                                            <span className="size-1.5 rounded-full bg-neutral-400" />
                                                            Nonaktif
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Aksi Cepat */}
                                                <td className="py-2 px-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Tambah Sub-Akun (Shortcut jika baris ini adalah induk/kategori) */}
                                                        {isParent && (
                                                            <Can permission="akuntansi.daftar-akun.create">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-7 rounded-none border border-emerald-200 text-emerald-600 bg-emerald-50/30 hover:bg-emerald-100/60 hover:text-emerald-700 p-0 shadow-none"
                                                                    title={`Tambah Sub-Akun di bawah "${row.nama_akun}"`}
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/akuntansi/daftar-akun/create?induk_id=${row.id}`,
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                        )}

                                                        {/* Mutasi Buku Besar (Khusus akun transaksi atau semua akun) */}
                                                        <Can permission="akuntansi.buku-besar.view">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7 rounded-none border border-blue-200 text-blue-600 bg-blue-50/30 hover:bg-blue-100/60 hover:text-blue-700 p-0 shadow-none"
                                                                title="Lihat Buku Besar"
                                                                onClick={() =>
                                                                    navigate(`/akuntansi/buku-besar/${row.id}`)
                                                                }
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>
                                                        </Can>

                                                        {/* Edit Akun */}
                                                        <Can permission="akuntansi.daftar-akun.edit">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7 rounded-none border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-100 hover:text-black p-0 shadow-none"
                                                                title="Edit Akun"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/akuntansi/daftar-akun/${row.id}/edit`,
                                                                    )
                                                                }
                                                            >
                                                                <Edit3 className="size-3.5" />
                                                            </Button>
                                                        </Can>

                                                        {/* Hapus Akun */}
                                                        <Can permission="akuntansi.daftar-akun.delete">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7 rounded-none border border-rose-200 text-rose-600 bg-rose-50/30 hover:bg-rose-100/60 hover:text-rose-700 p-0 shadow-none"
                                                                title="Hapus Akun"
                                                                onClick={() =>
                                                                    handleDelete(row.id, row.nama_akun)
                                                                }
                                                            >
                                                                <Trash className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info */}
                    <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs text-neutral-500 flex items-center justify-between">
                        <div>
                            Menampilkan{' '}
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                                {visibleRows.length.toLocaleString('id-ID')}
                            </span>{' '}
                            dari{' '}
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                                {stats.total.toLocaleString('id-ID')}
                            </span>{' '}
                            akun
                        </div>
                        <div className="text-[11px] text-neutral-400">
                            Gunakan tombol Buka/Tutup Semua atau filter kategori untuk navigasi cepat
                        </div>
                    </div>
                </div>

                <ConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Hapus Akun Perkiraan"
                    description={
                        <span>
                            Apakah Anda yakin ingin menghapus akun{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
                                "{deleteTarget?.nama}"
                            </strong>
                            ? Akun yang memiliki sub-akun atau saldo transaksi tidak dapat dihapus.
                        </span>
                    }
                    confirmText="Ya, Hapus"
                    cancelText="Batal"
                    variant="destructive"
                    loading={deleteLoading}
                    onConfirm={async () => {
                        if (!deleteTarget) return;
                        setDeleteLoading(true);
                        try {
                            await api.delete(`/daftar-akun/${deleteTarget.id}`);
                            toast.success(`Akun "${deleteTarget.nama}" berhasil dihapus`);
                            setDeleteTarget(null);
                            fetchAccounts();
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Gagal menghapus akun');
                        } finally {
                            setDeleteLoading(false);
                        }
                    }}
                />
            </div>
        </AppLayout>
    );
}
