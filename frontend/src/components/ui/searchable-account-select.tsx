import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";

export interface AccountOption {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun?: string;
}

export interface SearchableAccountSelectProps {
    accounts: AccountOption[];
    value?: string | number;
    onValueChange?: (value: string) => void;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
}

export function SearchableAccountSelect({
    accounts,
    value,
    onValueChange,
    onChange,
    placeholder = "Pilih akun...",
    label,
    error,
    className,
    inputClassName,
    disabled = false,
}: SearchableAccountSelectProps) {
    const triggerChange = (val: string) => {
        onValueChange?.(val);
        onChange?.(val);
    };
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const valStr = value !== undefined && value !== null && value !== 0 ? String(value) : "";
    const selectedAccount = accounts.find((account) => String(account.id) === valStr);

    const filteredAccounts = React.useMemo(() => {
        if (!searchValue.trim()) return accounts;
        const search = searchValue.toLowerCase().trim();
        return accounts.filter(
            (account) =>
                account.kode_akun.toLowerCase().includes(search) ||
                account.nama_akun.toLowerCase().includes(search)
        );
    }, [accounts, searchValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "Enter":
                e.preventDefault();
                if (open && highlightedIndex >= 0 && highlightedIndex < filteredAccounts.length) {
                    triggerChange(String(filteredAccounts[highlightedIndex].id));
                    setOpen(false);
                    setSearchValue("");
                    setHighlightedIndex(-1);
                } else if (!open) {
                    setOpen(true);
                }
                break;
            case "Escape":
                setOpen(false);
                setSearchValue("");
                setHighlightedIndex(-1);
                inputRef.current?.blur();
                break;
            case "ArrowDown":
                e.preventDefault();
                if (!open) {
                    setOpen(true);
                } else {
                    setHighlightedIndex((prev) =>
                        prev < filteredAccounts.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (open) {
                    setHighlightedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredAccounts.length - 1
                    );
                }
                break;
        }
    };

    React.useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                });
            }
        }
    }, [highlightedIndex]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
                setSearchValue("");
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (account: AccountOption) => {
        triggerChange(String(account.id));
        setOpen(false);
        setSearchValue("");
        setHighlightedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerChange("");
        setSearchValue("");
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const displayValue = open
        ? searchValue
        : selectedAccount
            ? `${selectedAccount.kode_akun} - ${selectedAccount.nama_akun}`
            : "";

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {label && (
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                    {label}
                </label>
            )}

            <div className="relative w-full">
                <Input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                        if (!open) setOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                        if (!disabled) {
                            setOpen(true);
                            if (selectedAccount) setSearchValue("");
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono pr-14",
                        error ? "border-rose-500" : "",
                        inputClassName
                    )}
                />

                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {selectedAccount && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="h-6 w-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                            title="Hapus pilihan"
                        >
                            <X className="size-3" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => !disabled && setOpen(!open)}
                        className="h-6 w-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        disabled={disabled}
                    >
                        <ChevronDown
                            className={cn("size-3.5 transition-transform", open ? "rotate-180" : "")}
                        />
                    </button>
                </div>
            </div>

            {open && !disabled && (
                <div
                    ref={listRef}
                    className="absolute z-50 left-0 top-full mt-1 w-full max-h-56 overflow-auto bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none shadow-lg text-xs"
                >
                    {filteredAccounts.length === 0 ? (
                        <div className="px-3 py-2 text-neutral-400 font-mono text-center">
                            {searchValue ? "Tidak ada akun ditemukan" : "Data akun kosong"}
                        </div>
                    ) : (
                        filteredAccounts.map((account, index) => {
                            const isSelected = selectedAccount?.id === account.id;
                            return (
                                <div
                                    key={account.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(account);
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 cursor-pointer border-b border-neutral-100 dark:border-neutral-900 last:border-b-0 flex items-center justify-between transition-colors",
                                        "hover:bg-neutral-100/70 dark:hover:bg-neutral-900",
                                        index === highlightedIndex && "bg-neutral-100 dark:bg-neutral-900",
                                        isSelected && "bg-neutral-200/50 dark:bg-neutral-800/60 font-semibold"
                                    )}
                                >
                                    <div>
                                        <div className="font-mono text-neutral-900 dark:text-neutral-100">
                                            {account.kode_akun} - {account.nama_akun}
                                        </div>
                                        {account.jenis_akun && (
                                            <div className="text-[11px] text-neutral-400 font-mono uppercase">
                                                {account.jenis_akun.replace(/_/g, " ")}
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && <Check className="size-3.5 text-neutral-900 dark:text-white shrink-0 ml-2" />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {error && <p className="text-[11px] text-rose-500 mt-1 font-mono">{error}</p>}
        </div>
    );
}
