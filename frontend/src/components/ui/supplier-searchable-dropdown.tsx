import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

interface SupplierSearchableDropdownProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  suppliers?: Supplier[];
  apiEndpoint?: string;
}

export function SupplierSearchableDropdown({
  value,
  onValueChange,
  placeholder = "Pilih supplier...",
  disabled = false,
  className,
  error = false,
  suppliers: initialSuppliers = [],
  apiEndpoint = "/suppliers/api/search",
}: SupplierSearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fetch suppliers from API
  const fetchSuppliers = async (search: string = "") => {
    try {
      setLoading(true);
      const url = new URL(apiEndpoint, window.location.origin);
      if (search) {
        url.searchParams.append('search', search);
      }
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setSuppliers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (initialSuppliers.length === 0) {
      fetchSuppliers();
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && searchQuery) {
        fetchSuppliers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open]);

  // Measure trigger width when component mounts or opens
  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedSupplier = suppliers.find((supplier) => supplier.id === value);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-red-500",
              className
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              {selectedSupplier ? (
                <span className="truncate">{selectedSupplier.name}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0" 
          align="start" 
          sideOffset={4}
          style={{ width: triggerWidth ? `${triggerWidth}px` : 'auto' }}
        >
          <Command>
          <CommandInput
            placeholder="Cari supplier..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Memuat data...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  Tidak ada supplier yang ditemukan.
                </CommandEmpty>
                <CommandGroup>
                  {/* Add clear option */}
                  {value && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        onValueChange(null);
                        setOpen(false);
                      }}
                      className="text-muted-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4" />
                        <span>Hapus pilihan</span>
                      </div>
                    </CommandItem>
                  )}
                  
                  {suppliers
                    .filter((supplier) => supplier.is_active)
                    .map((supplier) => (
                      <CommandItem
                        key={supplier.id}
                        value={`${supplier.id}-${supplier.name}`}
                        onSelect={() => {
                          onValueChange(supplier.id === value ? null : supplier.id);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === supplier.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{supplier.name}</div>
                            {(supplier.email || supplier.phone) && (
                              <div className="text-xs text-muted-foreground truncate">
                                {supplier.email && supplier.phone 
                                  ? `${supplier.email} • ${supplier.phone}`
                                  : supplier.email || supplier.phone
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    </div>
  );
}
