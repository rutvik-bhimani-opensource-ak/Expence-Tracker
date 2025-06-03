import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppDataProvider } from '@/contexts/app-data-context';
import { Loader2 } from 'lucide-react'; // Import Loader2
import React from 'react'; // Import React for Suspense

export const metadata: Metadata = {
  title: 'FrugalFlow',
  description: 'Manage your finances with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppDataProvider>
          {/* You might want a global loading indicator while Firebase connects initially */}
          {/* For simplicity, AppDataProvider itself handles an 'isLoaded' state
              but a Suspense boundary here or a global loader could be an option too.
              The context now has `isDataLoading`. We can use that for a basic loader.
           */}
          {children}
          <Toaster />
        </AppDataProvider>
      </body>
    </html>
  );
}
