'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { SidebarProvider } from '@/components/SidebarContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        {children}
        <Toaster position="bottom-right" />
      </SidebarProvider>
    </ThemeProvider>
  );
}
