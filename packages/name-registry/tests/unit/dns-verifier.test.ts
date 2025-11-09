// Unit tests for DNS Verifier
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DNSVerifier, RESERVED_NAMES, requiresDNSVerification } from '../../src/dns/verifier';
import dns from 'dns/promises';

jest.mock('dns/promises');

describe('DNSVerifier', () => {
    let verifier: DNSVerifier;
    const mockedDns = dns as jest.Mocked<typeof dns>;

    beforeEach(() => {
        verifier = new DNSVerifier();
        jest.clearAllMocks();
    });

    describe('verifyDomainOwnership', () => {
        it('should verify valid TXT record with correct key', async () => {
            mockedDns.resolveTxt.mockResolvedValueOnce([
                ['frw-key=abc123xyz']
            ]);
            
            const result = await verifier.verifyDomainOwnership('example.com', 'abc123xyz');
            
            expect(result.verified).toBe(true);
            expect(result.dnsKey).toBe('abc123xyz');
        });

        it('should try _frw subdomain first', async () => {
            mockedDns.resolveTxt.mockResolvedValueOnce([
                ['frw-key=testkey']
            ]);
            
            await verifier.verifyDomainOwnership('example.com', 'testkey');
            
            expect(mockedDns.resolveTxt).toHaveBeenCalledWith('_frw.example.com');
        });

        it('should fallback to root domain if subdomain fails', async () => {
            mockedDns.resolveTxt
                .mockRejectedValueOnce(new Error('NXDOMAIN'))
                .mockResolvedValueOnce([['frw-key=testkey']]);
            
            const result = await verifier.verifyDomainOwnership('example.com', 'testkey');
            
            expect(result.verified).toBe(true);
            expect(mockedDns.resolveTxt).toHaveBeenCalledWith('_frw.example.com');
            expect(mockedDns.resolveTxt).toHaveBeenCalledWith('example.com');
        });

        it('should reject mismatched public key', async () => {
            mockedDns.resolveTxt.mockResolvedValueOnce([
                ['frw-key=correctkey']
            ]);
            
            const result = await verifier.verifyDomainOwnership('example.com', 'wrongkey');
            
            expect(result.verified).toBe(false);
            expect(result.dnsKey).toBe('correctkey');
        });

        it('should handle missing TXT record', async () => {
            mockedDns.resolveTxt
                .mockRejectedValueOnce(new Error('NXDOMAIN'))
                .mockRejectedValueOnce(new Error('NXDOMAIN'));
            
            const result = await verifier.verifyDomainOwnership('example.com', 'testkey');
            
            expect(result.verified).toBe(false);
            expect(result.error).toContain('No FRW DNS TXT record found');
        });

        it('should handle malformed TXT record', async () => {
            mockedDns.resolveTxt.mockResolvedValueOnce([
                ['something-else=value']
            ]);
            
            const result = await verifier.verifyDomainOwnership('example.com', 'testkey');
            
            expect(result.verified).toBe(false);
            expect(result.error).toContain('No FRW DNS TXT record found');
        });

        it('should timeout after 5 seconds', async () => {
            // Mock slow DNS responses that trigger timeout
            mockedDns.resolveTxt.mockImplementation(() => 
                new Promise<string[][]>((_, reject) => 
                    setTimeout(() => reject(new Error('DNS query timeout')), 6000)
                )
            );
            
            const result = await verifier.verifyDomainOwnership('slow.example.com', 'testkey');
            
            // When both subdomain and root timeout, returns generic error
            expect(result.verified).toBe(false);
            expect(result.error).toBeDefined();
        }, 15000);

        it('should extract key from multiple TXT records', async () => {
            mockedDns.resolveTxt.mockResolvedValueOnce([
                ['unrelated=value'],
                ['frw-key=correctkey'],
                ['another=value']
            ]);
            
            const result = await verifier.verifyDomainOwnership('example.com', 'correctkey');
            
            expect(result.verified).toBe(true);
        });

        it('should validate public key format', async () => {
            mockedDns.resolveTxt.mockResolvedValueOnce([
                ['frw-key=valid123ABC']
            ]);
            
            const result = await verifier.verifyDomainOwnership('example.com', 'valid123ABC');
            
            expect(result.verified).toBe(true);
            expect(result.dnsKey).toMatch(/^[A-Za-z0-9]+$/);
        });
    });

    describe('RESERVED_NAMES', () => {
        it('should detect reserved tech names', () => {
            expect(RESERVED_NAMES.includes('google')).toBe(true);
            expect(RESERVED_NAMES.includes('microsoft')).toBe(true);
            expect(RESERVED_NAMES.includes('apple')).toBe(true);
            expect(RESERVED_NAMES.includes('amazon')).toBe(true);
        });

        it('should detect reserved financial names', () => {
            expect(RESERVED_NAMES.includes('paypal')).toBe(true);
            expect(RESERVED_NAMES.includes('visa')).toBe(true);
            expect(RESERVED_NAMES.includes('mastercard')).toBe(true);
        });

        it('should detect reserved crypto names', () => {
            expect(RESERVED_NAMES.includes('bitcoin')).toBe(true);
            expect(RESERVED_NAMES.includes('ethereum')).toBe(true);
        });

        it('should detect reserved social media names', () => {
            expect(RESERVED_NAMES.includes('twitter')).toBe(true);
            expect(RESERVED_NAMES.includes('facebook')).toBe(true);
            expect(RESERVED_NAMES.includes('instagram')).toBe(true);
            expect(RESERVED_NAMES.includes('youtube')).toBe(true);
        });

        it('should detect reserved generic names', () => {
            expect(RESERVED_NAMES.includes('app')).toBe(true);
            expect(RESERVED_NAMES.includes('web')).toBe(true);
            expect(RESERVED_NAMES.includes('mail')).toBe(true);
            expect(RESERVED_NAMES.includes('shop')).toBe(true);
        });

        it('should allow non-reserved names', () => {
            expect(RESERVED_NAMES.includes('myproject')).toBe(false);
            expect(RESERVED_NAMES.includes('testname')).toBe(false);
            expect(RESERVED_NAMES.includes('custom123')).toBe(false);
        });
    });

    describe('isDomainLikeName', () => {
        it('should detect domain-like names with TLDs', () => {
            expect(DNSVerifier.isDomainLikeName('example.com')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('test.org')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('site.net')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('project.io')).toBe(true);
        });

        it('should detect subdomains', () => {
            expect(DNSVerifier.isDomainLikeName('sub.example.com')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('api.project.io')).toBe(true);
        });

        it('should detect various TLDs', () => {
            expect(DNSVerifier.isDomainLikeName('site.dev')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('app.xyz')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('test.tech')).toBe(true);
        });

        it('should detect reserved names as domain-like', () => {
            expect(DNSVerifier.isDomainLikeName('google')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('microsoft')).toBe(true);
        });

        it('should reject non-domain names', () => {
            expect(DNSVerifier.isDomainLikeName('simpletext')).toBe(false);
            expect(DNSVerifier.isDomainLikeName('123456')).toBe(false);
        });

        it('should reject malformed domains', () => {
            expect(DNSVerifier.isDomainLikeName('.com')).toBe(false);
            expect(DNSVerifier.isDomainLikeName('domain.')).toBe(false);
        });

        it('should be case-insensitive', () => {
            expect(DNSVerifier.isDomainLikeName('EXAMPLE.COM')).toBe(true);
            expect(DNSVerifier.isDomainLikeName('Example.Com')).toBe(true);
        });
    });

    describe('requiresDNSVerification', () => {
        it('should require verification for reserved names', () => {
            expect(requiresDNSVerification('google')).toBe(true);
            expect(requiresDNSVerification('apple')).toBe(true);
        });

        it('should require verification for domain-like names', () => {
            expect(requiresDNSVerification('example.com')).toBe(true);
            expect(requiresDNSVerification('test.org')).toBe(true);
        });

        it('should not require verification for regular names', () => {
            expect(requiresDNSVerification('myproject')).toBe(false);
            expect(requiresDNSVerification('custom123')).toBe(false);
        });

        it('should not require verification for short names', () => {
            expect(requiresDNSVerification('abc')).toBe(false);
            expect(requiresDNSVerification('test')).toBe(false);
        });
    });

    describe('getDNSInstructions', () => {
        it('should return DNS setup instructions', () => {
            const instructions = DNSVerifier.getDNSInstructions('pubkey123', 'example.com');
            
            expect(instructions).toContain('pubkey123');
            expect(instructions).toContain('example.com');
            expect(instructions).toContain('_frw');
            expect(instructions).toContain('frw-key=');
        });

        it('should include both subdomain and root options', () => {
            const instructions = DNSVerifier.getDNSInstructions('key', 'test.com');
            
            expect(instructions).toContain('_frw');
            expect(instructions).toContain('root domain');
        });
    });
});
