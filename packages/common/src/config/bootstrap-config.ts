/**
 * Bootstrap Node Configuration
 * 
 * DEFAULT_NODES: Hardcoded foundation nodes (like Bitcoin seed nodes)
 * These are trusted, stable nodes maintained by the FRW foundation
 * 
 * Users can override/extend via config file:
 * ~/.frw/config.json:
 * {
 *   "bootstrapNodes": ["http://my-node:3100", ...]
 * }
 */

export interface BootstrapConfig {
  /**
   * Use default foundation nodes
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
 * Foundation bootstrap nodes - hardcoded for reliability
 * These are maintained by FRW and provide 99.9% uptime
 */
export const DEFAULT_BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',  // Swiss Bootstrap #1
  'http://83.228.213.45:3100',   // Swiss Bootstrap #2
  'http://83.228.213.240:3100',  // Swiss Bootstrap #3
  'http://83.228.214.72:3100',   // Swiss Bootstrap #4
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
