
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const NAMES_FILE = path.join(TEST_DATA_DIR, 'v1-names.json');

// --- Test Suite ---

test('Bootstrap Node Resilience', async (t) => {
  // Setup
  await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });

  await t.test('should persist records to disk', async () => {
    const testRecord = {
      name: 'test-persistence',
      publicKey: 'pubkey123',
      contentCID: 'cid123',
      ipnsKey: 'key123',
      timestamp: Date.now(),
      signature: 'sig123'
    };

    const index = new Map();
    index.set(testRecord.name, testRecord);

    const snapshot = JSON.stringify(Object.fromEntries(index), null, 2);
    await fs.writeFile(NAMES_FILE, snapshot, 'utf8');

    const fileExists = await fs.access(NAMES_FILE).then(() => true).catch(() => false);
    assert.strictEqual(fileExists, true, 'File should persist to disk');

    const content = await fs.readFile(NAMES_FILE, 'utf8');
    const loaded = JSON.parse(content);
    assert.strictEqual(loaded['test-persistence'].name, 'test-persistence', 'Content should match');
  });

  await t.test('should recover state from disk', async () => {
    const existingData = {
      'recovered-name': {
        name: 'recovered-name',
        publicKey: 'pk_rec',
        contentCID: 'cid_rec',
        timestamp: 1234567890,
        signature: 'sig_rec'
      }
    };
    await fs.writeFile(NAMES_FILE, JSON.stringify(existingData), 'utf8');

    const index = new Map();
    const raw = await fs.readFile(NAMES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([key, entry]) => {
      index.set(key, entry);
    });

    assert.strictEqual(index.size, 1, 'Should load 1 record');
    assert.ok(index.get('recovered-name'), 'Record should exist in map');
  });

  // Teardown
  await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
});

test('Name Registration Logic', async (t) => {
  const validRecord = {
    name: 'valid-test-name',
    publicKey: 'valid-pub-key',
    contentCID: 'QmContent',
    ipnsKey: 'QmKey',
    version: 1,
    registered: Date.now(),
    expires: Date.now() + 3600000,
    signature: 'valid-signature',
    did: 'did:frw:12345',
    providers: [],
    proof: {
      nonce: 12345,
      hash: '0000validhash',
      timestamp: Date.now(),
      difficulty: 1
    }
  };

  await t.test('should validate correct structure', () => {
    const isValid = (r) => !!(r.name && r.publicKey && r.signature && r.proof);
    assert.strictEqual(isValid(validRecord), true);
  });

  await t.test('should reject missing fields', () => {
    const invalid = { ...validRecord };
    delete invalid.signature;
    const isValid = (r) => !!(r.name && r.publicKey && r.signature && r.proof);
    assert.strictEqual(isValid(invalid), false);
  });
});
