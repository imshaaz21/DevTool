'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  width: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load state from localStorage on mount. Reads are wrapped because blocked
  // site data makes localStorage throw on access rather than return null.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Keep the default expanded state.
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    try {
      localStorage.setItem('sidebar-collapsed', String(newState));
    } catch {
      // The toggle still applies for this session.
    }
  };

  const width = isCollapsed ? '80px' : '256px'; // 20 units (w-20) vs 64 units (w-64)

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, width }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
