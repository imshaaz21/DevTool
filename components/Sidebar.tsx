'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Saudi Arabia timezone (GMT+3)
      const saudiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));

      // Format time as HH:MM:SS (24h format)
      const hours = saudiTime.getHours().toString().padStart(2, '0');
      const minutes = saudiTime.getMinutes().toString().padStart(2, '0');
      const seconds = saudiTime.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);

      // Format date as DD/MM/YYYY
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
    { name: 'Home', path: '/' },
    { name: 'Saudi Fake Data Generator', path: '/saudi-data-generator' },
    { name: 'Feature Toggle Diff', path: '/json-comparator' },
    { name: 'JSON Comparison', path: '/json-comparison' },
    { name: 'JSON Formatter', path: '/json-formatter' },
    { name: 'Base64 Image Viewer', path: '/base64-viewer' },
    { name: 'Encoder/Decoder & Hash', path: '/encoder-decoder' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">DevTools Suite</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Internal Company Tool</p>
        </div>
        <ThemeToggle />
      </div>
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block p-2 rounded-md ${isActive(item.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Saudi Time Display */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saudi Arabia Time</div>
          <div className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {currentTime}
          </div>
          <div className="text-sm font-mono text-gray-600 dark:text-gray-300 mt-1">
            {currentDate}
          </div>
        </div>
      </div>
    </aside>
  );
}
