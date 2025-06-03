
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, PieChart, Target, Settings, Coins, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/reports', label: 'Reports', icon: PieChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-semibold font-headline text-sidebar-foreground">BudgetWise</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    className={cn(
                      "w-full justify-start",
                      pathname === item.href ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          {/* Optional: User profile or logout button can go here */}
        </SidebarFooter>
      </Sidebar>
      <AppSidebarTrigger />
    </SidebarProvider>
  );
}

// Separate component for the trigger to be placed in the main layout
export function AppSidebarTrigger() {
    return (
        <div className="md:hidden p-2 fixed top-2 left-2 z-50 bg-background rounded-md shadow-md">
            <SidebarTrigger />
        </div>
    );
}
