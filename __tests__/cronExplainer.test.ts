import { parseCron, nextRuns, CRON_PRESETS } from '../lib/cronExplainer';

const at = (iso: string) => new Date(iso);

describe('cron explainer', () => {
  describe('field counts', () => {
    it('asks for an expression when given nothing', () => {
      expect(parseCron('   ').error).toMatch(/Enter a cron expression/);
    });

    it('rejects too few fields', () => {
      expect(parseCron('* * *').error).toMatch(/Expected 5 fields.*Got 3/);
    });

    it('rejects too many fields', () => {
      expect(parseCron('* * * * * * *').error).toMatch(/Got 7/);
    });

    it('accepts the 5 field form', () => {
      expect(parseCron('* * * * *').fieldCount).toBe(5);
    });

    it('accepts the 6 field form with seconds', () => {
      const result = parseCron('30 0 12 * * *');
      expect(result.valid).toBe(true);
      expect(result.fieldCount).toBe(6);
      expect(result.fields[0].spec.name).toBe('second');
      expect(result.description).toContain('12:00:30');
    });

    it('tolerates extra whitespace between fields', () => {
      expect(parseCron('  0   9  *  *  *  ').valid).toBe(true);
    });
  });

  describe('term syntax', () => {
    it('expands a wildcard to every value', () => {
      const [minute] = parseCron('* * * * *').fields;
      expect(minute.values).toHaveLength(60);
      expect(minute.isWildcard).toBe(true);
    });

    it('expands a step', () => {
      expect(parseCron('*/15 * * * *').fields[0].values).toEqual([0, 15, 30, 45]);
    });

    it('expands a range', () => {
      expect(parseCron('0 9-12 * * *').fields[1].values).toEqual([9, 10, 11, 12]);
    });

    it('expands a range with a step', () => {
      expect(parseCron('0 0-23/6 * * *').fields[1].values).toEqual([0, 6, 12, 18]);
    });

    it('expands a single value with a step as an open ended range', () => {
      expect(parseCron('0 9/4 * * *').fields[1].values).toEqual([9, 13, 17, 21]);
    });

    it('expands a list', () => {
      expect(parseCron('0,30 * * * *').fields[0].values).toEqual([0, 30]);
    });

    it('sorts and deduplicates a messy list', () => {
      expect(parseCron('30,0,30 * * * *').fields[0].values).toEqual([0, 30]);
    });

    it('reads month names', () => {
      expect(parseCron('0 0 1 JAN,APR,JUL,OCT *').fields[3].values).toEqual([1, 4, 7, 10]);
    });

    it('reads weekday names and ranges', () => {
      expect(parseCron('0 9 * * mon-fri').fields[4].values).toEqual([1, 2, 3, 4, 5]);
    });

    it('accepts 7 as Sunday', () => {
      expect(parseCron('0 0 * * 7').fields[4].values).toEqual([0]);
    });
  });

  describe('rejected input', () => {
    it('rejects a value above the field maximum', () => {
      expect(parseCron('60 * * * *').error).toMatch(/outside 0-59 for minute/);
    });

    it('rejects a day of month of zero', () => {
      expect(parseCron('0 0 0 * *').error).toMatch(/outside 1-31/);
    });

    it('rejects a descending range', () => {
      expect(parseCron('0 17-9 * * *').error).toMatch(/counts down/);
    });

    it('rejects a step of zero', () => {
      expect(parseCron('*/0 * * * *').error).toMatch(/step of zero/);
    });

    it('rejects a non numeric step', () => {
      expect(parseCron('*/a * * * *').error).toMatch(/step that is not a number/);
    });

    it('rejects nonsense in a field', () => {
      expect(parseCron('abc * * * *').error).toMatch(/not a valid minute/);
    });

    it.each(['0 0 L * *', '0 0 15W * *', '0 0 * * 5#2', '0 0 ? * *'])(
      'rejects the vendor extension in %s',
      (expression) => {
        expect(parseCron(expression).error).toMatch(/vendor extension/);
      }
    );
  });

  describe('descriptions', () => {
    it.each([
      ['* * * * *', 'Every minute, every day.'],
      ['0 * * * *', 'At minute 0 of every hour, every day.'],
      ['0 0 * * *', 'At 00:00, every day.'],
      ['30 3 * * SUN', 'At 03:30, on Sunday.'],
      ['0 0 1 * *', 'At 00:00, on day 1 of the month.'],
      ['0 9 * * MON-FRI', 'At 09:00, on Monday, Tuesday, Wednesday, Thursday and Friday.'],
      ['0 0 1 JAN,APR,JUL,OCT *', 'At 00:00, on day 1 of the month, in January, April, July and October.'],
    ])('explains %s', (expression, description) => {
      expect(parseCron(expression).description).toBe(description);
    });

    it('describes a list of hours', () => {
      expect(parseCron('0,30 9,17 * * *').description).toMatch(/minute 0, 30 past hour 9, 17/);
    });

    it('describes every minute of a single hour', () => {
      expect(parseCron('* 3 * * *').description).toMatch(/Every minute of the 03 hour/);
    });
  });

  describe('nextRuns', () => {
    it('returns nothing for an invalid expression', () => {
      expect(nextRuns('nope', at('2026-11-14T10:00:00Z'))).toEqual([]);
    });

    it('starts from the next minute, never the current one', () => {
      const runs = nextRuns('* * * * *', at('2026-11-14T10:00:30Z'), 2);
      expect(runs.map((d) => d.toISOString())).toEqual([
        '2026-11-14T10:01:00.000Z',
        '2026-11-14T10:02:00.000Z',
      ]);
    });

    it('walks a step expression', () => {
      const runs = nextRuns('*/15 * * * *', at('2026-11-14T10:05:00Z'), 3);
      expect(runs.map((d) => d.toISOString())).toEqual([
        '2026-11-14T10:15:00.000Z',
        '2026-11-14T10:30:00.000Z',
        '2026-11-14T10:45:00.000Z',
      ]);
    });

    it('crosses a day boundary', () => {
      const [run] = nextRuns('0 0 * * *', at('2026-11-14T10:00:00Z'), 1);
      expect(run.toISOString()).toBe('2026-11-15T00:00:00.000Z');
    });

    it('finds only weekdays', () => {
      // 14 November 2026 is a Saturday.
      const runs = nextRuns('0 9 * * MON-FRI', at('2026-11-14T00:00:00Z'), 3);
      expect(runs.map((d) => d.toISOString())).toEqual([
        '2026-11-16T09:00:00.000Z',
        '2026-11-17T09:00:00.000Z',
        '2026-11-18T09:00:00.000Z',
      ]);
    });

    it('ORs the two day fields when both are restricted', () => {
      // Day 1 of the month or any Monday.
      const runs = nextRuns('0 0 1 * MON', at('2026-11-25T00:00:00Z'), 3);
      expect(runs.map((d) => d.toISOString())).toEqual([
        '2026-11-30T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        '2026-12-07T00:00:00.000Z',
      ]);
    });

    it('crosses a year boundary for a month restricted expression', () => {
      const [run] = nextRuns('0 0 1 JAN *', at('2026-11-14T00:00:00Z'), 1);
      expect(run.toISOString()).toBe('2027-01-01T00:00:00.000Z');
    });

    it('gives up rather than looping forever on an expression that cannot fire', () => {
      // 30 February never happens.
      expect(nextRuns('0 0 30 2 *', at('2026-11-14T00:00:00Z'), 1)).toEqual([]);
    });

    it('returns at most the requested count', () => {
      expect(nextRuns('* * * * *', at('2026-11-14T10:00:00Z'), 7)).toHaveLength(7);
    });
  });

  describe('presets', () => {
    it('ships only expressions that parse', () => {
      for (const preset of CRON_PRESETS) {
        expect(parseCron(preset.expression).valid).toBe(true);
      }
    });
  });
});
