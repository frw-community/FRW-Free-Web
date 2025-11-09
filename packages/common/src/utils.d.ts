export declare function isValidFRWURL(url: string): boolean;
export declare function isValidPublicKey(key: string): boolean;
export declare function extractMetadata(html: string, name: string): string | null;
export declare function canonicalize(content: string): string;
export declare function formatBytes(bytes: number): string;
export declare function sleep(ms: number): Promise<void>;
export declare function sanitizePath(path: string): string;
export declare function extractAllMetadata(html: string): Record<string, string>;
export declare function isHTML(content: string): boolean;
export declare function validateDateISO(date: string): boolean;
export declare function validateVersion(version: string): boolean;
//# sourceMappingURL=utils.d.ts.map