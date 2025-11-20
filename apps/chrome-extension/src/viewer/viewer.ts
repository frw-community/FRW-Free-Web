/**
 * FRW Viewer Page
 * Displays content loaded from IPFS
 */

import DOMPurify from 'dompurify';
import { FRWResolver, type NameRecord } from '../core/resolver';
import { IPFSFetcher } from '../core/ipfs-fetcher';
import { verifyContent, type VerificationResult } from '../core/verification';

const resolver = new FRWResolver();
const fetcher = new IPFSFetcher();

// Get URL parameters
const params = new URLSearchParams(window.location.search);
const name = params.get('name');
const path = params.get('path') || '/';
const error = params.get('error');

// UI Elements
const loadingEl = document.getElementById('loading')!;
const errorEl = document.getElementById('error')!;
const errorMessageEl = document.getElementById('error-message')!;
const contentEl = document.getElementById('content')!;
const verificationEl = document.getElementById('verification')!;
const nameDisplayEl = document.getElementById('name-display')!;
const authorEl = document.getElementById('author')!;
const dateEl = document.getElementById('date')!;

/**
 * Initialize viewer
 */
async function init() {
  // Show error if provided
  if (error) {
    showError(error);
    return;
  }
  
  // Validate name
  if (!name) {
    showError('No name specified in URL');
    return;
  }
  
  try {
    // Update title
    document.title = `frw://${name}${path} - FRW Protocol`;
    nameDisplayEl.textContent = name;
    
    console.log(`[Viewer] Loading: frw://${name}${path}`);
    
    // Step 1: Resolve name to CID
    loadingEl.textContent = `Resolving name: ${name}...`;
    const record = await resolver.resolveName(name);
    
    if (!record) {
      showError(`Name "${name}" not found in distributed registry`);
      return;
    }
    
    console.log('[Viewer] Resolved:', record);
    
    // Update verification badge
    showVerification(record);
    
    // Step 2: Fetch content from IPFS
    loadingEl.textContent = `Fetching content from IPFS...`;
    const result = await fetcher.fetch(record.contentCID, path);
    
    console.log('[Viewer] Content fetched:', result);
    
    // Step 3: Verify content signature (if HTML)
    let verificationResult: VerificationResult | null = null;
    if (result.mimeType.includes('html') && typeof result.content === 'string') {
      loadingEl.textContent = `Verifying content signature...`;
      verificationResult = await verifyContent(result.content, record);
      console.log('[Viewer] Verification result:', verificationResult);
      
      if (!verificationResult.valid) {
        showError(`Content signature verification failed: ${verificationResult.error || 'Invalid signature'}`);
        return;
      }
    }
    
    // Step 4: Display content
    await displayContent(result.content, result.mimeType, record.contentCID);
    
    // Show verification badge with V2 indicator
    if (verificationResult?.quantumSafe) {
      verificationEl.classList.add('quantum-safe');
      const badge = document.createElement('span');
      badge.className = 'quantum-badge';
      badge.textContent = '🛡️ Quantum-Safe';
      badge.title = 'Protected against quantum computer attacks';
      verificationEl.appendChild(badge);
    }
    verificationEl.style.display = 'flex';
    
  } catch (err) {
    console.error('[Viewer] Error:', err);
    showError(err instanceof Error ? err.message : 'Unknown error occurred');
  }
}

/**
 * Show verification badge
 */
function showVerification(record: NameRecord) {
  // Handle V2 records with different field names
  const publicKey = record.publicKey_dilithium3 || record.publicKey;
  const timestamp = record.version === 2 
    ? (record as any).registered || record.timestamp 
    : record.timestamp;
  
  authorEl.textContent = `@${publicKey.substring(0, 8)}...`;
  
  const date = new Date(timestamp);
  dateEl.textContent = date.toLocaleDateString();
  
  // Show quantum-safe indicator for V2 records
  if (record.version === 2) {
    verificationEl.classList.add('quantum-safe');
    verificationEl.setAttribute('data-quantum', 'true');
  }
}

/**
 * Preload all images in HTML and convert to data URLs
 */
async function preloadImagesInHtml(html: string, cid: string): Promise<string> {
  console.log('[FRW Viewer] Preloading images...');
  
  // Find all img src attributes
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const matches = [...html.matchAll(imgRegex)];
  
  if (matches.length === 0) {
    console.log('[FRW Viewer] No images found');
    return html;
  }
  
  console.log('[FRW Viewer] Found', matches.length, 'images to preload');
  
  const fetcher = new IPFSFetcher();
  
  for (const match of matches) {
    const originalSrc = match[1];
    
    // Skip if already data URL or absolute URL
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      continue;
    }
    
    console.log('[FRW Viewer] Loading image:', originalSrc);
    
    try {
      // Fetch image from IPFS
      const result = await fetcher.fetch(cid, originalSrc);
      
      if (result.content) {
        // Convert to base64 data URL
        const buffer = result.content instanceof ArrayBuffer ? result.content : new TextEncoder().encode(result.content);
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${result.mimeType};base64,${base64}`;
        
        // Replace src with data URL
        html = html.replace(match[0], match[0].replace(originalSrc, dataUrl));
        console.log('[FRW Viewer] Loaded image:', originalSrc);
      }
    } catch (error) {
      console.warn('[FRW Viewer] Failed to load image:', originalSrc, error);
    }
  }
  
  console.log('[FRW Viewer] All images preloaded');
  return html;
}

/**
 * Display content based on MIME type
 */
async function displayContent(content: ArrayBuffer | string, mimeType: string, cid: string) {
  loadingEl.style.display = 'none';
  contentEl.style.display = 'block';
  
  if (mimeType.includes('html')) {
    // HTML content - preload images first
    let htmlContent = content as string;
    htmlContent = await preloadImagesInHtml(htmlContent, cid);

    // Security: Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: ['html', 'head', 'body', 'meta', 'title', 'link', 'style',
                     'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                     'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
                     'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 'code', 'pre', 'blockquote',
                     'form', 'input', 'button', 'label', 'select', 'option', 'textarea'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'type',
                     'name', 'value', 'placeholder', 'target', 'rel'],
      KEEP_CONTENT: true,
      ALLOW_DATA_ATTR: false,
      // Allow CSS in style tags (safe in sandboxed iframe)
      FORCE_BODY: false,
      WHOLE_DOCUMENT: true
    });

    // Display in iframe with secure sandbox
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    // Security: Do NOT combine allow-scripts + allow-same-origin as it breaks sandboxing
    iframe.sandbox.add('allow-scripts', 'allow-forms');

    // Use srcdoc instead of document.write() to avoid cross-origin issues
    iframe.srcdoc = sanitizedHtml;
    contentEl.appendChild(iframe);
  } else if (mimeType.startsWith('text/')) {
    // Text content
    const pre = document.createElement('pre');
    pre.style.padding = '20px';
    pre.style.overflow = 'auto';
    pre.textContent = content as string;
    contentEl.appendChild(pre);
  } else if (mimeType.startsWith('image/')) {
    // Image content
    const img = document.createElement('img');
    const blob = new Blob([content], { type: mimeType });
    img.src = URL.createObjectURL(blob);
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    contentEl.appendChild(img);
  } else {
    // Binary/unknown content
    const info = document.createElement('div');
    info.style.padding = '20px';
    info.innerHTML = `
      <h2>Binary Content</h2>
      <p>Content Type: ${mimeType}</p>
      <p>Size: ${typeof content === 'string' ? content.length : content.byteLength} bytes</p>
      <p>This content type cannot be displayed directly in the browser.</p>
    `;
    contentEl.appendChild(info);
  }
}

/**
 * Show error message
 */
function showError(message: string) {
  loadingEl.style.display = 'none';
  errorEl.style.display = 'block';
  errorMessageEl.textContent = message;
}

// Initialize on load
init();
