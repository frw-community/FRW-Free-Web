export { IPFSClient } from './client';

// Legacy/experimental exports
export { DHTNameRegistry, createNameRecord } from './dht';
export type { NameRecord } from './dht';
export { IPNSRegistryManager, IPNSRegistryPublisher, getOfficialRegistryKey } from './ipns-registry';
export type { Registry, RegistryEntry } from './ipns-registry';
export { SharedRegistryManager, createNameEntry, getBootstrapRegistryCID } from './shared-registry';
export type { SharedRegistry, NameEntry } from './shared-registry';

// PRIMARY: Distributed Registry (Production-ready)
export { DistributedNameRegistry, createDistributedNameRecord } from './distributed-registry';
export type { DistributedNameRecord, ResolvedName, RegistryConfig } from './distributed-registry';

// V2: Quantum-Resistant Registry
export { DistributedRegistryV2 } from './distributed-registry-v2';
export type { DistributedNameRecordAny, ResolvedNameAny } from './distributed-registry-v2';

// PRODUCTION: Global IPNS Registry
export { GlobalRegistryManager, recordToEntry, createEmptyRegistry, bootstrapRegistry, getOfficialRegistryIPNS } from './global-registry';
export type { GlobalRegistry, GlobalNameEntry } from './global-registry';
