import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw } from 'lucide-react';

interface PromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: React.ReactNode;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'default';
    onSubmit: (value: string) => void | Promise<void>;
    loading?: boolean;
}

export function PromptDialog({
    open,
    onOpenChange,
    title,
    description,
    label,
    placeholder = 'Masukkan keterangan...',
    defaultValue = '',
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'default',
    onSubmit,
    loading = false,
}: PromptDialogProps) {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
        }
    }, [open, defaultValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:max-w-md shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader className="space-y-2 text-left">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-none bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 flex items-center justify-center shrink-0">
                                <RotateCcw className="size-4" />
                            </div>
                            <DialogTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                {title}
                            </DialogTitle>
                        </div>
                        {description && (
                            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                {description}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-1.5 py-1">
                        {label && (
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {label} <span className="text-rose-500">*</span>
                            </label>
                        )}
                        <Input
                            type="text"
                            required
                            autoFocus
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className="h-9 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                        />
                    </div>

                    <DialogFooter className="flex flex-row items-center justify-end gap-2.5 sm:space-x-0 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={() => onOpenChange(false)}
                            className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium px-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 shadow-none m-0"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={loading || !value.trim()}
                            className={`h-8 rounded-none text-xs font-semibold px-4 shadow-none m-0 ${
                                variant === 'destructive'
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'bg-black text-white hover:bg-neutral-800'
                            }`}
                        >
                            {loading ? 'Memproses...' : confirmText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

