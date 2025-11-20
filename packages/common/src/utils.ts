import { METADATA_FIELDS } from './constants';

export function isValidFRWURL(url: string): boolean {
  return /^frw:\/\/[a-zA-Z0-9]+\/.*$/.test(url);
}

export function isValidPublicKey(key: string): boolean {
  return /^[a-zA-Z0-9]{32,64}$/.test(key);
}

export function extractMetadata(html: string, name: string): string | null {
  const regex = new RegExp(`<meta name="${name}" content="([^"]+)"`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

export function canonicalize(content: string): string {
  return content
    .replace(/[ \t]*<meta name="frw-signature" content="[^"]+">\n?/g, '')
    .trim();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function sanitizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function extractAllMetadata(html: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  for (const field of Object.values(METADATA_FIELDS)) {
    const value = extractMetadata(html, field);
    if (value) {
      metadata[field] = value;
    }
  }
  
  return metadata;
}

export function isHTML(content: string): boolean {
  return /<html[\s>]/i.test(content) || /<!DOCTYPE html>/i.test(content);
}

export function validateDateISO(date: string): boolean {
  return !isNaN(Date.parse(date));
}

export function validateVersion(version: string): boolean {
  return /^\d+\.\d+$/.test(version);
}
