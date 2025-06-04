
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppDataProvider } from '@/contexts/app-data-context';
import { Loader2 } from 'lucide-react'; // Import Loader2
import React from 'react'; // Import React for Suspense

export const metadata: Metadata = {
  title: 'BudgetWise',
  description: 'Manage your finances with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-clip">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppDataProvider>
          {children}
          <Toaster />
        </AppDataProvider>
      </body>
    </html>
  );
}
