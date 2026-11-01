import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface Item {
  id: number;
  code: string;
  name: string;
  unit_of_measure: string;
  reorder_level?: number;
  safety_stock?: number;
  is_active?: boolean;
}

interface ItemSearchableDropdownProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  items?: Item[];
  apiEndpoint?: string;
  excludeIds?: number[];
}

export function ItemSearchableDropdown({
  value,
  onValueChange,
  placeholder = "Pilih item...",
  disabled = false,
  className,
  error = false,
  items: initialItems = [],
  apiEndpoint = "/items/api/search",
  excludeIds = [],
}: ItemSearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fetch items from API
  const fetchItems = async (search: string = "") => {
    try {
      setLoading(true);
      const url = new URL(apiEndpoint, window.location.origin);
      if (search) {
        url.searchParams.append('search', search);
      }
      
      console.log('Fetching items from:', url.toString()); // Debug log
      
      const response = await fetch(url.toString());
      console.log('Response status:', response.status); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('Items data received:', data); // Debug log
        setItems(Array.isArray(data) ? data : data.data || []);
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (initialItems.length === 0) {
      fetchItems();
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && searchQuery) {
        fetchItems(searchQuery);
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

  const selectedItem = items.find((item) => item.id === value);

  // Filter out excluded items
  const availableItems = items.filter((item) => 
    !excludeIds.includes(item.id) && (item.is_active !== false)
  );

  return (
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
            <Package className="h-4 w-4 text-muted-foreground" />
            {selectedItem ? (
              <span className="truncate">{selectedItem.code} - {selectedItem.name}</span>
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
            placeholder="Cari item..."
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
                  Tidak ada item yang ditemukan.
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
                  
                  {availableItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.id}-${item.code}-${item.name}`}
                      onSelect={() => {
                        onValueChange(item.id === value ? null : item.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === item.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.code} - {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.unit_of_measure}
                            </Badge>
                            {item.reorder_level && (
                              <span className="text-xs text-muted-foreground">
                                Reorder: {item.reorder_level}
                              </span>
                            )}
                          </div>
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
  );
}
