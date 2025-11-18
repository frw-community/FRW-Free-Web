// Fast integration tests for Protocol V2

import { generateKeyPairV2 } from '@frw/crypto-pq';
import { generatePOWV2 } from '@frw/pow-v2';
import { createRecordV2, verifyRecordV2, RecordManagerV2 } from '../index';

describe('Protocol V2 - Integration Tests', () => {
  describe('createRecordV2 and verifyRecordV2', () => {
    it('should create and verify complete V2 record', async () => {
      // Use long name for instant PoW
      const name = 'quicktestnamev2long';
      const contentCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const ipnsKey = 'k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8';
      
      // Generate keypair
      const keyPair = generateKeyPairV2();
      
      // Generate PoW
      const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3);
      
      // Create record
      const record = createRecordV2(name, contentCID, ipnsKey, keyPair, proof);
      
      // Verify structure
      expect(record.version).toBe(2);
      expect(record.name).toBe(name);
      expect(record.contentCID).toBe(contentCID);
      expect(record.did).toBe(keyPair.did);
      expect(record.recordVersion).toBe(1);
      expect(record.previousHash_sha3).toBeNull(); // Genesis record
      
      // Verify cryptographically
      const verification = await verifyRecordV2(record);
      
      expect(verification.valid).toBe(true);
      expect(verification.pqSecure).toBe(true);
      expect(verification.errors).toHaveLength(0);
      expect(verification.checks.pow).toBe(true);
      expect(verification.checks.signature_dilithium3).toBe(true);
      expect(verification.checks.name_format).toBe(true);
      expect(verification.checks.expiration).toBe(true);
    }, 10000); // 10 second timeout

    it('should reject record with invalid PoW', async () => {
      const name = 'quicktestnamev2long';
      const contentCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const ipnsKey = 'k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8';
      
      const keyPair = generateKeyPairV2();
      const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3);
      
      // Corrupt PoW
      proof.hash[0] ^= 0xFF;
      
      const record = createRecordV2(name, contentCID, ipnsKey, keyPair, proof);
      const verification = await verifyRecordV2(record);
      
      expect(verification.valid).toBe(false);
      expect(verification.checks.pow).toBe(false);
    }, 10000);

    it('should reject record with corrupted signature', async () => {
      const name = 'quicktestnamev2long';
      const contentCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const ipnsKey = 'k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8';
      
      const keyPair = generateKeyPairV2();
      const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3);
      
      const record = createRecordV2(name, contentCID, ipnsKey, keyPair, proof);
      
      // Corrupt Dilithium3 signature
      record.signature_dilithium3[0] ^= 0xFF;
      
      const verification = await verifyRecordV2(record);
      
      expect(verification.valid).toBe(false);
      expect(verification.pqSecure).toBe(false);
    }, 10000);

    it('should reject invalid name format', async () => {
      const name = 'Invalid-Name!@#'; // Invalid characters
      const contentCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const ipnsKey = 'k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8';
      
      const keyPair = generateKeyPairV2();
      const proof = await generatePOWV2('validnameforlongpow', keyPair.publicKey_dilithium3);
      
      expect(() => {
        createRecordV2(name, contentCID, ipnsKey, keyPair, proof);
      }).toThrow();
    }, 10000);
  });

  describe('Record updates with hash chain', () => {
    it('should create update record with valid hash chain', async () => {
      const name = 'quicktestnamev2long';
      const contentCID1 = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const contentCID2 = 'bafkreih2akiscaildvqyqzci3c5xtyp3u7nf7i6tqm7gl6i6p3azlqjxh4';
      const ipnsKey = 'k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8';
      
      const keyPair = generateKeyPairV2();
      const proof1 = await generatePOWV2(name, keyPair.publicKey_dilithium3);
      
      // Create genesis record
      const record1 = createRecordV2(name, contentCID1, ipnsKey, keyPair, proof1);
      
      // Wait a bit for timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const proof2 = await generatePOWV2(name, keyPair.publicKey_dilithium3);
      
      // Create update record (use RecordManagerV2 for updates)
      const manager = new RecordManagerV2();
      const record2 = manager.createRecord(name, contentCID2, ipnsKey, keyPair, proof2, record1);
      
      expect(record2.recordVersion).toBe(2);
      expect(record2.previousHash_sha3).not.toBeNull();
      
      // Verify both records
      const verification1 = await verifyRecordV2(record1);
      const verification2 = await verifyRecordV2(record2, record1);
      
      expect(verification1.valid).toBe(true);
      expect(verification2.valid).toBe(true);
      expect(verification2.checks.hash_chain).toBe(true);
    }, 15000);
  });
});
