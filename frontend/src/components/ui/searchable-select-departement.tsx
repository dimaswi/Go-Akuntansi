import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DepartmentOption {
  id: number | string;
  name: string;
}

interface SearchableSelectDepartementProps {
  departments: DepartmentOption[];
  value?: string | number;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelectDepartement({
  departments,
  value,
  onValueChange,
  placeholder = "Pilih departemen...",
  label,
  error,
  className,
  disabled = false,
}: SearchableSelectDepartementProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selected = departments.find((d) => d.id.toString() === value);
  const filtered = React.useMemo(() => {
    if (!searchValue) return departments;
    const search = searchValue.toLowerCase();
    return departments.filter((d) => d.name.toLowerCase().includes(search));
  }, [departments, searchValue]);

  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('.relative')?.contains(event.target as Node)) {
        setOpen(false);
        setSearchValue("");
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (d: DepartmentOption) => {
    onValueChange(d.id.toString());
    setOpen(false);
    setSearchValue("");
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onValueChange("");
    setSearchValue("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const displayValue = open ? searchValue : (selected ? selected.name : "");

  return (
    <div className={cn("relative", className)}>
      {label && <Label className="block text-sm font-medium mb-2">{label}</Label>}
      <div className="relative">
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
              if (selected) setSearchValue("");
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-16",
            error ? "border-red-500" : "",
            open ? "rounded-b-none border-b-0" : ""
          )}
        />
        {selected && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
          disabled={disabled}
        >
          ▼
        </button>
      </div>
      {open && !disabled && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 z-50 max-h-60 overflow-auto bg-white border border-t-0 border-gray-300 rounded-b-md shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchValue ? "Tidak ada departemen ditemukan" : "Tidak ada data"}
            </div>
          ) : (
            filtered.map((d, index) => (
              <div
                key={d.id}
                onMouseDown={e => { e.preventDefault(); handleSelect(d); }}
                onClick={e => { e.stopPropagation(); handleSelect(d); }}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0",
                  "hover:bg-gray-50",
                  index === highlightedIndex ? "bg-blue-50" : "",
                  selected?.id === d.id ? "bg-blue-100" : ""
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{d.name}</div>
                  {selected?.id === d.id && <span className="text-blue-600">✓</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
