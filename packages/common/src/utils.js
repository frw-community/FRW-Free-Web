import { METADATA_FIELDS } from './constants.js';
export function isValidFRWURL(url) {
    return /^frw:\/\/[a-zA-Z0-9]+\/.*$/.test(url);
}
export function isValidPublicKey(key) {
    return /^[a-zA-Z0-9]{32,64}$/.test(key);
}
export function extractMetadata(html, name) {
    const regex = new RegExp(`<meta name="${name}" content="([^"]+)"`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}
export function canonicalize(content) {
    return content
        .replace(/<meta name="frw-signature" content="[^"]+">\s*/g, '')
        .trim();
}
export function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function sanitizePath(path) {
    return path.startsWith('/') ? path : `/${path}`;
}
export function extractAllMetadata(html) {
    const metadata = {};
    for (const field of Object.values(METADATA_FIELDS)) {
        const value = extractMetadata(html, field);
        if (value) {
            metadata[field] = value;
        }
    }
    return metadata;
}
export function isHTML(content) {
    return /<html[\s>]/i.test(content) || /<!DOCTYPE html>/i.test(content);
}
export function validateDateISO(date) {
    return !isNaN(Date.parse(date));
}
export function validateVersion(version) {
    return /^\d+\.\d+$/.test(version);
}
//# sourceMappingURL=utils.js.map