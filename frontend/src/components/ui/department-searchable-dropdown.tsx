import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Building } from "lucide-react";
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

interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface DepartmentSearchableDropdownProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  departments?: Department[];
  apiEndpoint?: string;
  excludeId?: number;
}

export function DepartmentSearchableDropdown({
  value,
  onValueChange,
  placeholder = "Pilih department...",
  disabled = false,
  className,
  error = false,
  departments: initialDepartments = [],
  apiEndpoint = "/departments/api/search",
  excludeId,
}: DepartmentSearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fetch departments from API
  const fetchDepartments = async (search: string = "") => {
    try {
      setLoading(true);
      const url = new URL(apiEndpoint, window.location.origin);
      if (search) {
        url.searchParams.append('search', search);
      }
      
      console.log('Fetching departments from:', url.toString()); // Debug log
      
      const response = await fetch(url.toString());
      console.log('Response status:', response.status); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('Departments data received:', data); // Debug log
        setDepartments(Array.isArray(data) ? data : data.data || []);
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (initialDepartments.length === 0) {
      fetchDepartments();
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && searchQuery) {
        fetchDepartments(searchQuery);
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

  const selectedDepartment = departments.find((dept) => dept.id === value);

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
            <Building className="h-4 w-4 text-muted-foreground" />
            {selectedDepartment ? (
              <span className="truncate">{selectedDepartment.name}</span>
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
            placeholder="Cari department..."
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
                  Tidak ada department yang ditemukan.
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
                  
                  {departments
                    .filter((dept) => dept.is_active && dept.id !== excludeId)
                    .map((department) => (
                      <CommandItem
                        key={department.id}
                        value={`${department.id}-${department.name}`}
                        onSelect={() => {
                          onValueChange(department.id === value ? null : department.id);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === department.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{department.name}</div>
                            {department.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {department.description}
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
