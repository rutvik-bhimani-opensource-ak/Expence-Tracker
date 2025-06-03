
'use client';
import { Button } from '@/components/ui/button';
import { UserCircle, Bell } from 'lucide-react';
import { AppSidebarTrigger } from './app-sidebar'; // Import the trigger


export function AppHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center gap-4">
         <div className="md:hidden"> {/* Only show trigger on mobile */}
          <AppSidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold font-headline">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="User Profile">
          <UserCircle className="w-6 h-6" />
        </Button>
      </div>
    </header>
  );
}
