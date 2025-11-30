/**
 * Bootstrap Node Configuration
 * 
 * DEFAULT_NODES: Hardcoded default nodes (like Bitcoin seed nodes)
 * These are stable nodes providing distributed name resolution
 * 
 * Users can override/extend via config file:
 * ~/.frw/config.json:
 * {
 *   "bootstrapNodes": ["http://my-node:3100", ...]
 * }
 */

export interface BootstrapConfig {
  /**
   * Use default nodes
   */
  useDefaults: boolean;
  
  /**
   * Additional custom bootstrap nodes
   */
  customNodes: string[];
  
  /**
   * Completely override default nodes (advanced users only)
   */
  overrideDefaults?: string[];
}

/**
 * Default bootstrap nodes - hardcoded for reliability
 * Distributed nodes providing 99.9% uptime
 */
export const DEFAULT_BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',
  'http://83.228.213.45:3100',
  'http://83.228.213.240:3100',
  'http://83.228.214.72:3100',
  'http://165.73.244.107:3100',
  'http://165.73.244.74:3100',
  'http://155.117.46.244:3100'
];

/**
 * Get bootstrap nodes based on config
 */
export function getBootstrapNodes(config?: Partial<BootstrapConfig>): string[] {
  const cfg: BootstrapConfig = {
    useDefaults: true,
    customNodes: [],
    ...config
  };

  // If user completely overrides, use their nodes only
  if (cfg.overrideDefaults && cfg.overrideDefaults.length > 0) {
    console.log('[Bootstrap] Using custom bootstrap nodes (defaults disabled)');
    return cfg.overrideDefaults;
  }

  // Otherwise: defaults + custom
  const nodes: string[] = [];
  
  if (cfg.useDefaults) {
    nodes.push(...DEFAULT_BOOTSTRAP_NODES);
  }
  
  if (cfg.customNodes.length > 0) {
    nodes.push(...cfg.customNodes);
    console.log(`[Bootstrap] Added ${cfg.customNodes.length} custom nodes`);
  }

  // Add localhost for development
  if (!nodes.includes('http://localhost:3100')) {
    nodes.push('http://localhost:3100');
  }

  return nodes;
}

/**
 * Validate bootstrap node URL
 */
export function validateBootstrapNode(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && 
           parsed.port !== '';
  } catch {
    return false;
  }
}
