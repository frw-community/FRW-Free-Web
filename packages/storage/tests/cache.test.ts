import { describe, test, expect, beforeEach } from '@jest/globals';
import { Cache } from '../src/cache';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache<string>();
  });

  describe('constructor', () => {
    test('creates cache with default max size', () => {
      const c = new Cache<number>();
      expect(c.size()).toBe(0);
    });

    test('creates cache with custom max size', () => {
      const c = new Cache<number>({ maxSize: 50 });
      // Should allow up to 50 items
      for (let i = 0; i < 50; i++) {
        c.set(`key${i}`, i);
      }
      expect(c.size()).toBe(50);
    });

    test('respects maxSize option', () => {
      const c = new Cache<number>({ maxSize: 2 });
      c.set('a', 1);
      c.set('b', 2);
      c.set('c', 3); // Should evict 'a'
      
      expect(c.size()).toBe(2);
      expect(c.has('a')).toBe(false);
      expect(c.has('b')).toBe(true);
      expect(c.has('c')).toBe(true);
    });
  });

  describe('set and get', () => {
    test('stores and retrieves value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    test('returns null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    test('stores multiple values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    test('updates existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    test('works with different types', () => {
      const numCache = new Cache<number>();
      numCache.set('num', 42);
      expect(numCache.get('num')).toBe(42);

      const objCache = new Cache<{ name: string }>();
      objCache.set('obj', { name: 'test' });
      expect(objCache.get('obj')).toEqual({ name: 'test' });
    });
  });

  describe('LRU eviction', () => {
    test('evicts oldest item when maxSize exceeded', () => {
      const c = new Cache<number>({ maxSize: 3 });
      c.set('a', 1);
      c.set('b', 2);
      c.set('c', 3);
      c.set('d', 4); // Should evict 'a'
      
      expect(c.has('a')).toBe(false);
      expect(c.has('b')).toBe(true);
      expect(c.has('c')).toBe(true);
      expect(c.has('d')).toBe(true);
      expect(c.size()).toBe(3);
    });

    test('get updates LRU order', () => {
      const c = new Cache<number>({ maxSize: 3 });
      c.set('a', 1);
      c.set('b', 2);
      c.set('c', 3);
      
      // Access 'a' to make it most recently used
      c.get('a');
      
      // Add 'd', should evict 'b' (oldest)
      c.set('d', 4);
      
      expect(c.has('a')).toBe(true);
      expect(c.has('b')).toBe(false);
      expect(c.has('c')).toBe(true);
      expect(c.has('d')).toBe(true);
    });

    test('set on existing key updates LRU order', () => {
      const c = new Cache<number>({ maxSize: 3 });
      c.set('a', 1);
      c.set('b', 2);
      c.set('c', 3);
      
      // Update 'a' to make it most recently used
      c.set('a', 10);
      
      // Add 'd', should evict 'b' (oldest)
      c.set('d', 4);
      
      expect(c.has('a')).toBe(true);
      expect(c.get('a')).toBe(10);
      expect(c.has('b')).toBe(false);
      expect(c.has('c')).toBe(true);
      expect(c.has('d')).toBe(true);
    });

    test('maintains correct order with multiple accesses', () => {
      const c = new Cache<number>({ maxSize: 3 });
      c.set('a', 1);
      c.set('b', 2);
      c.set('c', 3);
      
      // Access pattern: a -> b -> a
      c.get('a');
      c.get('b');
      c.get('a');
      
      // Add 'd', should evict 'c' (oldest)
      c.set('d', 4);
      
      expect(c.has('a')).toBe(true);
      expect(c.has('b')).toBe(true);
      expect(c.has('c')).toBe(false);
      expect(c.has('d')).toBe(true);
    });
  });

  describe('has', () => {
    test('returns true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    test('returns false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    test('returns false after deletion', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    test('removes item from cache', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.get('key1')).toBeNull();
      expect(cache.size()).toBe(0);
    });

    test('handles deleting non-existent key', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow();
      expect(cache.size()).toBe(0);
    });

    test('removes specific item among multiple', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.delete('key2');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.size()).toBe(2);
    });
  });

  describe('clear', () => {
    test('removes all items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });

    test('handles clearing empty cache', () => {
      expect(() => cache.clear()).not.toThrow();
      expect(cache.size()).toBe(0);
    });

    test('allows adding after clear', () => {
      cache.set('key1', 'value1');
      cache.clear();
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('size', () => {
    test('returns 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    test('returns correct size after additions', () => {
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);
    });

    test('does not increase when updating existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      
      expect(cache.size()).toBe(1);
    });

    test('decreases after deletion', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.delete('key1');
      
      expect(cache.size()).toBe(1);
    });

    test('never exceeds maxSize', () => {
      const c = new Cache<number>({ maxSize: 5 });
      for (let i = 0; i < 10; i++) {
        c.set(`key${i}`, i);
        expect(c.size()).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('edge cases', () => {
    test('handles empty string as key', () => {
      cache.set('', 'empty key');
      expect(cache.get('')).toBe('empty key');
    });

    test('handles special characters in keys', () => {
      cache.set('key:with:colons', 'value1');
      cache.set('key/with/slashes', 'value2');
      cache.set('key with spaces', 'value3');
      
      expect(cache.get('key:with:colons')).toBe('value1');
      expect(cache.get('key/with/slashes')).toBe('value2');
      expect(cache.get('key with spaces')).toBe('value3');
    });

    test('handles null and undefined values', () => {
      const c = new Cache<any>();
      c.set('null', null);
      c.set('undefined', undefined);
      
      expect(c.get('null')).toBeNull();
      expect(c.get('undefined')).toBeUndefined();
      expect(c.has('null')).toBe(true);
      expect(c.has('undefined')).toBe(true);
    });

    test('handles maxSize of 1', () => {
      const c = new Cache<number>({ maxSize: 1 });
      c.set('a', 1);
      c.set('b', 2);
      
      expect(c.size()).toBe(1);
      expect(c.has('a')).toBe(false);
      expect(c.has('b')).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    test('typical cache workflow', () => {
      const c = new Cache<{ data: string }>({ maxSize: 3 });
      
      // Add items
      c.set('user:1', { data: 'Alice' });
      c.set('user:2', { data: 'Bob' });
      
      // Check existence
      expect(c.has('user:1')).toBe(true);
      
      // Retrieve
      const user1 = c.get('user:1');
      expect(user1?.data).toBe('Alice');
      
      // Update
      c.set('user:1', { data: 'Alice Updated' });
      expect(c.get('user:1')?.data).toBe('Alice Updated');
      
      // Fill cache
      c.set('user:3', { data: 'Charlie' });
      c.set('user:4', { data: 'David' }); // Evicts user:2
      
      expect(c.has('user:2')).toBe(false);
      expect(c.size()).toBe(3);
      
      // Clear
      c.clear();
      expect(c.size()).toBe(0);
    });
  });
});
