import {
  computeSemanticDiff,
  generateMarkdownReport,
  generateTextReport,
} from '../lib/semanticJsonDiff';

describe('semanticJsonDiff engine (jdd compatibility)', () => {
  it('passes object compare test with sample data matching jdd', () => {
    const left = {
      "Aidan Gillen": {
        "array": ["Game of Thron\"es", "The Wire"],
        "string": "some string",
        "int": 2,
        "aboolean": true,
        "boolean": true,
        "null": null,
        "a_null": null,
        "another_null": "null check",
        "object": {
          "foo": "bar",
          "object1": { "new prop1": "new prop value" },
          "object2": { "new prop1": "new prop value" },
          "object3": { "new prop1": "new prop value" },
          "object4": { "new prop1": "new prop value" }
        }
      },
      "Amy Ryan": { "one": "In Treatment", "two": "The Wire" },
      "Annie Fitzgerald": ["Big Love", "True Blood"],
      "Anwan Glover": ["Treme", "The Wire"],
      "Alexander Skarsgard": ["Generation Kill", "True Blood"],
      "Clarke Peters": null
    };

    const right = {
      "Aidan Gillen": {
        "array": ["Game of Thrones", "The Wire"],
        "string": "some string",
        "int": "2",
        "otherint": 4,
        "aboolean": "true",
        "boolean": false,
        "null": null,
        "a_null": 88,
        "another_null": null,
        "object": { "foo": "bar" }
      },
      "Amy Ryan": ["In Treatment", "The Wire"],
      "Annie Fitzgerald": ["True Blood", "Big Love", "The Sopranos", "Oz"],
      "Anwan Glover": ["Treme", "The Wire"],
      "Alexander Skarsg?rd": ["Generation Kill", "True Blood"],
      "Alice Farmer": ["The Corner", "Oz", "The Wire"]
    };

    const result = computeSemanticDiff(left, right);

    expect(result.diffs.length).toBe(20);
    expect(result.eqCount).toBe(4);
    expect(result.missingCount).toBe(11);
    expect(result.typeCount).toBe(5);
  });

  it('handles array to object compare test', () => {
    const left = [{ OBJ_ID: 'test1' }];
    const right = { foo: [{ OBJ_ID: 'test1' }] };

    const result = computeSemanticDiff(left, right);

    expect(result.diffs.length).toBe(1);
    expect(result.diffs[0].type).toBe('type');
  });

  it('detects missing array elements and value differences', () => {
    const left = ['apple', 'banana', 'cherry'];
    const right = ['apple', 'banana', 'orange', 'grape'];

    const result = computeSemanticDiff(left, right);

    expect(result.diffs.length).toBe(2);
    // index 2 is 'cherry' vs 'orange' -> equality
    // index 3 is missing in left -> missing
    const hasEq = result.diffs.some(d => d.type === 'eq');
    const hasMissing = result.diffs.some(d => d.type === 'missing');
    expect(hasEq).toBe(true);
    expect(hasMissing).toBe(true);
  });

  it('detects boolean differences', () => {
    const left = { active: true };
    const right = { active: false };

    const result = computeSemanticDiff(left, right);

    expect(result.diffs.length).toBe(1);
    expect(result.diffs[0].type).toBe('eq');
    expect(result.diffs[0].rawMsg).toContain('The left side is true and the right side is false');
  });

  it('detects identical objects independent of key order', () => {
    const left = { b: 2, a: 1, c: { y: 20, x: 10 } };
    const right = { a: 1, c: { x: 10, y: 20 }, b: 2 };

    const result = computeSemanticDiff(left, right);

    expect(result.diffs.length).toBe(0);
  });

  it('formats strings, dates, and keys cleanly without inserting backspace \\b artifacts', () => {
    const payload = [
      {
        admissionId: 5795505,
        encounterType: 'ER',
        status: 'ACTIVE',
        batchRefNo: 'CLM-S2026013022861232286123',
        invoiceDate: '2026-01-30 10:17:39',
        claimType: 'ER',
      },
    ];

    const result = computeSemanticDiff(payload, payload);

    expect(result.diffs.length).toBe(0);
    // Crucial check: Must not contain any \b escape sequences
    expect(result.leftFormatted).not.toContain('\\b');
    expect(result.rightFormatted).not.toContain('\\b');
    expect(result.leftFormatted).toContain('"encounterType": "ER"');
    expect(result.leftFormatted).toContain('"admissionId": 5795505');
    expect(result.leftFormatted).toContain('"invoiceDate": "2026-01-30 10:17:39"');
  });

  it('converts slash paths into dot-bracket notation cleanly with formatPathToDotNotation', () => {
    const { formatPathToDotNotation, countJsonKeys } = require('../lib/semanticJsonDiff');
    expect(formatPathToDotNotation('')).toBe('root');
    expect(formatPathToDotNotation('/')).toBe('root');
    expect(formatPathToDotNotation('//user/name')).toBe('user.name');
    expect(formatPathToDotNotation('//items/0/id')).toBe('items[0].id');
    expect(formatPathToDotNotation('//user/addresses/1/geo/lat')).toBe('user.addresses[1].geo.lat');

    const obj = {
      a: 1,
      b: { c: 2, d: [3, { e: 4 }] },
    };
    expect(countJsonKeys(obj)).toBe(5); // a, b, c, d, e (5 keys in total)
  });

  it('attaches dotPath and total key counts to computeSemanticDiff results', () => {
    const left = { user: { name: 'Alice', age: 30 } };
    const right = { user: { name: 'Bob', age: 30 } };

    const result = computeSemanticDiff(left, right);
    expect(result.diffs.length).toBe(1);
    expect(result.diffs[0].dotPath).toBe('user.name');
    expect(result.totalKeysLeft).toBe(3); // user, name, age
    expect(result.totalKeysRight).toBe(3);
  });
});

describe('XSS safety', () => {
  it('escapes HTML in user-controlled object keys embedded in diff messages', () => {
    const left = {};
    const right = { '<img src=x onerror=alert(1)>': 1, 'a"b\'c': 2 };

    const result = computeSemanticDiff(left, right);

    expect(result.missingCount).toBe(2);
    for (const diff of result.diffs) {
      expect(diff.msg).not.toContain('<img');
      expect(diff.msg).not.toMatch(/<code>.*<img/);
    }
    expect(result.diffs[0].msg).toContain('&lt;img src=x onerror=alert(1)&gt;');
    // rawMsg keeps the unescaped plain-text key
    expect(result.diffs[0].rawMsg).toContain('"<img src=x onerror=alert(1)>"');
  });
});

describe('generateMarkdownReport and generateTextReport', () => {
  it('generates markdown report for identical JSON structures', () => {
    const left = { a: 1, b: 'hello' };
    const right = { b: 'hello', a: 1 };
    const summary = computeSemanticDiff(left, right);

    const report = generateMarkdownReport(summary, {
      title: 'Custom Title',
      timestamp: '2026-10-08 17:00:00 UTC',
    });

    expect(report).toContain('# Custom Title');
    expect(report).toContain('**Generated**: 2026-10-08 17:00:00 UTC');
    expect(report).toContain('Semantically Identical (0 differences)');
    expect(report).toContain('| Total Differences | 0 |');
    expect(report).toContain('No differences detected. Both JSON documents are semantically identical.');
  });

  it('generates markdown report with detailed differences, tables, and diff blocks', () => {
    const left = {
      name: 'Alice',
      age: 30,
      active: true,
      extra: 'left only',
    };
    const right = {
      name: 'Bob',
      age: '30',
      active: true,
      added: 'right only',
    };
    const summary = computeSemanticDiff(left, right);

    const report = generateMarkdownReport(summary, {
      timestamp: '2026-10-08 17:00:00 UTC',
    });

    expect(report).toContain('# JSON Diff Report');
    expect(report).toContain('## Summary');
    expect(report).toContain('| Missing Properties | 2 |');
    expect(report).toContain('| Type Mismatches | 1 |');
    expect(report).toContain('| Unequal Values | 1 |');
    expect(report).toContain('## Detailed Differences');
    expect(report).toContain('```diff');
    expect(report).toContain('`age` [TYPE MISMATCH]');
    expect(report).toContain('`name` [VALUE DIFFERENCE]');
    expect(report).toContain('`added` [MISSING PROPERTY]');
  });

  it('generates plain text report for identical and differing JSON', () => {
    const left = { a: 1 };
    const right = { a: 2 };
    const summary = computeSemanticDiff(left, right);

    const report = generateTextReport(summary, {
      title: 'Audit Report',
      timestamp: '2026-10-08 17:00:00 UTC',
    });

    expect(report).toContain('AUDIT REPORT');
    expect(report).toContain('Generated: 2026-10-08 17:00:00 UTC');
    expect(report).toContain('Total Differences:   1');
    expect(report).toContain('DETAILED DIFFERENCES:');
    expect(report).toContain('#1. [VALUE] a');
    expect(report).toContain('Both sides should be equal numbers');

    // Test identical text report
    const identicalSummary = computeSemanticDiff({ a: 1 }, { a: 1 });
    const identicalReport = generateTextReport(identicalSummary);
    expect(identicalReport).toContain('Semantically Identical (0 differences)');
    expect(identicalReport).toContain('No differences detected. Both JSON documents are semantically identical.');
  });
});
