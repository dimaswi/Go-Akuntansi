import React, { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { BreadcrumbItemType } from '@/components/breadcrumbs';

export interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItemType[];
}

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    React.useEffect(() => {
        const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        if (lastBreadcrumb && typeof lastBreadcrumb.title === 'string') {
            document.title = `${lastBreadcrumb.title} - Akuntansi`;
        } else {
            document.title = 'Akuntansi - Enterprise ERP';
        }
    }, [breadcrumbs]);

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset className="overflow-x-hidden flex flex-col min-h-screen bg-background">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white dark:bg-neutral-950">
                    <div className="w-full max-w-full">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
