import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";

/**
 * Drop-in pengganti <select> bawaan browser dengan fitur pencarian.
 * Menerima props & children (<option>) yang sama seperti <select>,
 * sehingga migrasi cukup mengganti nama tag.
 */

type NativeSearchableSelectProps = Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "onChange" | "value"
> & {
    value?: string | number | readonly string[];
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    clearable?: boolean;
};

function nodeToText(node: React.ReactNode): string {
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(nodeToText).join("");
    if (React.isValidElement(node)) return nodeToText((node.props as any).children);
    return "";
}

function collectOptions(
    children: React.ReactNode,
    out: { options: SearchableSelectOption[]; placeholder?: string },
) {
    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        const props = child.props as any;
        if (child.type === React.Fragment) {
            collectOptions(props.children, out);
            return;
        }
        if (child.type === "optgroup") {
            collectOptions(props.children, out);
            return;
        }
        if (child.type === "option") {
            const label = nodeToText(props.children).trim();
            const value = props.value !== undefined ? String(props.value) : label;
            if (value === "") {
                if (out.placeholder === undefined) out.placeholder = label;
                return;
            }
            out.options.push({ value, label });
        }
    });
}

const CONTAINER_CLASS = /^(w-|min-w-|max-w-|flex|shrink|grow|col-span|basis-|self-|m-|mt-|mb-|ml-|mr-|mx-|my-|-m|(sm|md|lg|xl):)/;
const INPUT_CLASS = /^(h-\d+|text-(xs|sm|base|lg)|font-(mono|sans|medium|semibold|bold))$/;

export function NativeSearchableSelect({
    value,
    onChange,
    children,
    className,
    required,
    disabled,
    clearable,
    name,
    id,
}: NativeSearchableSelectProps) {
    const collected = React.useMemo(() => {
        const out: { options: SearchableSelectOption[]; placeholder?: string } = { options: [] };
        collectOptions(children, out);
        return out;
    }, [children]);

    const valStr = value === undefined || value === null ? "" : String(value);

    const tokens = (className || "").split(/\s+/).filter(Boolean);
    const containerClass = tokens.filter((c) => CONTAINER_CLASS.test(c)).join(" ");
    const inputClass = tokens.filter((c) => INPUT_CLASS.test(c)).join(" ");

    const handleChange = (val: string) => {
        if (!onChange) return;
        const target = { value: val, name: name ?? "", id: id ?? "" };
        onChange({ target, currentTarget: target } as unknown as React.ChangeEvent<HTMLSelectElement>);
    };

    return (
        <div className={cn("relative w-full", containerClass)}>
            <SearchableSelect
                value={valStr}
                onValueChange={handleChange}
                options={collected.options}
                placeholder={collected.placeholder || "Pilih..."}
                disabled={disabled}
                clearable={clearable}
                inputClassName={cn("font-sans", inputClass)}
            />
            {required && (
                <input
                    tabIndex={-1}
                    aria-hidden="true"
                    required
                    value={valStr}
                    onChange={() => {}}
                    className="absolute left-0 bottom-0 h-0 w-full opacity-0 pointer-events-none"
                />
            )}
        </div>
    );
}

export default NativeSearchableSelect;

