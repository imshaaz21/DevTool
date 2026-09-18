import { computeSemanticDiff } from '../lib/semanticJsonDiff';

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
});
