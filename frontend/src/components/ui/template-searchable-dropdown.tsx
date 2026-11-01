import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, FileText } from "lucide-react";
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

interface Template {
  id: number;
  template_name: string;
  description?: string;
  period_type?: string;
  cutoff_days?: number;
  hard_close_days?: number | null;
}

interface TemplateSearchableDropdownProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  templates: Template[];
}

export function TemplateSearchableDropdown({
  value,
  onValueChange,
  placeholder = "Pilih template...",
  disabled = false,
  className,
  error = false,
  templates = [],
}: TemplateSearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Measure trigger width when component mounts or opens
  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedTemplate = templates.find((template) => template.id.toString() === value);

  // Filter templates based on search
  const filteredTemplates = templates.filter((template) =>
    template.template_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <FileText className="h-4 w-4 text-muted-foreground" />
              {selectedTemplate ? (
                <span className="truncate">{selectedTemplate.template_name}</span>
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
              placeholder="Cari template..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                Tidak ada template yang ditemukan.
              </CommandEmpty>
              <CommandGroup>
                {/* Clear option */}
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
                      <span>Tanpa template</span>
                    </div>
                  </CommandItem>
                )}
                
                {filteredTemplates.map((template) => (
                  <CommandItem
                    key={template.id}
                    value={`${template.id}-${template.template_name}`}
                    onSelect={() => {
                      onValueChange(template.id.toString() === value ? null : template.id.toString());
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === template.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{template.template_name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
