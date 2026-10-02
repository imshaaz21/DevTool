import { MetadataRoute } from 'next';
import { getRobotsConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return getRobotsConfig();
}
