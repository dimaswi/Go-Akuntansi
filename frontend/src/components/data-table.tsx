import React, { type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RefreshCw,
    Search,
    X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
export interface Column<T> {
    /** Unique key for the column */
    key: string;
    /** Header label */
    label: string;
    /** Whether the column should be hidden */
    hidden?: boolean;
    /** Fixed width or alignment class */
    className?: string;
    /** Render cell content */
    render: (row: T, index: number, meta: RowMeta) => ReactNode;
    /** Render custom header content */
    headerRender?: () => ReactNode;
    /** Enable sorting indicator icon (default: true) */
    sortable?: boolean;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface RowMeta {
    rowNumber: number;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    pagination?: PaginationData;

    // Search
    searchValue?: string;
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    searchableFields?: (keyof T | ((row: T) => string))[];

    // Pagination callbacks
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];

    // Card Header area
    cardTitle?: string;
    cardIcon?: ReactNode;
    pageTitle?: string;
    pageSubtitle?: string;
    headerActions?: ReactNode;
    toolbarActions?: ReactNode;
    onRefresh?: () => void;

    // Empty state
    emptyIcon?: ReactNode;
    emptyText?: string;

    // Row key & handlers
    rowKey: (row: T) => string | number;
    onRowClick?: (row: T) => void;
    rowClassName?: (row: T) => string;
}

export function DataTable<T>({
    columns,
    data,
    pagination: controlledPagination,
    searchValue: controlledSearchValue,
    searchPlaceholder = 'Cari...',
    onSearch,
    searchableFields,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 20, 50, 100, 500],
    cardTitle,
    cardIcon,
    pageTitle,
    pageSubtitle,
    headerActions,
    toolbarActions,
    onRefresh,
    emptyIcon,
    emptyText = 'Tidak ada data yang sesuai.',
    rowKey,
    onRowClick,
    rowClassName,
}: DataTableProps<T>) {
    const isControlled = Boolean(controlledPagination && onPageChange);

    const [localSearch, setLocalSearch] = useState(controlledSearchValue ?? '');
    const [clientSearch, setClientSearch] = useState(controlledSearchValue ?? '');
    const [clientPage, setClientPage] = useState(1);
    const [clientPerPage, setClientPerPage] = useState(perPageOptions[0] || 10);

    useEffect(() => {
        if (controlledSearchValue !== undefined) {
            setLocalSearch(controlledSearchValue);
            setClientSearch(controlledSearchValue);
        }
    }, [controlledSearchValue]);

    // Handle instant real-time search typing
    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        if (onSearch) {
            onSearch(val);
        } else {
            setClientSearch(val);
            setClientPage(1);
        }
    };

    const handleClearSearch = useCallback(() => {
        setLocalSearch('');
        if (onSearch) {
            onSearch('');
        } else {
            setClientSearch('');
            setClientPage(1);
        }
    }, [onSearch]);

    const visibleColumns = columns.filter((c) => !c.hidden);

    const processedData = useMemo(() => {
        if (isControlled) return data;

        let filtered = [...data];

        if (clientSearch.trim()) {
            const query = clientSearch.toLowerCase().trim();
            filtered = filtered.filter((row) => {
                if (searchableFields && searchableFields.length > 0) {
                    return searchableFields.some((field) => {
                        const val = typeof field === 'function' ? field(row) : (row as any)[field];
                        return val ? String(val).toLowerCase().includes(query) : false;
                    });
                }
                return Object.values(row as Record<string, any>).some((val) =>
                    val ? String(val).toLowerCase().includes(query) : false,
                );
            });
        }

        return filtered;
    }, [data, isControlled, clientSearch, searchableFields]);

    const pagination: PaginationData = useMemo(() => {
        if (isControlled && controlledPagination) {
            return controlledPagination;
        }

        const total = processedData.length;
        const per_page = clientPerPage;
        const last_page = Math.max(1, Math.ceil(total / per_page));
        const current_page = Math.min(clientPage, last_page);
        const from = total === 0 ? 0 : (current_page - 1) * per_page + 1;
        const to = Math.min(from + per_page - 1, total);

        return {
            current_page,
            last_page,
            per_page,
            total,
            from,
            to,
        };
    }, [isControlled, controlledPagination, processedData.length, clientPerPage, clientPage]);

    const displayData = useMemo(() => {
        if (isControlled) return data;
        const start = (pagination.current_page - 1) * pagination.per_page;
        return processedData.slice(start, start + pagination.per_page);
    }, [isControlled, data, processedData, pagination.current_page, pagination.per_page]);

    const handlePageChangeInternal = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.last_page) return;
        if (onPageChange) {
            onPageChange(newPage);
        } else {
            setClientPage(newPage);
        }
    };

    const handlePerPageChangeInternal = (newPerPage: number) => {
        if (onPerPageChange) {
            onPerPageChange(newPerPage);
        } else {
            setClientPerPage(newPerPage);
            setClientPage(1);
        }
    };

    const displayTitle = cardTitle || pageTitle;

    return (
        <div className="w-full space-y-4">
            {/* ─── Top Page Header (jika ada subtitle / headerActions terpisah di atas) ───── */}
            {(pageSubtitle || (headerActions && !displayTitle)) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        {pageTitle && (
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                {pageTitle}
                            </h1>
                        )}
                        {pageSubtitle && (
                            <p className="text-xs text-neutral-500 mt-1">
                                {pageSubtitle}
                            </p>
                        )}
                    </div>
                    {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
                </div>
            )}

            {/* ─── Unified Card Container: KOTAK (rounded-none border border-neutral-200) ─── */}
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 shadow-none">
                
                {/* ─── Card Header: Icon + Title (Left) & Search + Filters (Right) ──────── */}
                <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                    <div className="flex items-center gap-2.5">
                        {cardIcon && (
                            <div className="flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                                {cardIcon}
                            </div>
                        )}
                        {displayTitle && (
                            <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                {displayTitle}
                            </h2>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Input
                                placeholder={searchPlaceholder}
                                value={localSearch}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="h-9 rounded-none border border-neutral-200 text-sm bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                            />
                            {localSearch && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Extra Toolbar Filters */}
                        {toolbarActions}

                        {/* Refresh Button */}
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                className="h-9 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-medium gap-1.5 px-3.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 shadow-none"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Segarkan
                            </Button>
                        )}

                        {/* Header Action Button (misal: Tambah Akun) */}
                        {headerActions && !pageSubtitle && headerActions}
                    </div>
                </div>

                {/* ─── Table Content ────────────────────────────────────────────────────── */}
                <div className="w-full overflow-x-auto select-none">
                    <table className="w-full text-left border-collapse select-none">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40">
                                {visibleColumns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            'py-3 px-4 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 whitespace-nowrap',
                                            col.className,
                                        )}
                                    >
                                        <span>{col.headerRender ? col.headerRender() : col.label}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {displayData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={visibleColumns.length}
                                        className="py-14 text-center text-neutral-500 text-sm"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            {emptyIcon}
                                            <span>{emptyText}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayData.map((row, index) => {
                                    const meta: RowMeta = {
                                        rowNumber:
                                            (pagination.current_page - 1) * pagination.per_page + index + 1,
                                    };
                                    return (
                                        <tr
                                            key={rowKey(row)}
                                            className={cn(
                                                'hover:bg-neutral-50/60 dark:hover:bg-neutral-900/50 transition-colors',
                                                onRowClick && 'cursor-pointer',
                                                rowClassName?.(row),
                                            )}
                                            onClick={() => onRowClick?.(row)}
                                        >
                                            {visibleColumns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        'py-3.5 px-4 text-sm text-neutral-800 dark:text-neutral-200 align-middle',
                                                        col.className,
                                                    )}
                                                >
                                                    {col.render(row, index, meta)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── Card Footer: Pagination ──────────────────────────────────────────── */}
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {/* Left: 0 row(s) */}
                    <div>
                        {pagination.total} row(s)
                    </div>

                    {/* Right: Rows per page [ 10 ˅ ]   Page 1 of X   << < > >> */}
                    <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <SearchableSelect
                                className="w-24"
                                value={pagination.per_page.toString()}
                                onValueChange={(v) => v && handlePerPageChangeInternal(Number(v))}
                                options={perPageOptions.map((n) => ({ value: n.toString(), label: n.toString() }))}
                                placeholder="10"
                            />
                        </div>

                        <div className="whitespace-nowrap">
                            Page {pagination.total === 0 ? 0 : pagination.current_page} of {pagination.total === 0 ? 0 : pagination.last_page}
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                title="First page"
                                onClick={() => handlePageChangeInternal(1)}
                                disabled={pagination.current_page <= 1}
                            >
                                <ChevronsLeft className="size-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                title="Previous page"
                                onClick={() => handlePageChangeInternal(pagination.current_page - 1)}
                                disabled={pagination.current_page <= 1}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                title="Next page"
                                onClick={() => handlePageChangeInternal(pagination.current_page + 1)}
                                disabled={pagination.current_page >= pagination.last_page || pagination.total === 0}
                            >
                                <ChevronRight className="size-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-none border border-neutral-200 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none p-0 shadow-none"
                                title="Last page"
                                onClick={() => handlePageChangeInternal(pagination.last_page)}
                                disabled={pagination.current_page >= pagination.last_page || pagination.total === 0}
                            >
                                <ChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

