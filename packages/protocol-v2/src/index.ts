export interface RecordV2 {
  name: string;
  contentCID: string;
  ipnsKey: string;
  publicKey_dilithium3: string; // base64 or hex
  publicKey_ed25519: string; // base64
  signature_dilithium3: string;
  signature_ed25519: string;
  version: 2;
  proof: any;
}

export function createRecordV2(name: string, contentCID: string, ipnsKey: string, keyPair: any, proof: any): RecordV2 {
  return {
    name,
    contentCID,
    ipnsKey,
    publicKey_dilithium3: Buffer.from(keyPair.publicKey.dilithium3).toString('base64'),
    publicKey_ed25519: Buffer.from(keyPair.publicKey.ed25519).toString('base64'),
    signature_dilithium3: '', // To be signed
    signature_ed25519: '',
    version: 2,
    proof
  };
}

export function toJSON(record: RecordV2): string {
  return JSON.stringify(record);
}
