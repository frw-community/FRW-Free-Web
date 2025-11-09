import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

interface FRWConfig {
  defaultKeyPath: string;
  ipfsHost: string;
  ipfsPort: number;
  registeredNames: Record<string, string>; // name -> publicKey
}

const defaults: FRWConfig = {
  defaultKeyPath: join(homedir(), '.frw', 'default.key'),
  ipfsHost: 'localhost',
  ipfsPort: 5001,
  registeredNames: {}
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
