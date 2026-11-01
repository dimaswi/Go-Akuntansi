import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Tag } from "lucide-react";
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

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface CategorySearchableDropdownProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  categories?: Category[];
  apiEndpoint?: string;
}

export function CategorySearchableDropdown({
  value,
  onValueChange,
  placeholder = "Pilih kategori...",
  disabled = false,
  className,
  error = false,
  categories: initialCategories = [],
  apiEndpoint = "/item-categories/api/search",
}: CategorySearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fetch categories from API
  const fetchCategories = async (search: string = "") => {
    try {
      setLoading(true);
      const url = new URL(apiEndpoint, window.location.origin);
      if (search) {
        url.searchParams.append('search', search);
      }
      
      console.log('Fetching categories from:', url.toString()); // Debug log
      
      const response = await fetch(url.toString());
      console.log('Response status:', response.status); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('Categories data received:', data); // Debug log
        setCategories(Array.isArray(data) ? data : data.data || []);
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (initialCategories.length === 0) {
      fetchCategories();
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && searchQuery) {
        fetchCategories(searchQuery);
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

  const selectedCategory = categories.find((cat) => cat.id === value);

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
            <Tag className="h-4 w-4 text-muted-foreground" />
            {selectedCategory ? (
              <span className="truncate">{selectedCategory.name}</span>
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
            placeholder="Cari kategori..."
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
                  Tidak ada kategori yang ditemukan.
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
                  
                  {categories
                    .filter((cat) => cat.is_active)
                    .map((category) => (
                      <CommandItem
                        key={category.id}
                        value={`${category.id}-${category.name}`}
                        onSelect={() => {
                          onValueChange(category.id === value ? null : category.id);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === category.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {category.description}
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
  );
}
