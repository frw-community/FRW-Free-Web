import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

export interface NameRegistration {
  publicKey: string;
  registered: number;
  dnsVerified?: boolean;
  dnsVerifiedAt?: number;
  domain?: string;
}

interface FRWConfig {
  defaultKeyPath: string;
  ipfsHost: string;
  ipfsPort: number;
  registeredNames: Record<string, string>; // name -> publicKey (legacy)
  registrations: Record<string, NameRegistration>; // name -> full registration data
}

const defaults: FRWConfig = {
  defaultKeyPath: join(homedir(), '.frw', 'default.key'),
  ipfsHost: 'localhost',
  ipfsPort: 5001,
  registeredNames: {},
  registrations: {}
};

export const config = new Conf<FRWConfig>({
  projectName: 'frw',
  defaults,
  cwd: join(homedir(), '.frw')
});

export function getConfigPath(): string {
  return join(homedir(), '.frw');
}

export function getKeysPath(): string {
  return join(getConfigPath(), 'keys');
}
