
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';


export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1 flex flex-col">
        {/* AppHeader will be part of each page for dynamic titles */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
