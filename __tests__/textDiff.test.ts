import {
  diffCharacters,
  segmentStats,
  diffLines,
  lineStats,
  areIdentical,
  toUnifiedDiff,
} from '../lib/textDiff';

describe('text diff', () => {
  describe('diffCharacters', () => {
    it('reports a single equal segment for identical text', () => {
      expect(diffCharacters('hello', 'hello')).toEqual([{ op: 'equal', text: 'hello' }]);
    });

    it('reports an insertion', () => {
      expect(diffCharacters('', 'new')).toEqual([{ op: 'insert', text: 'new' }]);
    });

    it('reports a deletion', () => {
      expect(diffCharacters('old', '')).toEqual([{ op: 'delete', text: 'old' }]);
    });

    it('keeps the common prefix and suffix equal', () => {
      const segments = diffCharacters('the cat sat', 'the dog sat');
      expect(segments[0]).toEqual({ op: 'equal', text: 'the ' });
      expect(segments[segments.length - 1]).toEqual({ op: 'equal', text: ' sat' });
    });

    it('reassembles the left side from equal and deleted text', () => {
      const segments = diffCharacters('the cat sat', 'the dog sat');
      const left = segments.filter((s) => s.op !== 'insert').map((s) => s.text).join('');
      expect(left).toBe('the cat sat');
    });

    it('reassembles the right side from equal and inserted text', () => {
      const segments = diffCharacters('the cat sat', 'the dog sat');
      const right = segments.filter((s) => s.op !== 'delete').map((s) => s.text).join('');
      expect(right).toBe('the dog sat');
    });

    it('sees no difference when case is ignored', () => {
      expect(diffCharacters('Hello', 'hello', { ignoreCase: true })).toEqual([
        { op: 'equal', text: 'hello' },
      ]);
    });

    it('sees no difference when runs of whitespace are ignored', () => {
      expect(diffCharacters('a    b', 'a b', { ignoreWhitespace: true })).toEqual([
        { op: 'equal', text: 'a b' },
      ]);
    });

    it('sees no difference when line edges are trimmed', () => {
      expect(diffCharacters('  a\nb  ', 'a\nb', { trimLines: true })).toEqual([
        { op: 'equal', text: 'a\nb' },
      ]);
    });
  });

  describe('segmentStats', () => {
    it('counts characters by operation', () => {
      const stats = segmentStats([
        { op: 'equal', text: 'abc' },
        { op: 'insert', text: 'de' },
        { op: 'delete', text: 'f' },
      ]);
      expect(stats).toEqual({ added: 2, removed: 1, unchanged: 3, unit: 'characters' });
    });

    it('counts nothing for no segments', () => {
      expect(segmentStats([])).toEqual({ added: 0, removed: 0, unchanged: 0, unit: 'characters' });
    });
  });

  describe('diffLines', () => {
    it('numbers both sides for unchanged lines', () => {
      const rows = diffLines('a\nb', 'a\nb');
      expect(rows).toEqual([
        { op: 'equal', text: 'a', leftNumber: 1, rightNumber: 1 },
        { op: 'equal', text: 'b', leftNumber: 2, rightNumber: 2 },
      ]);
    });

    it('numbers only the right side for an inserted line', () => {
      const rows = diffLines('a\nc', 'a\nb\nc');
      const inserted = rows.find((row) => row.op === 'insert')!;
      expect(inserted.text).toBe('b');
      expect(inserted.rightNumber).toBe(2);
      expect(inserted.leftNumber).toBeUndefined();
    });

    it('numbers only the left side for a deleted line', () => {
      const rows = diffLines('a\nb\nc', 'a\nc');
      const deleted = rows.find((row) => row.op === 'delete')!;
      expect(deleted.text).toBe('b');
      expect(deleted.leftNumber).toBe(2);
      expect(deleted.rightNumber).toBeUndefined();
    });

    it('keeps left numbering continuous across a deletion', () => {
      const rows = diffLines('a\nb\nc', 'a\nc');
      expect(rows.map((row) => [row.op, row.text, row.leftNumber, row.rightNumber])).toEqual([
        ['equal', 'a', 1, 1],
        ['delete', 'b', 2, undefined],
        ['equal', 'c', 3, 2],
      ]);
    });

    it('treats a changed line as a delete and an insert', () => {
      const ops = diffLines('a\nold\nc', 'a\nnew\nc').map((row) => row.op);
      expect(ops).toContain('delete');
      expect(ops).toContain('insert');
    });

    it('does not invent a row for a trailing newline', () => {
      expect(diffLines('a\nb\n', 'a\nb\n')).toHaveLength(2);
    });

    it('diffs against empty text as all insertions', () => {
      const rows = diffLines('', 'a\nb');
      expect(rows.map((row) => row.op)).toEqual(['insert', 'insert']);
    });

    it('handles text with no trailing newline', () => {
      expect(diffLines('a', 'a').map((row) => row.text)).toEqual(['a']);
    });

    it('applies the ignore options before diffing', () => {
      expect(diffLines('A\nB', 'a\nb', { ignoreCase: true }).every((row) => row.op === 'equal')).toBe(true);
    });

    it('scales to a long document', () => {
      const left = Array.from({ length: 500 }, (_, i) => `line ${i}`).join('\n');
      const right = left.replace('line 250', 'line 250 changed');
      const stats = lineStats(diffLines(left, right));
      expect(stats.added).toBe(1);
      expect(stats.removed).toBe(1);
      expect(stats.unchanged).toBe(499);
    });
  });

  describe('lineStats', () => {
    it('counts rows by operation', () => {
      const stats = lineStats(diffLines('a\nb\nc', 'a\nx\nc'));
      expect(stats).toEqual({ added: 1, removed: 1, unchanged: 2, unit: 'lines' });
    });
  });

  describe('areIdentical', () => {
    it('is true for the same text', () => {
      expect(areIdentical('a', 'a')).toBe(true);
    });

    it('is false for different text', () => {
      expect(areIdentical('a', 'b')).toBe(false);
    });

    it('is case sensitive by default', () => {
      expect(areIdentical('A', 'a')).toBe(false);
      expect(areIdentical('A', 'a', { ignoreCase: true })).toBe(true);
    });

    it('can ignore whitespace runs and line edges', () => {
      expect(areIdentical('a  b', 'a b', { ignoreWhitespace: true })).toBe(true);
      expect(areIdentical(' a \n b ', 'a\nb', { trimLines: true })).toBe(true);
    });
  });

  describe('toUnifiedDiff', () => {
    it('writes the file headers and prefixes each line', () => {
      const output = toUnifiedDiff(diffLines('a\nb\nc', 'a\nx\nc'), 'before.txt', 'after.txt');
      expect(output.split('\n')[0]).toBe('--- before.txt');
      expect(output.split('\n')[1]).toBe('+++ after.txt');
      expect(output).toContain('-b');
      expect(output).toContain('+x');
      expect(output).toContain(' a');
    });

    it('defaults the labels to a and b', () => {
      expect(toUnifiedDiff([]).split('\n')).toEqual(['--- a', '+++ b']);
    });
  });
});
