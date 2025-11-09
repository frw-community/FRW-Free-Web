export interface FRWMetadata {
  version: string;
  author: string;
  date: string;
  signature: string;
  keywords?: string;
  license?: string;
  permissions?: string[];
}

export interface FRWContent {
  content: Buffer;
  metadata: FRWMetadata;
  verified: boolean;
}

export interface FRWKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface FRWURL {
  protocol: 'frw';
  publicKey: string;
  path: string;
}

export interface IPFSConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
}

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
}

export interface SandboxOptions {
  timeout?: number;
  sandbox?: Record<string, unknown>;
}

export interface StorageOptions {
  filepath: string;
  autoSave?: boolean;
}

export type FRWErrorCode =
  | 'PROTOCOL_ERROR'
  | 'SIGNATURE_ERROR'
  | 'CONTENT_NOT_FOUND'
  | 'IPFS_ERROR'
  | 'SANDBOX_ERROR'
  | 'VALIDATION_ERROR';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface IPFSAddResult {
  cid: string;
  size: number;
}

export interface IPFSFile {
  path: string;
  content: Buffer;
}

export type PermissionContext =
  | 'ipfs:read'
  | 'ipfs:write'
  | 'storage:local'
  | 'storage:session'
  | 'network:fetch'
  | 'crypto:sign';

export interface PermissionGrant {
  context: PermissionContext;
  granted: boolean;
  grantedAt?: number;
}

export interface DatabaseRecord {
  [key: string]: string | number | null;
}

export interface HistoryEntry {
  id?: number;
  url: string;
  visited_at: number;
  title: string;
}

export interface CachedContent {
  url: string;
  cid: string;
  content: Buffer;
  signature: string;
  fetched_at: number;
}
