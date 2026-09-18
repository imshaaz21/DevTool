'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import {
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Database,
  Diff,
  FileJson,
  Image as ImageIcon,
  Fingerprint,
  Binary,
  Globe,
  ShieldCheck,
  Terminal,
  GitCompare,
  Calculator,
  Code2
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState('');
  const { isCollapsed, toggleSidebar } = useSidebar();

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const saudiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));

      const hours = saudiTime.getHours().toString().padStart(2, '0');
      const minutes = saudiTime.getMinutes().toString().padStart(2, '0');
      const seconds = saudiTime.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Saudi Fake Data', path: '/saudi-data-generator', icon: Database },
    { name: 'Feature Toggle Diff', path: '/json-comparator', icon: Diff },
    { name: 'JSON Comparison', path: '/json-comparison', icon: Binary },
    { name: 'JSON Diff v2', path: '/json-diff-v2', icon: Binary },
    { name: 'List Compare', path: '/list-compare', icon: GitCompare },
    { name: 'JSON Path & Sum', path: '/json-path-aggregator', icon: Calculator },
    { name: 'JSON Formatter', path: '/json-formatter', icon: FileJson },
    { name: 'HTML Viewer', path: '/html-viewer', icon: Code2 },
    { name: 'Screen Permission', path: '/screen-permission-decode', icon: ShieldCheck },
    { name: 'Base64 Media / PDF', path: '/base64-viewer', icon: ImageIcon },
    { name: 'UUID Generator', path: '/uuid-generator', icon: Fingerprint },
    { name: 'Encoder / Decoder', path: '/encoder-decoder', icon: Binary },
    { name: 'Time Zone', path: '/timezone-converter', icon: Globe },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 transition-[width] duration-200 ease-in-out border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-[#0a0a0c] select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-neutral-200 dark:border-neutral-800">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-2.5 px-1 group">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-sm">
              <Terminal size={15} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  DevTools
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded">
                  Suite
                </span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded">
                  v2
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/" className="mx-auto" title="DevTools Suite v2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
              <Terminal size={15} strokeWidth={2.5} />
            </div>
          </Link>
        )}

        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && (
          <div className="px-2 pb-2 text-[10px] font-medium tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
            Developer Utilities
          </div>
        )}
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Active = isActive(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors group relative ${
                    Active
                      ? 'bg-neutral-100 dark:bg-neutral-800/90 text-neutral-950 dark:text-white font-medium'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    size={16}
                    strokeWidth={Active ? 2 : 1.75}
                    className={`shrink-0 transition-colors ${
                      Active
                        ? 'text-neutral-950 dark:text-white'
                        : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">
                      {item.name}
                    </span>
                  )}
                  {Active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3.5 bg-neutral-900 dark:bg-white rounded-r-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Time & Theme */}
      <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Live AST Time" />
              <span>AST</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">{currentTime}</span>
            </div>
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-emerald-500"
              title={`AST: ${currentTime}`}
            />
            <ThemeToggle />
          </div>
        )}
      </div>
    </aside>
  );
}
