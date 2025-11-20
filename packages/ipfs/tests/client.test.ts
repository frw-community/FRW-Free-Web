import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { IPFSClient } from '../src/client';

// Mock the entire ipfs-http-client module at the module level
jest.mock('ipfs-http-client', () => ({
  create: jest.fn()
}), { virtual: true });

// Import after mock setup
import { create as mockCreate } from 'ipfs-http-client';

describe('IPFSClient', () => {
  let client: IPFSClient;
  let mockIPFS: any;
  const testConfig = {
    host: 'localhost',
    port: 5001,
    protocol: 'http' as const
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock IPFS client with proper typing
    const mockId = jest.fn();
    // @ts-ignore - Jest mock type inference issue
    mockId.mockResolvedValue({ id: 'test-peer-id' });
    
    const mockPinAdd = jest.fn();
    // @ts-ignore - Jest mock type inference issue
    mockPinAdd.mockResolvedValue(void 0);
    
    const mockPinRm = jest.fn();
    // @ts-ignore - Jest mock type inference issue
    mockPinRm.mockResolvedValue(void 0);
    
    mockIPFS = {
      id: mockId,
      add: jest.fn(),
      addAll: jest.fn(),
      cat: jest.fn(),
      pin: {
        add: mockPinAdd,
        rm: mockPinRm,
        ls: jest.fn()
      },
      name: {
        resolve: jest.fn(),
        publish: jest.fn()
      }
    };

    // Setup the mock
    (mockCreate as jest.Mock).mockReturnValue(mockIPFS);

    client = new IPFSClient(testConfig);
  });

  describe('init', () => {
    test('should initialize client successfully', async () => {
      const result = await client.init();
      
      expect(result).toBe(true);
      expect(mockIPFS.id).toHaveBeenCalled();
    });

    test('should throw IPFSError on initialization failure', async () => {
      mockIPFS.id.mockRejectedValue(new Error('Connection failed'));
      
      await expect(client.init()).rejects.toThrow('IPFS initialization failed');
    });

    test('should use provided config', async () => {
      await client.init();
      
      expect(mockCreate).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5001,
        protocol: 'http'
      });
    });
  });

  describe('add', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should add string content', async () => {
      const testContent = 'Hello IPFS';
      mockIPFS.add.mockResolvedValue({
        cid: { toString: () => 'QmTest123' },
        size: 10
      });

      const result = await client.add(testContent);

      expect(result.cid).toBe('QmTest123');
      expect(result.size).toBe(10);
      expect(mockIPFS.add).toHaveBeenCalledWith(testContent);
    });

    test('should add buffer content', async () => {
      const testBuffer = Buffer.from('test data');
      mockIPFS.add.mockResolvedValue({
        cid: { toString: () => 'QmBuffer456' },
        size: 9
      });

      const result = await client.add(testBuffer);

      expect(result.cid).toBe('QmBuffer456');
      expect(result.size).toBe(9);
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.add('test')).rejects.toThrow(
        'IPFS client not initialized'
      );
    });

    test('should handle add errors', async () => {
      mockIPFS.add.mockRejectedValue(new Error('Add failed'));
      
      await expect(client.add('test')).rejects.toThrow();
    });
  });

  describe('addFile', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should add file with path', async () => {
      const testPath = 'test.txt';
      const testContent = Buffer.from('file content');
      mockIPFS.add.mockResolvedValue({
        cid: { toString: () => 'QmFile789' }
      });

      const result = await client.addFile(testPath, testContent);

      expect(result).toBe('QmFile789');
      expect(mockIPFS.add).toHaveBeenCalledWith({
        path: testPath,
        content: testContent
      });
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(
        uninitializedClient.addFile('test.txt', Buffer.from('test'))
      ).rejects.toThrow('IPFS client not initialized');
    });
  });

  describe('addDirectory', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should add directory with multiple files', async () => {
      const files = [
        { path: 'file1.txt', content: Buffer.from('content1') },
        { path: 'file2.txt', content: Buffer.from('content2') }
      ];

      async function* mockGenerator() {
        yield { cid: { toString: () => 'QmFile1' } };
        yield { cid: { toString: () => 'QmFile2' } };
        yield { cid: { toString: () => 'QmDir' } };
      }

      mockIPFS.addAll.mockReturnValue(mockGenerator());

      const result = await client.addDirectory(files);

      expect(result).toBe('QmDir');
      expect(mockIPFS.addAll).toHaveBeenCalledWith(files, { wrapWithDirectory: true });
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(
        uninitializedClient.addDirectory([])
      ).rejects.toThrow('IPFS client not initialized');
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should get content by CID', async () => {
      const testCid = 'QmTest';
      const testData = Buffer.from('retrieved content');

      async function* mockGenerator() {
        yield testData;
      }

      mockIPFS.cat.mockReturnValue(mockGenerator());

      const result = await client.get(testCid);

      expect(result).toEqual(testData);
      expect(mockIPFS.cat).toHaveBeenCalledWith(testCid);
    });

    test('should concatenate multiple chunks', async () => {
      const testCid = 'QmTest';
      const chunk1 = Buffer.from('part1');
      const chunk2 = Buffer.from('part2');

      async function* mockGenerator() {
        yield chunk1;
        yield chunk2;
      }

      mockIPFS.cat.mockReturnValue(mockGenerator());

      const result = await client.get(testCid);

      expect(result).toEqual(Buffer.concat([chunk1, chunk2]));
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.get('QmTest')).rejects.toThrow(
        'IPFS client not initialized'
      );
    });
  });

  describe('getFile', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should get file from directory', async () => {
      const testCid = 'QmDir';
      const testPath = 'subdir/file.txt';
      const testData = Buffer.from('file content');

      async function* mockGenerator() {
        yield testData;
      }

      mockIPFS.cat.mockReturnValue(mockGenerator());

      const result = await client.getFile(testCid, testPath);

      expect(result).toEqual(testData);
      expect(mockIPFS.cat).toHaveBeenCalledWith(`${testCid}/${testPath}`);
    });
  });

  describe('pin', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should pin content', async () => {
      const testCid = 'QmTest';
      
      await client.pin(testCid);

      expect(mockIPFS.pin.add).toHaveBeenCalledWith(testCid);
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.pin('QmTest')).rejects.toThrow(
        'IPFS client not initialized'
      );
    });
  });

  describe('unpin', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should unpin content', async () => {
      const testCid = 'QmTest';
      
      await client.unpin(testCid);

      expect(mockIPFS.pin.rm).toHaveBeenCalledWith(testCid);
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.unpin('QmTest')).rejects.toThrow(
        'IPFS client not initialized'
      );
    });
  });

  describe('listPins', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should list all pinned content', async () => {
      async function* mockGenerator() {
        yield { cid: { toString: () => 'QmPin1' } };
        yield { cid: { toString: () => 'QmPin2' } };
        yield { cid: { toString: () => 'QmPin3' } };
      }

      mockIPFS.pin.ls.mockReturnValue(mockGenerator());

      const result = await client.listPins();

      expect(result).toEqual(['QmPin1', 'QmPin2', 'QmPin3']);
    });

    test('should return empty array if no pins', async () => {
      async function* mockGenerator() {
        // Empty
      }

      mockIPFS.pin.ls.mockReturnValue(mockGenerator());

      const result = await client.listPins();

      expect(result).toEqual([]);
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.listPins()).rejects.toThrow(
        'IPFS client not initialized'
      );
    });
  });

  describe('resolveName', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should resolve IPNS name', async () => {
      const testName = '/ipns/k51qzi5uqu5testname';
      
      async function* mockGenerator() {
        yield '/ipfs/QmResolved123';
      }

      mockIPFS.name.resolve.mockReturnValue(mockGenerator());

      const result = await client.resolveName(testName);

      expect(result).toBe('QmResolved123');
      expect(mockIPFS.name.resolve).toHaveBeenCalledWith(testName);
    });

    test('should throw error if resolution returns no results', async () => {
      async function* mockGenerator() {
        // Empty
      }

      mockIPFS.name.resolve.mockReturnValue(mockGenerator());

      await expect(client.resolveName('test')).rejects.toThrow(
        'IPNS resolution returned no results'
      );
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.resolveName('test')).rejects.toThrow(
        'IPFS client not initialized'
      );
    });
  });

  describe('publishName', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should publish IPNS name with default key', async () => {
      const testCid = 'QmTest';
      mockIPFS.name.publish.mockResolvedValue({
        name: '/ipns/k51qzi5uqu5published'
      });

      const result = await client.publishName(testCid);

      expect(result).toBe('/ipns/k51qzi5uqu5published');
      expect(mockIPFS.name.publish).toHaveBeenCalledWith(testCid, { key: 'self' });
    });

    test('should publish IPNS name with custom key', async () => {
      const testCid = 'QmTest';
      const customKey = 'my-key';
      mockIPFS.name.publish.mockResolvedValue({
        name: '/ipns/k51custom'
      });

      const result = await client.publishName(testCid, customKey);

      expect(result).toBe('/ipns/k51custom');
      expect(mockIPFS.name.publish).toHaveBeenCalledWith(testCid, { key: customKey });
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.publishName('QmTest')).rejects.toThrow(
        'IPFS client not initialized'
      );
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should return true if content exists', async () => {
      async function* mockGenerator() {
        yield Buffer.from('exists');
      }

      mockIPFS.cat.mockReturnValue(mockGenerator());

      const result = await client.exists('QmTest');

      expect(result).toBe(true);
    });

    test('should return false if content does not exist', async () => {
      mockIPFS.cat.mockImplementation(() => {
        throw new Error('Not found');
      });

      const result = await client.exists('QmNotFound');

      expect(result).toBe(false);
    });

    test('should return false if client not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      const result = await uninitializedClient.exists('QmTest');

      expect(result).toBe(false);
    });
  });

  describe('getNodeInfo', () => {
    beforeEach(async () => {
      await client.init();
    });

    test('should return node information', async () => {
      const nodeInfo = {
        id: 'test-peer-id',
        agentVersion: 'test-agent',
        protocolVersion: '1.0.0'
      };
      mockIPFS.id.mockResolvedValue(nodeInfo);

      const result = await client.getNodeInfo();

      expect(result).toEqual(nodeInfo);
    });

    test('should throw error if not initialized', async () => {
      const uninitializedClient = new IPFSClient(testConfig);
      
      await expect(uninitializedClient.getNodeInfo()).rejects.toThrow(
        'IPFS client not initialized'
      );
    });
  });

  describe('integration scenarios', () => {
    test('should handle complete workflow', async () => {
      await client.init();

      // Add content
      mockIPFS.add.mockResolvedValue({
        cid: { toString: () => 'QmContent' },
        size: 100
      });
      const addResult = await client.add('test content');
      expect(addResult.cid).toBe('QmContent');

      // Pin it
      await client.pin(addResult.cid);
      expect(mockIPFS.pin.add).toHaveBeenCalledWith('QmContent');

      // Retrieve it
      async function* mockGenerator() {
        yield Buffer.from('test content');
      }
      mockIPFS.cat.mockReturnValue(mockGenerator());
      const content = await client.get(addResult.cid);
      expect(content.toString()).toBe('test content');

      // Publish IPNS
      mockIPFS.name.publish.mockResolvedValue({ name: '/ipns/published' });
      const ipnsName = await client.publishName(addResult.cid);
      expect(ipnsName).toBe('/ipns/published');
    });
  });
});
