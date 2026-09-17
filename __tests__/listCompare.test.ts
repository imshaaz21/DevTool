import {
  parseList,
  analyzeList,
  compareLists,
  formatListOutput,
  sortItems,
} from '../lib/listCompare';

describe('listCompare utility', () => {
  describe('parseList', () => {
    it('parses newline-separated items correctly', () => {
      const input = 'item1\nitem2\nitem3';
      expect(parseList(input)).toEqual(['item1', 'item2', 'item3']);
    });

    it('parses comma-separated items when on single line (auto mode)', () => {
      const input = 'apple, banana, cherry';
      expect(parseList(input)).toEqual(['apple', 'banana', 'cherry']);
    });

    it('trims whitespace and ignores empty lines', () => {
      const input = '  item1  \n\n  item2\n  ';
      expect(parseList(input)).toEqual(['item1', 'item2']);
    });

    it('strips enclosing quotes if requested', () => {
      const input = "'item1'\n\"item2\"\n`item3`";
      expect(parseList(input, { stripQuotes: true })).toEqual(['item1', 'item2', 'item3']);
    });
  });

  describe('analyzeList', () => {
    it('identifies unique items and duplicate occurrences', () => {
      const input = ['A', 'B', 'A', 'C', 'B', 'A'];
      const analysis = analyzeList(input);
      expect(analysis.total).toBe(6);
      expect(analysis.unique).toEqual(['A', 'B', 'C']);
      expect(analysis.duplicates).toEqual([
        { value: 'A', count: 3 },
        { value: 'B', count: 2 },
      ]);
    });

    it('handles case-insensitive duplicate analysis', () => {
      const input = ['Hello', 'hello', 'WORLD'];
      const analysis = analyzeList(input, false);
      expect(analysis.total).toBe(3);
      expect(analysis.unique).toEqual(['Hello', 'WORLD']);
      expect(analysis.duplicates).toEqual([{ value: 'Hello', count: 2 }]);
    });
  });

  describe('compareLists', () => {
    it('correctly calculates common, onlyA, and onlyB', () => {
      const listA = ['INV-1', 'INV-2', 'INV-3'];
      const listB = ['INV-2', 'INV-3', 'INV-4', 'INV-5'];

      const result = compareLists(listA, listB);

      expect(result.common).toEqual(['INV-2', 'INV-3']);
      expect(result.onlyA).toEqual(['INV-1']);
      expect(result.onlyB).toEqual(['INV-4', 'INV-5']);
      expect(result.union).toEqual(['INV-1', 'INV-2', 'INV-3', 'INV-4', 'INV-5']);
      expect(result.symmetricDiff).toEqual(['INV-1', 'INV-4', 'INV-5']);
    });

    it('respects sorting options', () => {
      const listA = ['Z', 'A', 'M'];
      const listB = ['M', 'Z'];

      const resultAsc = compareLists(listA, listB, { sort: 'asc' });
      expect(resultAsc.common).toEqual(['M', 'Z']);
      expect(resultAsc.onlyA).toEqual(['A']);
    });

    it('removes duplicates by default and preserves them when removeDuplicates is false', () => {
      const listA = ['A', 'A', 'B', 'C'];
      const listB = ['C', 'D'];

      const defaultResult = compareLists(listA, listB);
      expect(defaultResult.onlyA).toEqual(['A', 'B']);

      const keepDupesResult = compareLists(listA, listB, { removeDuplicates: false });
      expect(keepDupesResult.onlyA).toEqual(['A', 'A', 'B']);
    });
  });

  describe('formatListOutput', () => {
    const items = ['INV-100', 'INV-200', 'INV-300'];

    it('formats comma-separated with single quotes', () => {
      const formatted = formatListOutput(items, { quote: 'single', delimiter: ', ' });
      expect(formatted).toBe("'INV-100', 'INV-200', 'INV-300'");
    });

    it('formats comma-separated with double quotes', () => {
      const formatted = formatListOutput(items, { quote: 'double', delimiter: ', ' });
      expect(formatted).toBe('"INV-100", "INV-200", "INV-300"');
    });

    it('formats with no quotes and custom delimiter', () => {
      const formatted = formatListOutput(items, { quote: 'none', delimiter: '\n' });
      expect(formatted).toBe('INV-100\nINV-200\nINV-300');
    });

    it('wraps with SQL IN clause syntax', () => {
      const formatted = formatListOutput(items, { quote: 'single', delimiter: ', ', wrapper: 'sql' });
      expect(formatted).toBe("( 'INV-100', 'INV-200', 'INV-300' )");
    });
  });
});
