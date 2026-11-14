import {
  getAllKeys,
  compareJsonObjects,
  getValueByPath,
  prettyPrintJson,
  createTreeFromKeys,
  mergeTrees,
} from '../lib/jsonComparator';

describe('jsonComparator', () => {
  describe('getAllKeys', () => {
    it('returns an empty list for non-objects', () => {
      expect(getAllKeys(null)).toEqual([]);
      expect(getAllKeys('text')).toEqual([]);
      expect(getAllKeys(42)).toEqual([]);
    });

    it('lists top level keys', () => {
      expect(getAllKeys({ a: 1, b: 2 })).toEqual(['a', 'b']);
    });

    it('lists nested keys in dot notation', () => {
      expect(getAllKeys({ user: { name: 'x', address: { city: 'y' } } })).toEqual([
        'user',
        'user.name',
        'user.address',
        'user.address.city',
      ]);
    });

    it('indexes keys inside arrays of objects', () => {
      expect(getAllKeys({ users: [{ name: 'a' }, { name: 'b' }] })).toEqual([
        'users',
        'users[0].name',
        'users[1].name',
      ]);
    });

    it('does not descend into arrays of primitives', () => {
      expect(getAllKeys({ tags: ['a', 'b'] })).toEqual(['tags']);
    });
  });

  describe('compareJsonObjects', () => {
    it('separates keys unique to each side', () => {
      const result = compareJsonObjects({ a: 1, shared: 1 }, { b: 2, shared: 1 });

      expect(result.keysOnlyInA).toEqual(['a']);
      expect(result.keysOnlyInB).toEqual(['b']);
      expect(result.keysInBoth).toEqual(['shared']);
    });

    it('reports shared keys whose values differ', () => {
      const result = compareJsonObjects({ port: 8080 }, { port: 9090 });

      expect(result.valueDiffs).toEqual([{ key: 'port', valueA: 8080, valueB: 9090 }]);
      expect(result.commonKeysWithSameValue).toEqual([]);
    });

    it('reports shared keys whose values match', () => {
      const result = compareJsonObjects({ port: 8080 }, { port: 8080 });

      expect(result.valueDiffs).toEqual([]);
      expect(result.commonKeysWithSameValue).toEqual(['port']);
    });

    it('counts the keys on each side', () => {
      const result = compareJsonObjects({ a: 1, b: { c: 2 } }, { a: 1 });

      expect(result.totalKeysA).toBe(3);
      expect(result.totalKeysB).toBe(1);
    });

    it('treats two empty objects as identical', () => {
      const result = compareJsonObjects({}, {});

      expect(result.keysOnlyInA).toEqual([]);
      expect(result.keysOnlyInB).toEqual([]);
      expect(result.valueDiffs).toEqual([]);
    });

    it('detects a type change at the same key', () => {
      const result = compareJsonObjects({ enabled: 'true' }, { enabled: true });
      expect(result.valueDiffs).toHaveLength(1);
    });
  });

  describe('getValueByPath', () => {
    const data = {
      user: { name: 'ada', roles: ['admin', 'dev'] },
      users: [{ name: 'a' }, { name: 'b' }],
    };

    it('reads a nested value', () => {
      expect(getValueByPath(data, 'user.name')).toBe('ada');
    });

    it('reads a value inside an array', () => {
      expect(getValueByPath(data, 'users[1].name')).toBe('b');
    });

    it('reads a whole array', () => {
      expect(getValueByPath(data, 'user.roles')).toEqual(['admin', 'dev']);
    });

    it('returns undefined for a missing path', () => {
      expect(getValueByPath(data, 'user.missing')).toBeUndefined();
      expect(getValueByPath(data, 'users[9].name')).toBeUndefined();
    });

    it('returns undefined when walking through a primitive', () => {
      expect(getValueByPath(data, 'user.name.deeper')).toBeUndefined();
    });
  });

  describe('prettyPrintJson', () => {
    it('indents with two spaces', () => {
      expect(prettyPrintJson({ a: 1 })).toBe('{\n  "a": 1\n}');
    });
  });

  describe('createTreeFromKeys', () => {
    it('nests keys under a root node', () => {
      const tree = createTreeFromKeys(['user.name'], { user: { name: 'ada' } });

      expect(tree.name).toBe('root');
      const user = tree.children?.find((child) => child.name === 'user');
      expect(user?.children?.[0].name).toBe('name');
    });

    it('carries the status through to the nodes', () => {
      const tree = createTreeFromKeys(['a'], { a: 1 }, 'added');
      expect(tree.children?.[0].status).toBe('added');
    });

    it('returns only a root for an empty key list', () => {
      expect(createTreeFromKeys([], {}).children).toEqual([]);
    });
  });

  describe('mergeTrees', () => {
    it('combines branches from both sides', () => {
      const a = createTreeFromKeys(['a'], { a: 1 }, 'removed');
      const b = createTreeFromKeys(['b'], { b: 2 }, 'added');

      const merged = mergeTrees(a, b);
      const names = merged.children?.map((child) => child.name).sort();

      expect(names).toEqual(['a', 'b']);
    });
  });
});
