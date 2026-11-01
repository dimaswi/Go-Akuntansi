import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { BreadcrumbItemType } from '@/components/breadcrumbs';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItemType[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, breadcrumbs = [] }) => {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset className="overflow-x-hidden flex flex-col min-h-screen">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="mx-auto max-w-7xl w-full">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AppLayout;
