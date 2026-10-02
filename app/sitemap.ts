import { MetadataRoute } from 'next';
import { generateSitemapEntries } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemapEntries();
}
