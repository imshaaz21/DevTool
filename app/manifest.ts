import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

/**
 * Web app manifest, so the suite can be installed as a standalone app.
 *
 * Every tool already runs client side, so an installed window behaves exactly
 * like the tab it was installed from. No service worker is registered: Chrome
 * dropped that requirement for menu installs (108 mobile, 112 desktop), and a
 * cache layer would need its own invalidation story before it earns its place.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_CONFIG.title,
    short_name: SITE_CONFIG.shortName,
    description: SITE_CONFIG.description,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    // Matches the app's default light theme, so the launch splash does not flash.
    background_color: '#fafafa',
    theme_color: '#fafafa',
    categories: ['developer', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
