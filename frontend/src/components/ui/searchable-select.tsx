import * as React from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";

export interface SearchableSelectOption {
    value: string;
    label: string;
    description?: string;
}

export interface SearchableSelectProps {
    value?: string | number;
    onValueChange?: (value: string) => void;
    onChange?: (value: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    label?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
    clearable?: boolean;
}

export function SearchableSelect({
    value,
    onValueChange,
    onChange,
    options,
    placeholder = "Pilih...",
    label,
    emptyText = "Tidak ada pilihan yang cocok",
    className,
    inputClassName,
    disabled = false,
    clearable = true,
}: SearchableSelectProps) {
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
    const selectedOption = options.find((opt) => opt.value === valStr);

    const filteredOptions = React.useMemo(() => {
        if (!searchValue.trim()) return options;
        const search = searchValue.toLowerCase().trim();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(search) ||
                (opt.description && opt.description.toLowerCase().includes(search))
        );
    }, [options, searchValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "Enter":
                e.preventDefault();
                if (open && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    triggerChange(filteredOptions[highlightedIndex].value);
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
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (open) {
                    setHighlightedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredOptions.length - 1
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

    // Posisi dropdown (fixed + portal) agar tidak terpotong oleh container overflow / tabel
    const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});
    const updateMenuPosition = React.useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const maxH = 224;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < Math.min(maxH, 160) && rect.top > spaceBelow;
        setMenuStyle({
            position: "fixed",
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
            pointerEvents: "auto",
            ...(openUp
                ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(maxH, rect.top - 8) }
                : { top: rect.bottom + 4, maxHeight: Math.min(maxH, Math.max(120, spaceBelow - 8)) }),
        });
    }, []);

    React.useLayoutEffect(() => {
        if (!open) return;
        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);
        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [open, updateMenuPosition]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (listRef.current && listRef.current.contains(target)) return;
            if (containerRef.current && !containerRef.current.contains(target)) {
                setOpen(false);
                setSearchValue("");
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt: SearchableSelectOption) => {
        triggerChange(opt.value);
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

    const displayValue = open ? searchValue : selectedOption ? selectedOption.label : "";

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
                            if (selectedOption) setSearchValue("");
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono",
                        clearable ? "pr-14" : "pr-7",
                        inputClassName
                    )}
                />

                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {clearable && selectedOption && !disabled && (
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

            {open && !disabled && createPortal(
                <div
                    ref={listRef}
                    style={menuStyle}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="overflow-auto bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none shadow-lg text-xs"
                >
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-neutral-400 font-mono text-center">
                            {emptyText}
                        </div>
                    ) : (
                        filteredOptions.map((opt, index) => {
                            const isSelected = selectedOption?.value === opt.value;
                            return (
                                <div
                                    key={opt.value}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(opt);
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
                                            {opt.label}
                                        </div>
                                        {opt.description && (
                                            <div className="text-[11px] text-neutral-400 font-mono">
                                                {opt.description}
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && <Check className="size-3.5 text-neutral-900 dark:text-white shrink-0 ml-2" />}
                                </div>
                            );
                        })
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
