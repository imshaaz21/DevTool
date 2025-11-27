'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Saudi Fake Data Generator', path: '/saudi-data-generator' },
    { name: 'Feature Toggle Diff', path: '/json-comparator' },
    { name: 'JSON Comparison', path: '/json-comparison' },
    { name: 'Base64 Image Viewer', path: '/base64-viewer' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">DevTools Suite</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Internal Company Tool</p>
        </div>
        <ThemeToggle />
      </div>
      <nav className="p-4">
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
    </aside>
  );
}
