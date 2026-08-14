import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const rootDir = path.resolve(__dirname, '../..');
const indexHtmlPath = path.join(rootDir, 'index.html');
const html = readFileSync(indexHtmlPath, 'utf-8');
const dom = new JSDOM(html);
const { document } = dom.window;

// index.html doubles as the entry point for the deployed web demo (see
// vercel.json / netlify.toml), so its <head> is what search engines and link
// previews actually see.
describe('SEO: index.html <head> metadata', () => {
  it('declares a document language', () => {
    const lang = document.documentElement.getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  it('declares a UTF-8 charset', () => {
    const charsetMeta = document.querySelector('meta[charset]');
    expect(charsetMeta?.getAttribute('charset')?.toLowerCase()).toBe('utf-8');
  });

  it('has a non-empty, reasonably sized <title>', () => {
    const title = document.querySelector('title')?.textContent?.trim();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(5);
    expect(title.length).toBeLessThanOrEqual(70);
  });

  it('has exactly one <title> element', () => {
    expect(document.querySelectorAll('title').length).toBe(1);
  });

  it('has a meta description within a crawler-friendly length', () => {
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
    expect(description).toBeTruthy();
    expect(description.length).toBeGreaterThan(20);
    expect(description.length).toBeLessThanOrEqual(300);
  });

  it('has a responsive viewport meta tag', () => {
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    expect(viewport).toContain('width=device-width');
  });

  it('does not block search engine indexing via a robots meta tag', () => {
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content')?.toLowerCase() || '';
    expect(robots).not.toContain('noindex');
  });

  it('links a valid web app manifest', () => {
    const manifestHref = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    expect(manifestHref).toBeTruthy();

    const manifestPath = path.join(rootDir, 'public', path.basename(manifestHref));
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.start_url).toBeTruthy();
  });

  it('has a theme-color meta tag matching a valid hex color', () => {
    const themeColor = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
    expect(themeColor).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });

  it('mounts the app into a single root element', () => {
    expect(document.querySelectorAll('#root').length).toBe(1);
  });
});
