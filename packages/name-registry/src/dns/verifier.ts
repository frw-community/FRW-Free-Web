// DNS Verification for Name Registration

import dns from 'dns/promises';

export class DNSVerifier {
    private readonly TIMEOUT = 5000; // 5 seconds
    
    /**
     * Verify domain ownership via DNS TXT record
     * Checks for frw-key=<publicKey> in DNS
     */
    async verifyDomainOwnership(
        domain: string,
        publicKey: string
    ): Promise<{ verified: boolean; dnsKey?: string; error?: string }> {
        try {
            // Try _frw subdomain first (recommended)
            const subdomainResult = await this.queryDNS(`_frw.${domain}`);
            if (subdomainResult.found && subdomainResult.publicKey) {
                return {
                    verified: subdomainResult.publicKey === publicKey,
                    dnsKey: subdomainResult.publicKey
                };
            }
            
            // Fallback to root domain
            const rootResult = await this.queryDNS(domain);
            if (rootResult.found && rootResult.publicKey) {
                return {
                    verified: rootResult.publicKey === publicKey,
                    dnsKey: rootResult.publicKey
                };
            }
            
            return {
                verified: false,
                error: 'No FRW DNS TXT record found'
            };
            
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                verified: false,
                error: `DNS query failed: ${message}`
            };
        }
    }
    
    /**
     * Query DNS TXT records with timeout
     */
    private async queryDNS(
        domain: string
    ): Promise<{ found: boolean; publicKey?: string }> {
        try {
            const records = await Promise.race([
                dns.resolveTxt(domain),
                this.timeout()
            ]);
            

            
            if (!records || records.length === 0) {
                return { found: false };
            }
            
            const publicKey = this.extractPublicKey(records);
            return {
                found: !!publicKey,
                publicKey: publicKey || undefined
            };
            
        } catch (error) {
            // DNS errors are common (domain doesn't exist, no TXT records, etc.)
            return { found: false };
        }
    }
    
    /**
     * Extract public key from DNS TXT records
     */
    private extractPublicKey(records: string[][]): string | null {
        const flatRecords = records.flat();
        
        // Look for frw-key= in any TXT record
        for (const record of flatRecords) {
            if (record.includes('frw-key=')) {
                const match = record.match(/frw-key=([A-Za-z0-9]+)/);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        
        return null;
    }
    
    /**
     * Timeout helper
     */
    private async timeout(): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('DNS query timeout')), this.TIMEOUT);
        });
    }
    
    /**
     * Check if name looks like a domain
     */
    static isDomainLikeName(name: string): boolean {
        // Has TLD pattern (e.g., something.com, example.org)
        const hasTLD = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(name);
        
        if (hasTLD) {
            return true;
        }
        
        // Check against reserved names list
        return RESERVED_NAMES.includes(name.toLowerCase());
    }
    
    /**
     * Get DNS TXT record format instruction
     */
    static getDNSInstructions(publicKey: string, name: string): string {
        return `
Add this DNS TXT record to ${name}:

Record Type: TXT
Name: _frw
Value: frw-key=${publicKey}
TTL: 3600 (or default)

Alternative: Add to root domain
Name: @ or ${name}
Value: frw-key=${publicKey}

After adding, wait 5-10 minutes for DNS propagation, then try again.
`.trim();
    }
}

/**
 * Reserved names requiring DNS verification
 * Common brands, companies, and services
 */
export const RESERVED_NAMES = [
    // Tech companies
    'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta',
    'twitter', 'x', 'instagram', 'youtube', 'netflix', 'spotify',
    'adobe', 'oracle', 'ibm', 'intel', 'amd', 'nvidia',
    'samsung', 'sony', 'huawei', 'xiaomi', 'lenovo',
    
    // Social & Communication
    'whatsapp', 'telegram', 'discord', 'slack', 'zoom',
    'linkedin', 'reddit', 'pinterest', 'snapchat', 'tiktok',
    
    // Finance
    'paypal', 'visa', 'mastercard', 'amex', 'stripe',
    'coinbase', 'binance', 'kraken', 'bitcoin', 'ethereum',
    
    // E-commerce
    'ebay', 'alibaba', 'walmart', 'target', 'bestbuy',
    'shopify', 'etsy', 'aliexpress',
    
    // Media
    'cnn', 'bbc', 'nytimes', 'wsj', 'reuters',
    'disney', 'warner', 'paramount', 'hbo',
    
    // Services
    'uber', 'lyft', 'airbnb', 'booking', 'expedia',
    'dropbox', 'github', 'gitlab', 'stackoverflow',
    
    // Brands
    'nike', 'adidas', 'puma', 'cocacola', 'pepsi',
    'mcdonalds', 'starbucks', 'subway', 'kfc',
    
    // Government & Organizations
    'gov', 'nasa', 'fbi', 'cia', 'un', 'who',
    'wikipedia', 'mozilla', 'linux', 'ubuntu',
    
    // Generic high-value
    'app', 'web', 'mail', 'shop', 'store', 'bank',
    'news', 'blog', 'forum', 'chat', 'video',
    'music', 'game', 'crypto', 'nft', 'dao'
];

/**
 * Check if name requires DNS verification
 */
export function requiresDNSVerification(name: string): boolean {
    return DNSVerifier.isDomainLikeName(name);
}
