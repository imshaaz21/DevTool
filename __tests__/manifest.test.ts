import { existsSync } from 'fs';
import { join } from 'path';
import manifest from '../app/manifest';

describe('web app manifest', () => {
  const result = manifest();

  it('declares the fields browsers need to install the app', () => {
    expect(result.name).toBeTruthy();
    expect(result.short_name).toBe('DevTools');
    expect(result.start_url).toBe('/');
    expect(result.scope).toBe('/');
    expect(result.display).toBe('standalone');
  });

  it('ships both of the icon sizes installers look for', () => {
    const sizes = (result.icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('includes a maskable icon for adaptive launchers', () => {
    const maskable = (result.icons ?? []).filter((icon) => icon.purpose === 'maskable');
    expect(maskable).toHaveLength(1);
    expect(maskable[0].sizes).toBe('512x512');
  });

  it('points every icon at a file that exists', () => {
    for (const icon of result.icons ?? []) {
      const file = join(process.cwd(), 'public', String(icon.src));
      expect(existsSync(file)).toBe(true);
    }
  });

  it('uses PNG icons, which installers accept everywhere', () => {
    for (const icon of result.icons ?? []) {
      expect(icon.type).toBe('image/png');
    }
  });
});
