import React, { useEffect, useState, useMemo, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { salaryApi, SalaryBatch, SalaryDetail } from '@/api/salary';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Banknote,
    ArrowLeft,
    Save,
    RefreshCw,
    Users,
    Plus,
    Trash2,
    Database,
    Lock,
    ClipboardPaste,
    HardDrive,
    FileSpreadsheet,
} from 'lucide-react';

const EDITABLE_FIELDS: (keyof SalaryDetail)[] = [
    'gaji_pokok',
    'tunjangan_sia',
    'tunjangan_transportasi',
    'tunjangan_jabatan',
    'uang_jaga_utama',
    'uang_jaga_pratama',
    'jasa_pelayanan_pratama',
    'jasa_pelayanan_rawat_inap',
    'jasa_pelayanan_rawat_jalan',
    'jasa_pelayanan_rawat_jalan_bpjs',
    'tugas_tambahan',
    'pph_21',
    'infaq',
    'bpjs_kesehatan',
    'bpjs_ketenagakerjaan',
    'denda_absen',
    'arisan_keluarga',
    'denda_ngaji',
    'kasbon',
    'dana_sosial',
];

const formatCurrency = (val: number | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const parseClipboardNumber = (val: string): number => {
    if (!val) return 0;
    let clean = val.trim();
    if (!clean || clean === '-' || clean === 'Rp' || clean === 'IDR') return 0;

    // Strip currency symbols and extraneous whitespace
    clean = clean.replace(/^(rp|idr)\.?\s*/i, '').trim();

    // Check if format has dots as thousand separators (Indonesian format e.g. "5.000.000" or "1.500.000,00")
    if (clean.includes('.')) {
        const dotCount = (clean.match(/\./g) || []).length;
        if (dotCount > 1 || /\.\d{3}($|[^\d])/.test(clean)) {
            // Thousands separator is dot
            clean = clean.replace(/\./g, '').replace(',', '.');
        }
    } else if (clean.includes(',')) {
        const commaCount = (clean.match(/,/g) || []).length;
        if (commaCount > 1 || /,\d{3}$/.test(clean)) {
            clean = clean.replace(/,/g, '');
        } else {
            clean = clean.replace(',', '.');
        }
    }

    clean = clean.replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};

const calculateRowTotals = (row: SalaryDetail): SalaryDetail => {
    const num = (v: any) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

    const totalPendapatan =
        num(row.gaji_pokok) +
        num(row.tunjangan_sia) +
        num(row.tunjangan_transportasi) +
        num(row.tunjangan_jabatan) +
        num(row.uang_jaga_utama) +
        num(row.uang_jaga_pratama) +
        num(row.jasa_pelayanan_pratama) +
        num(row.jasa_pelayanan_rawat_inap) +
        num(row.jasa_pelayanan_rawat_jalan) +
        num(row.jasa_pelayanan_rawat_jalan_bpjs) +
        num(row.tugas_tambahan);

    const totalPotongan =
        num(row.pph_21) +
        num(row.infaq) +
        num(row.bpjs_kesehatan) +
        num(row.bpjs_ketenagakerjaan) +
        num(row.denda_absen) +
        num(row.arisan_keluarga) +
        num(row.denda_ngaji) +
        num(row.kasbon) +
        num(row.dana_sosial);

    const gajiBersih = totalPendapatan - totalPotongan;

    return {
        ...row,
        total_pendapatan: totalPendapatan,
        total_potongan: totalPotongan,
        gaji_bersih: gajiBersih,
    };
};

interface SalaryRowProps {
    row: SalaryDetail;
    index: number;
    totalRows: number;
    isReadOnly: boolean;
    onCellChange: (index: number, field: keyof SalaryDetail, val: any) => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, startColIndex: number) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldIndex: number) => void;
    onDeleteRow: (index: number) => void;
}

const SalaryRow = React.memo<SalaryRowProps>(
    ({ row, index, totalRows, isReadOnly, onCellChange, onPaste, onKeyDown, onDeleteRow }) => {
        return (
            <tr className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60 transition-colors">
                {/* Column No - Sticky Left */}
                <td className="sticky left-0 bg-white dark:bg-neutral-950 z-20 py-1.5 px-2 text-center text-neutral-400 border-r border-neutral-300 dark:border-neutral-700 w-12 min-w-[48px] max-w-[48px]">
                    {index + 1}
                </td>

                {/* Nama Pegawai & NIP - Sticky Left */}
                <td className="sticky left-[48px] bg-white dark:bg-neutral-950 z-20 py-1.5 px-3 border-r border-neutral-300 dark:border-neutral-700 min-w-[280px] w-[280px]">
                    {isReadOnly || (row.user_id && row.user_id > 0) ? (
                        <div>
                            <div className="font-sans font-bold text-neutral-900 dark:text-white truncate max-w-[260px]">
                                {row.nama_pegawai}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                NIP: {row.nip || '-'}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <input
                                type="text"
                                value={row.nama_pegawai}
                                onChange={(e) => onCellChange(index, 'nama_pegawai', e.target.value)}
                                placeholder="Nama Pegawai..."
                                className="w-full h-7 px-2 text-xs font-sans font-bold border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-none focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                required
                            />
                            <input
                                type="text"
                                value={row.nip || ''}
                                onChange={(e) => onCellChange(index, 'nip', e.target.value)}
                                placeholder="NIP..."
                                className="w-full h-6 px-2 text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-none text-neutral-500 focus:outline-none"
                            />
                        </div>
                    )}
                </td>

                {/* 11 Komponen Pendapatan - Borderless Excel-grid inputs */}
                {EDITABLE_FIELDS.slice(0, 11).map((field, colIdx) => (
                    <td
                        key={field}
                        className="py-0 px-0 min-w-[130px] w-32 border-r border-neutral-200 dark:border-neutral-800 bg-blue-50/20 dark:bg-blue-950/10"
                    >
                        {isReadOnly ? (
                            <div className="px-3 py-1 text-right text-neutral-800 dark:text-neutral-200">
                                {Number((row as any)[field] || 0) > 0
                                    ? Number((row as any)[field]).toLocaleString('id-ID')
                                    : '-'}
                            </div>
                        ) : (
                            <input
                                type="number"
                                data-row={index}
                                data-field={colIdx}
                                value={(row as any)[field] === 0 ? '' : (row as any)[field]}
                                onChange={(e) =>
                                    onCellChange(index, field, parseFloat(e.target.value) || 0)
                                }
                                onPaste={(e) => onPaste(e, index, colIdx)}
                                onKeyDown={(e) => onKeyDown(e, index, colIdx)}
                                placeholder="0"
                                className="w-full h-9 px-3 text-right text-xs font-mono border-0 focus:outline-none focus:bg-blue-100/60 dark:focus:bg-blue-900/40 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        )}
                    </td>
                ))}

                {/* 9 Komponen Potongan - Borderless Excel-grid inputs */}
                {EDITABLE_FIELDS.slice(11).map((field, colIdx) => (
                    <td
                        key={field}
                        className="py-0 px-0 min-w-[130px] w-32 border-r border-neutral-200 dark:border-neutral-800 bg-rose-50/20 dark:bg-rose-950/10"
                    >
                        {isReadOnly ? (
                            <div className="px-3 py-1 text-right text-rose-600 dark:text-rose-400">
                                {Number((row as any)[field] || 0) > 0
                                    ? Number((row as any)[field]).toLocaleString('id-ID')
                                    : '-'}
                            </div>
                        ) : (
                            <input
                                type="number"
                                data-row={index}
                                data-field={11 + colIdx}
                                value={(row as any)[field] === 0 ? '' : (row as any)[field]}
                                onChange={(e) =>
                                    onCellChange(index, field, parseFloat(e.target.value) || 0)
                                }
                                onPaste={(e) => onPaste(e, index, 11 + colIdx)}
                                onKeyDown={(e) => onKeyDown(e, index, 11 + colIdx)}
                                placeholder="0"
                                className="w-full h-9 px-3 text-right text-xs font-mono border-0 focus:outline-none focus:bg-rose-100/60 dark:focus:bg-rose-900/40 bg-transparent text-rose-600 dark:text-rose-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        )}
                    </td>
                ))}

                {/* Total Bruto - Sticky Right */}
                <td
                    className={cn(
                        'sticky z-20 py-1.5 px-3 text-right font-bold min-w-[140px] w-[140px] max-w-[140px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-l border-r border-neutral-300 dark:border-neutral-700',
                        isReadOnly ? 'right-[290px]' : 'right-[338px]'
                    )}
                >
                    {formatCurrency(row.total_pendapatan)}
                </td>

                {/* Total Potongan - Sticky Right */}
                <td
                    className={cn(
                        'sticky z-20 py-1.5 px-3 text-right font-bold min-w-[140px] w-[140px] max-w-[140px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-r border-neutral-300 dark:border-neutral-700',
                        isReadOnly ? 'right-[150px]' : 'right-[198px]'
                    )}
                >
                    {formatCurrency(row.total_potongan)}
                </td>

                {/* Gaji Bersih (Netto) - Sticky Right */}
                <td
                    className={cn(
                        'sticky z-20 py-1.5 px-3 text-right font-bold min-w-[150px] w-[150px] max-w-[150px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-r border-neutral-300 dark:border-neutral-700 text-xs',
                        isReadOnly ? 'right-0' : 'right-[48px]'
                    )}
                >
                    {formatCurrency(row.gaji_bersih)}
                </td>

                {/* Aksi Delete Baris - Sticky Right */}
                {!isReadOnly && (
                    <td className="sticky right-0 z-20 bg-white dark:bg-neutral-950 py-1 px-1 text-center w-12 min-w-[48px] max-w-[48px]">
                        <Can permission="penggajian.input-gaji">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteRow(index)}
                                className="h-7 w-7 p-0 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-none"
                                title="Hapus Baris Ini"
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </Can>
                    </td>
                )}
            </tr>
        );
    },
    (prev, next) => {
        return (
            prev.row === next.row &&
            prev.index === next.index &&
            prev.totalRows === next.totalRows &&
            prev.isReadOnly === next.isReadOnly
        );
    }
);

export const SalaryInputGaji: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [batch, setBatch] = useState<SalaryBatch | null>(null);
    const [rows, setRows] = useState<SalaryDetail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
    const [isCacheLoaded, setIsCacheLoaded] = useState<boolean>(false);
    const [lastSavedCache, setLastSavedCache] = useState<string | null>(null);

    const cacheKey = id ? `salary_input_${id}` : '';

    const fetchBatchAndDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await salaryApi.getBatch(id);
            if (res.data?.success) {
                const b = res.data.data;
                setBatch(b);

                let loadedRows: SalaryDetail[] = [];
                const cached = cacheKey ? localStorage.getItem(cacheKey) : null;

                if (cached && b.status === 'draft') {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            loadedRows = parsed.map((r: any) => calculateRowTotals(r));
                            setIsCacheLoaded(true);

                            const metaStr = localStorage.getItem(`${cacheKey}_metadata`);
                            if (metaStr) {
                                try {
                                    const meta = JSON.parse(metaStr);
                                    if (meta.timestamp) {
                                        setLastSavedCache(new Date(meta.timestamp).toLocaleTimeString('id-ID'));
                                    }
                                } catch (_) {}
                            }
                            if (!lastSavedCache) {
                                setLastSavedCache('Dipulihkan dari cache browser');
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to parse cache');
                    }
                }

                if (loadedRows.length === 0 && b.details && b.details.length > 0) {
                    loadedRows = b.details.map((d: any) => calculateRowTotals(d));
                }

                setRows(loadedRows);
            }
        } catch (err: any) {
            toast.error('Gagal memuat batch gaji');
            navigate('/penggajian');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatchAndDetails();
    }, [id]);

    const isReadOnly = batch?.status === 'posted';

    // Debounced background auto-save to localStorage (typing won't trigger synchronous disk I/O)
    useEffect(() => {
        if (!cacheKey || rows.length === 0 || isReadOnly) return;

        const timer = setTimeout(() => {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(rows));
                localStorage.setItem(
                    `${cacheKey}_metadata`,
                    JSON.stringify({
                        timestamp: new Date().toISOString(),
                        rowCount: rows.length,
                    })
                );
                setIsCacheLoaded(true);
                setLastSavedCache(new Date().toLocaleTimeString('id-ID'));
            } catch (e) {
                console.warn('Failed to save to localStorage');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [rows, cacheKey, isReadOnly]);

    // High performance cell change callback: only updates the target row reference!
    const handleCellChange = useCallback(
        (index: number, field: keyof SalaryDetail, val: any) => {
            if (isReadOnly) return;

            setRows((prev) => {
                if (!prev[index] || (prev[index] as any)[field] === val) return prev;
                const next = [...prev];
                next[index] = calculateRowTotals({
                    ...next[index],
                    [field]: val,
                });
                return next;
            });
        },
        [isReadOnly]
    );

    // Smart horizontal + multi-row paste from Excel
    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColIndex: number) => {
            const text = e.clipboardData.getData('text').trim();
            if (!text) return;

            e.preventDefault();

            // Split into lines (support both single-row and multi-row copy from Excel)
            const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
            if (lines.length === 0) return;

            setRows((prev) => {
                const updated = [...prev];
                let cellsUpdated = 0;
                let rowsUpdated = 0;

                lines.forEach((line, lineOffset) => {
                    const targetRow = startRowIndex + lineOffset;
                    if (targetRow >= updated.length) return;

                    let values = line.split('\t').map((v) => v.trim());
                    // Fallback if comma-separated
                    if (values.length === 1 && line.includes(',')) {
                        values = line.split(',').map((v) => v.trim());
                    }

                    // Smart detection of pasted columns:
                    // If user copied starting from "No", "Nama", or "NIP":
                    if (startColIndex === 0) {
                        if (values.length >= 23) {
                            values = values.slice(3);
                        } else if (values.length === 22) {
                            values = values.slice(2);
                        } else if (values.length === 21) {
                            values = values.slice(1);
                        }
                    }

                    values.forEach((val, valOffset) => {
                        const targetCol = startColIndex + valOffset;
                        if (targetCol >= EDITABLE_FIELDS.length) return;

                        const field = EDITABLE_FIELDS[targetCol];
                        const num = parseClipboardNumber(val);

                        (updated[targetRow] as any)[field] = num;
                        cellsUpdated++;
                    });

                    updated[targetRow] = calculateRowTotals(updated[targetRow]);
                    rowsUpdated++;
                });

                toast.success(
                    `Paste Berhasil: ${cellsUpdated} sel diperbarui pada ${rowsUpdated} karyawan.`
                );

                // Auto-focus next row's start input if single row was pasted
                if (lines.length === 1 && startRowIndex + 1 < updated.length) {
                    setTimeout(() => {
                        const nextInput = document.querySelector(
                            `input[data-row="${startRowIndex + 1}"][data-field="${startColIndex}"]`
                        ) as HTMLInputElement | null;
                        if (nextInput) {
                            nextInput.focus();
                            nextInput.select();
                        }
                    }, 50);
                }

                return updated;
            });
        },
        []
    );

    // Arrow keys and Enter keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldIndex: number) => {
            let nextRow = rowIndex;
            let nextField = fieldIndex;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    nextRow = Math.max(0, rowIndex - 1);
                    break;
                case 'ArrowDown':
                case 'Enter':
                    e.preventDefault();
                    nextRow = Math.min(rows.length - 1, rowIndex + 1);
                    break;
                case 'ArrowLeft':
                    // Move left if at start of input or all text selected
                    if (
                        e.currentTarget.selectionStart === 0 &&
                        (e.currentTarget.selectionEnd === 0 || e.currentTarget.selectionEnd === e.currentTarget.value.length)
                    ) {
                        e.preventDefault();
                        nextField = Math.max(0, fieldIndex - 1);
                    } else {
                        return;
                    }
                    break;
                case 'ArrowRight':
                    // Move right if cursor is at end or all text selected
                    if (
                        e.currentTarget.selectionStart === e.currentTarget.value.length ||
                        (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === e.currentTarget.value.length)
                    ) {
                        e.preventDefault();
                        nextField = Math.min(EDITABLE_FIELDS.length - 1, fieldIndex + 1);
                    } else {
                        return;
                    }
                    break;
                default:
                    return;
            }

            const el = document.querySelector(
                `input[data-row="${nextRow}"][data-field="${nextField}"]`
            ) as HTMLInputElement | null;
            if (el) {
                el.focus();
                el.select();
            }
        },
        [rows.length]
    );

    const handleAddRow = () => {
        if (isReadOnly) return;
        const newRow: SalaryDetail = calculateRowTotals({
            nama_pegawai: 'Karyawan Baru',
            nip: '',
            nomor_whatsapp: '',
            gaji_pokok: 0,
            tunjangan_sia: 0,
            tunjangan_transportasi: 0,
            tunjangan_jabatan: 0,
            uang_jaga_utama: 0,
            uang_jaga_pratama: 0,
            jasa_pelayanan_pratama: 0,
            jasa_pelayanan_rawat_inap: 0,
            jasa_pelayanan_rawat_jalan: 0,
            jasa_pelayanan_rawat_jalan_bpjs: 0,
            tugas_tambahan: 0,
            pph_21: 0,
            infaq: 0,
            bpjs_kesehatan: 0,
            bpjs_ketenagakerjaan: 0,
            denda_absen: 0,
            arisan_keluarga: 0,
            denda_ngaji: 0,
            kasbon: 0,
            dana_sosial: 0,
        });

        setRows((prev) => [...prev, newRow]);
    };

    const handleDownloadExcel = async () => {
        if (!id) return;
        try {
            setDownloadingExcel(true);
            const res = await salaryApi.downloadExcelTemplate(id, rows.length > 0 ? rows : undefined);

            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const batchName = batch ? batch.batch_number : `Batch-${id}`;
            link.setAttribute('download', `Format_Pengisian_Gaji_${batchName}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('File Excel (.xlsx) berhasil didownload.');
        } catch (err: any) {
            toast.error('Gagal mengunduh file Excel: ' + (err.message || 'Error'));
        } finally {
            setDownloadingExcel(false);
        }
    };

    const handlePopulateFromUsers = async () => {
        if (isReadOnly) return;
        try {
            setLoading(true);
            const res = await salaryApi.getUsersWithNIP();
            const users = res.data?.data || [];
            if (users.length === 0) {
                toast.error('Tidak ada data karyawan dengan NIP ditemukan.');
                return;
            }

            const populatedRows: SalaryDetail[] = users.map((u) =>
                calculateRowTotals({
                    user_id: u.id,
                    nip: u.nip,
                    nama_pegawai: u.name,
                    nomor_whatsapp: '',
                    gaji_pokok: 0,
                    tunjangan_sia: 0,
                    tunjangan_transportasi: 0,
                    tunjangan_jabatan: 0,
                    uang_jaga_utama: 0,
                    uang_jaga_pratama: 0,
                    jasa_pelayanan_pratama: 0,
                    jasa_pelayanan_rawat_inap: 0,
                    jasa_pelayanan_rawat_jalan: 0,
                    jasa_pelayanan_rawat_jalan_bpjs: 0,
                    tugas_tambahan: 0,
                    pph_21: 0,
                    infaq: 0,
                    bpjs_kesehatan: 0,
                    bpjs_ketenagakerjaan: 0,
                    denda_absen: 0,
                    arisan_keluarga: 0,
                    denda_ngaji: 0,
                    kasbon: 0,
                    dana_sosial: 0,
                })
            );

            setRows(populatedRows);
            toast.success(`Berhasil memuat ${users.length} karyawan dari data pegawai.`);
        } catch (err: any) {
            toast.error('Gagal mengambil daftar pegawai');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRow = useCallback(
        (index: number) => {
            if (isReadOnly) return;
            setRows((prev) => prev.filter((_, i) => i !== index));
        },
        [isReadOnly]
    );

    // Save manual draft to browser localStorage
    const handleSaveDraftBrowser = () => {
        if (!cacheKey) return;
        if (rows.length === 0) {
            toast.error('Tidak ada data rincian gaji untuk disimpan ke draft.');
            return;
        }

        try {
            localStorage.setItem(cacheKey, JSON.stringify(rows));
            localStorage.setItem(
                `${cacheKey}_metadata`,
                JSON.stringify({
                    timestamp: new Date().toISOString(),
                    rowCount: rows.length,
                })
            );
            const timeStr = new Date().toLocaleTimeString('id-ID');
            setIsCacheLoaded(true);
            setLastSavedCache(`Disimpan manual ${timeStr}`);
            toast.success(`Draft gaji (${rows.length} karyawan) berhasil disimpan di memori browser.`);
        } catch (e) {
            toast.error('Gagal menyimpan ke memori browser (penyimpanan penuh/diblokir)');
        }
    };

    const handleClearCache = () => {
        if (!confirm('Apakah Anda yakin ingin mereset cache input gaji?')) return;
        if (cacheKey) {
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(`${cacheKey}_metadata`);
            setIsCacheLoaded(false);
            setLastSavedCache(null);
            toast.success('Cache input gaji dibersihkan');
            fetchBatchAndDetails();
        }
    };

    // Save permanently to database
    const handleSubmitDb = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !batch) return;
        if (rows.length === 0) {
            toast.error('Tambahkan minimal 1 baris rincian gaji karyawan');
            return;
        }

        const emptyName = rows.some((r) => !r.nama_pegawai || r.nama_pegawai.trim() === '');
        if (emptyName) {
            toast.error('Semua baris harus memiliki nama pegawai');
            return;
        }

        try {
            setSubmitting(true);
            await salaryApi.saveSalaryDetails(id, rows);
            toast.success('Data gaji berhasil disimpan permanen ke database!');
            if (cacheKey) {
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(`${cacheKey}_metadata`);
            }
            navigate('/penggajian');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan data gaji');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate Column Totals (takes < 0.05ms)
    const summaryTotals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                acc.totalPendapatan += r.total_pendapatan || 0;
                acc.totalPotongan += r.total_potongan || 0;
                acc.gajiBersih += r.gaji_bersih || 0;
                return acc;
            },
            { totalPendapatan: 0, totalPotongan: 0, gajiBersih: 0 }
        );
    }, [rows]);

    const breadcrumbs = [
        { title: 'Penggajian', href: '/penggajian' },
        { title: 'Daftar Batch Gaji', href: '/penggajian' },
        { title: batch ? `Input Gaji: ${batch.batch_number}` : 'Input Gaji' },
    ];

    if (loading && !batch) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 p-12 text-center text-xs text-neutral-500 font-mono">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2" />
                    Memuat spreadsheet rincian gaji...
                </div>
            </AppLayout>
        );
    }

    if (!batch) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                    Batch gaji tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-3">
                <form
                    onSubmit={handleSubmitDb}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none"
                >
                    {/* Header Bar - Clean title without action buttons */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <Link to="/penggajian">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </Link>
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Banknote className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                        Rincian Gaji: {batch.batch_number}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border',
                                            batch.status === 'posted'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                : batch.status === 'done'
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                        )}
                                    >
                                        {batch.status}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                    Periode: {batch.period_display} • {batch.description || 'Tanpa keterangan'}
                                </p>
                            </div>
                        </div>

                        {/* Top indicator: Paste helper badge */}
                        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-neutral-500">
                            <ClipboardPaste className="size-3.5 text-neutral-400" />
                            <span>Mendukung copy & paste horizontal langsung dari Excel</span>
                        </div>
                    </div>

                    {/* Cache Warning Strip (if draft is currently restored from browser storage) */}
                    {isCacheLoaded && !isReadOnly && (
                        <div className="bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">⚠️ Draft dimuat dari memori browser:</span>
                                <span>
                                    Data ini masih tersimpan sementara di browser {lastSavedCache ? `(${lastSavedCache})` : ''}.
                                    Klik tombol <strong className="font-semibold underline">"Simpan ke Database"</strong> di bawah untuk menyimpan permanen ke server.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearCache}
                                className="text-[11px] underline hover:text-rose-600 shrink-0 font-medium ml-2"
                            >
                                Reset Draft
                            </button>
                        </div>
                    )}

                    {/* Toolbar & Live Metrics Strip */}
                    <div className="bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-4 font-mono">
                            <div>
                                <span className="text-neutral-500">Karyawan: </span>
                                <span className="font-bold text-neutral-900 dark:text-white">{rows.length} Orang</span>
                            </div>
                            <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
                            <div>
                                <span className="text-neutral-500">Total Bruto: </span>
                                <span className="font-bold text-blue-600">{formatCurrency(summaryTotals.totalPendapatan)}</span>
                            </div>
                            <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
                            <div>
                                <span className="text-neutral-500">Total Potongan: </span>
                                <span className="font-bold text-rose-600">{formatCurrency(summaryTotals.totalPotongan)}</span>
                            </div>
                            <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
                            <div>
                                <span className="text-neutral-500">NETTO: </span>
                                <span className="font-bold text-emerald-600">{formatCurrency(summaryTotals.gajiBersih)}</span>
                            </div>
                        </div>

                        {!isReadOnly && (
                            <Can permission="penggajian.input-gaji">
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadExcel}
                                        disabled={downloadingExcel || loading}
                                        className="h-7 text-xs border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5 rounded-none shadow-none font-sans font-medium"
                                        title="Download format spreadsheet Excel (.xlsx) yang siap diisi sesuai tabel ini"
                                    >
                                        <FileSpreadsheet className={`size-3.5 text-emerald-600 dark:text-emerald-400 ${downloadingExcel ? 'animate-spin' : ''}`} />
                                        <span>{downloadingExcel ? 'Mengunduh...' : 'Download Excel'}</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePopulateFromUsers}
                                        disabled={loading}
                                        className="h-7 text-xs border border-neutral-300 dark:border-neutral-700 gap-1.5 rounded-none shadow-none font-sans"
                                        title="Tarik seluruh daftar karyawan dengan NIP ke tabel"
                                    >
                                        <Users className="size-3.5 text-neutral-600 dark:text-neutral-300" />
                                        <span>Tarik Karyawan Aktif</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddRow}
                                        className="h-7 text-xs border border-neutral-300 dark:border-neutral-700 gap-1 rounded-none shadow-none font-sans"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah Baris</span>
                                    </Button>
                                </div>
                            </Can>
                        )}
                    </div>

                    {/* Spreadsheet Matrix Table */}
                    <div className="overflow-x-auto max-h-[640px] relative">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead className="sticky top-0 z-30 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-bold uppercase tracking-wider font-sans border-b border-neutral-300 dark:border-neutral-700">
                                <tr>
                                    <th className="sticky left-0 bg-neutral-100 dark:bg-neutral-900 z-40 py-2.5 px-2 text-center w-12 min-w-[48px] max-w-[48px] border-r border-neutral-300 dark:border-neutral-700">
                                        No
                                    </th>
                                    <th className="sticky left-[48px] bg-neutral-100 dark:bg-neutral-900 z-40 py-2.5 px-3 min-w-[280px] w-[280px] border-r border-neutral-300 dark:border-neutral-700">
                                        Nama Pegawai & NIP
                                    </th>

                                    {/* 11 Komponen Pendapatan */}
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Gaji Pokok</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Tunj. SIA</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Transport</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Jabatan</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Jaga Utama</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Jaga Pratama</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Jaspel Pratama</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Jaspel Ranap</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Jaspel Ralan</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-200 dark:border-neutral-800">Ralan BPJS</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-blue-50/70 dark:bg-blue-950/30 border-r border-neutral-300 dark:border-neutral-700">Tugas Tambahan</th>

                                    {/* 9 Komponen Potongan */}
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">PPh 21</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">Infaq</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">BPJS Kes</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">BPJS TK</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">Denda Absen</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">Arisan Kel</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">Denda Ngaji</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-200 dark:border-neutral-800">Kasbon</th>
                                    <th className="py-2.5 px-3 text-center min-w-[130px] w-32 bg-rose-50/70 dark:bg-rose-950/30 border-r border-neutral-300 dark:border-neutral-700">Dana Sosial</th>

                                    {/* Sticky Right Summary Columns */}
                                    <th
                                        className={cn(
                                            'sticky z-40 py-2.5 px-3 text-right min-w-[140px] w-[140px] max-w-[140px] bg-blue-100 dark:bg-blue-950 font-bold border-l border-r border-neutral-300 dark:border-neutral-700 text-blue-900 dark:text-blue-300',
                                            isReadOnly ? 'right-[290px]' : 'right-[338px]'
                                        )}
                                    >
                                        Total Bruto
                                    </th>
                                    <th
                                        className={cn(
                                            'sticky z-40 py-2.5 px-3 text-right min-w-[140px] w-[140px] max-w-[140px] bg-rose-100 dark:bg-rose-950 font-bold border-r border-neutral-300 dark:border-neutral-700 text-rose-900 dark:text-rose-300',
                                            isReadOnly ? 'right-[150px]' : 'right-[198px]'
                                        )}
                                    >
                                        Total Potongan
                                    </th>
                                    <th
                                        className={cn(
                                            'sticky z-40 py-2.5 px-3 text-right min-w-[150px] w-[150px] max-w-[150px] bg-emerald-100 dark:bg-emerald-950 font-bold border-r border-neutral-300 dark:border-neutral-700 text-emerald-900 dark:text-emerald-300',
                                            isReadOnly ? 'right-0' : 'right-[48px]'
                                        )}
                                    >
                                        Gaji Bersih (Netto)
                                    </th>

                                    {!isReadOnly && (
                                        <th className="sticky right-0 z-40 bg-neutral-100 dark:bg-neutral-900 py-2.5 px-2 min-w-[48px] w-12 max-w-[48px] text-center">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="font-mono divide-y divide-neutral-200 dark:divide-neutral-800">
                                {rows.length > 0 ? (
                                    rows.map((r, idx) => (
                                        <SalaryRow
                                            key={r.id || (r.user_id ? `u_${r.user_id}` : `r_${idx}`)}
                                            row={r}
                                            index={idx}
                                            totalRows={rows.length}
                                            isReadOnly={isReadOnly}
                                            onCellChange={handleCellChange}
                                            onPaste={handlePaste}
                                            onKeyDown={handleKeyDown}
                                            onDeleteRow={handleDeleteRow}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={26} className="py-16 text-center text-neutral-400 italic">
                                            Belum ada baris karyawan.{' '}
                                            <button
                                                type="button"
                                                onClick={handlePopulateFromUsers}
                                                className="underline font-bold text-blue-600 ml-1"
                                            >
                                                Klik di sini untuk menarik semua data karyawan aktif
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Form Footer Bar */}
                    <div className="px-4 py-3 bg-neutral-50/70 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs font-mono">
                            {isReadOnly ? (
                                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold font-sans">
                                    <Lock className="size-3.5" />
                                    <span>Batch ini telah diposting ke jurnal akuntansi (Mode Hanya Lihat)</span>
                                </span>
                            ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                    <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                        <Database className="size-3.5 text-neutral-400" />
                                        <span>
                                            {lastSavedCache
                                                ? `Draft browser: ${lastSavedCache}`
                                                : 'Perubahan otomatis dicadangkan di memori browser'}
                                        </span>
                                    </span>
                                    <span className="text-amber-600 dark:text-amber-400 font-sans font-medium flex items-center gap-1">
                                        <span>⚠️ Belum disimpan permanen ke database</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Link to="/penggajian">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800"
                                >
                                    {isReadOnly ? 'Kembali' : 'Batal'}
                                </Button>
                            </Link>

                            {!isReadOnly && (
                                <Can permission="penggajian.input-gaji">
                                    {isCacheLoaded && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClearCache}
                                            className="rounded-none h-8 text-xs border border-neutral-200 dark:border-neutral-800 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 shadow-none"
                                            title="Hapus draft yang tersimpan di memori browser"
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span>Reset Cache</span>
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSaveDraftBrowser}
                                        disabled={rows.length === 0}
                                        className="rounded-none h-8 text-xs border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 gap-1.5 shadow-none font-medium"
                                        title="Simpan draft ke memori browser (Local Storage)"
                                    >
                                        <HardDrive className="size-3.5 text-blue-600" />
                                        <span>Simpan Draft (Browser)</span>
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={submitting || rows.length === 0}
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-4 text-xs font-semibold gap-1.5 shadow-none"
                                        title="Simpan permanen ke database server"
                                    >
                                        <Save className="size-3.5" />
                                        <span>{submitting ? 'Menyimpan...' : 'Simpan ke Database'}</span>
                                    </Button>
                                </Can>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default SalaryInputGaji;
