'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import { 
  ChevronLeft, 
  LayoutDashboard, 
  Database, 
  Diff, 
  FileJson, 
  Image as ImageIcon, 
  Fingerprint, 
  Binary, 
  Globe,
  Clock,
  Menu
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const saudiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
      
      const hours = saudiTime.getHours().toString().padStart(2, '0');
      const minutes = saudiTime.getMinutes().toString().padStart(2, '0');
      const seconds = saudiTime.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);

      const day = saudiTime.getDate().toString().padStart(2, '0');
      const month = (saudiTime.getMonth() + 1).toString().padStart(2, '0');
      const year = saudiTime.getFullYear();
      setCurrentDate(`${day}/${month}/${year}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Saudi Fake Data', path: '/saudi-data-generator', icon: Database },
    { name: 'Feature Toggle Diff', path: '/json-comparator', icon: Diff },
    { name: 'JSON Comparison', path: '/json-comparison', icon: Binary },
    { name: 'JSON Formatter', path: '/json-formatter', icon: FileJson },
    { name: 'Base64 Image', path: '/base64-viewer', icon: ImageIcon },
    { name: 'UUID Generator', path: '/uuid-generator', icon: Fingerprint },
    { name: 'Encoder/Decoder', path: '/encoder-decoder', icon: Binary },
    { name: 'Time Zone', path: '/timezone-converter', icon: Globe },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in duration-500">
            <span className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">DevTools</span>
            <span className="text-[10px] font-bold text-slate-400">INTERNAL SUITE</span>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto overflow-x-hidden scrollbar-none">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const Active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group relative ${
                    Active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <div className={`shrink-0 transition-transform duration-300 ${Active ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <Icon size={isCollapsed ? 24 : 20} strokeWidth={Active ? 2.5 : 2} />
                  </div>
                  {!isCollapsed && (
                    <span className={`text-sm font-bold whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300`}>
                      {item.name}
                    </span>
                  )}
                  {Active && !isCollapsed && (
                    <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Time */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-950/50">
        <div className={`flex flex-col items-center justify-center ${isCollapsed ? 'gap-2' : 'gap-1'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
              <Clock size={10} />
              <span>Saudi AST</span>
            </div>
          )}
          <div className={`font-mono font-black text-indigo-600 dark:text-indigo-400 transition-all ${isCollapsed ? 'text-[10px]' : 'text-lg'}`}>
            {currentTime}
          </div>
          <div className={`mt-2 transition-all ${isCollapsed ? 'scale-75' : 'scale-100'}`}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
