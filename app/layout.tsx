import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DevTools Suite',
  description: 'Internal company tool with multiple developer utilities',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
