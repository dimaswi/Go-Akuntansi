import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export interface NavChildItem {
    title: string;
    href: string;
    icon?: LucideIcon;
    /** Nama permission (atau salah satunya jika array). Kosong = selalu tampil. */
    permission?: string | string[];
}

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    children?: NavChildItem[];
    /**
     * Permission untuk item tanpa children. Untuk item dengan children, permission
     * diabaikan: menu induk tampil jika minimal satu child lolos pengecekan.
     */
    permission?: string | string[];
}

const STORAGE_KEY = 'app_sidebar_open_menus';

function getStoredOpenMap(): Record<string, boolean> {
    try {
        const val = localStorage.getItem(STORAGE_KEY);
        if (val) {
            return JSON.parse(val);
        }
    } catch {
        // fallback
    }
    return {
        'Akuntansi': true,
        'User': true,
    };
}

export function NavMain({ items: allItems = [] }: { items: NavItem[] }) {
    const location = useLocation();
    const currentPath = location.pathname;
    const { hasPermission } = useAuth();

    // Saring menu berdasarkan permission user. Parent dengan children tampil
    // hanya jika minimal satu child boleh diakses.
    const items = React.useMemo<NavItem[]>(() => {
        const allowed = (perm?: string | string[]) => {
            if (!perm) return true;
            return (Array.isArray(perm) ? perm : [perm]).some((p) => hasPermission(p));
        };
        return allItems.reduce<NavItem[]>((acc, item) => {
            if (item.children && item.children.length > 0) {
                const children = item.children.filter((c) => allowed(c.permission));
                if (children.length > 0) acc.push({ ...item, children });
            } else if (allowed(item.permission)) {
                acc.push(item);
            }
            return acc;
        }, []);
    }, [allItems, hasPermission]);

    const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
        const initial = getStoredOpenMap();
        items.forEach((item) => {
            if (item.children?.some((c) => currentPath === c.href || currentPath.startsWith(c.href + '/'))) {
                initial[item.title] = true;
            }
        });
        return initial;
    });

    // Pastikan menu yang sedang aktif selalu otomatis terbuka saat rute berubah
    React.useEffect(() => {
        items.forEach((item) => {
            if (item.children?.some((c) => currentPath === c.href || currentPath.startsWith(c.href + '/'))) {
                setOpenMap((prev) => {
                    if (prev[item.title]) return prev;
                    const next = { ...prev, [item.title]: true };
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                    } catch {
                        // ignore
                    }
                    return next;
                });
            }
        });
    }, [currentPath, items]);

    const toggleOpen = (title: string) => {
        setOpenMap((prev) => {
            const next = { ...prev, [title]: !prev[title] };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    const isParentActive = (item: NavItem) => {
        if (!item.children) {
            return currentPath === item.href;
        }
        return item.children.some((c) => currentPath === c.href || currentPath.startsWith(c.href + '/'));
    };

    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => {
                    const Icon = item.icon;
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = !!openMap[item.title];
                    const active = isParentActive(item);

                    if (!hasChildren) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                                    <Link to={item.href}>
                                        <Icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            open={isOpen}
                            onOpenChange={() => toggleOpen(item.title)}
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title} isActive={active}>
                                        <Icon />
                                        <span>{item.title}</span>
                                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.children?.map((child) => {
                                            const ChildIcon = child.icon;
                                            const isChildActive = currentPath === child.href;
                                            return (
                                                <SidebarMenuSubItem key={child.title}>
                                                    <SidebarMenuSubButton asChild isActive={isChildActive}>
                                                        <Link to={child.href}>
                                                            {ChildIcon && <ChildIcon className="h-4 w-4 mr-2" />}
                                                            <span>{child.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
