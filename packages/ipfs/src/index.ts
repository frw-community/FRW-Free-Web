export { IPFSClient } from './client.js';

// Legacy/experimental exports
export { DHTNameRegistry, createNameRecord } from './dht.js';
export type { NameRecord } from './dht.js';
export { IPNSRegistryManager, IPNSRegistryPublisher, getOfficialRegistryKey } from './ipns-registry.js';
export type { Registry, RegistryEntry } from './ipns-registry.js';
export { SharedRegistryManager, createNameEntry, getBootstrapRegistryCID } from './shared-registry.js';
export type { SharedRegistry, NameEntry } from './shared-registry.js';

// PRIMARY: Distributed Registry (Production-ready)
export { DistributedNameRegistry, createDistributedNameRecord } from './distributed-registry.js';
export type { DistributedNameRecord, ResolvedName, RegistryConfig } from './distributed-registry.js';

// V2: Quantum-Resistant Registry
export { DistributedRegistryV2 } from './distributed-registry-v2.js';
export type { DistributedNameRecordAny, ResolvedNameAny } from './distributed-registry-v2.js';

// PRODUCTION: Global IPNS Registry
export { GlobalRegistryManager, recordToEntry, createEmptyRegistry, bootstrapRegistry, getOfficialRegistryIPNS } from './global-registry.js';
export type { GlobalRegistry, GlobalNameEntry } from './global-registry.js';
