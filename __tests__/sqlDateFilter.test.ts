import {
  formatDateString,
  formatUtcDateString,
  parseDateTimeInTz,
  getPresetDateRange,
  generateOracleClause,
  generateOracleDynamic,
  generatePostgresClause,
  generatePostgresDynamic,
  generateAllSqlDateClauses,
} from '@/lib/sqlDateFilter';

describe('sqlDateFilter library', () => {
  const fixedDate = new Date('2026-07-15T12:00:00Z');

  describe('formatDateString and formatUtcDateString', () => {
    it('formats date in local and UTC', () => {
      const d = new Date(Date.UTC(2026, 5, 30, 21, 0, 0, 0));
      expect(formatUtcDateString(d, false)).toBe('2026-06-30 21:00:00');
      expect(formatUtcDateString(d, true)).toBe('2026-06-30 21:00:00.000');
    });
  });

  describe('Timezone Parsing and UTC Conversion', () => {
    it('converts Saudi Arabia AST (UTC+3) to UTC accurately', () => {
      // 2026-07-01 00:00:00 in Saudi Arabia is 2026-06-30 21:00:00 in UTC
      const dateInSaudi = parseDateTimeInTz('2026-07-01T00:00:00', 'Asia/Riyadh');
      expect(formatUtcDateString(dateInSaudi, false)).toBe('2026-06-30 21:00:00');
      expect(formatUtcDateString(dateInSaudi, true)).toBe('2026-06-30 21:00:00.000');

      // 2026-07-31 23:59:59 in Saudi Arabia is 2026-07-31 20:59:59 in UTC
      const endInSaudi = parseDateTimeInTz('2026-07-31T23:59:59.000', 'Asia/Riyadh');
      expect(formatUtcDateString(endInSaudi, true)).toBe('2026-07-31 20:59:59.000');
    });

    it('generates exact WHERE clause matching user specification when Saudi AST is converted to UTC', () => {
      const result = generateAllSqlDateClauses({
        columnName: 'BI.CREATED_DATE',
        operator: 'between',
        preset: 'custom',
        startDate: '2026-07-01T00:00:00',
        endDate: '2026-07-31T23:59:59',
        precision: 'milliseconds',
        prefix: 'AND',
        inputTimezone: 'Asia/Riyadh',
        convertToUtc: true,
      });

      expect(result.postgresStandard).toBe(
        "AND BI.CREATED_DATE BETWEEN '2026-06-30 21:00:00.000' AND '2026-07-31 20:59:59.000'"
      );
      expect(result.oracleTimestamp).toBe(
        "AND BI.CREATED_DATE BETWEEN TO_TIMESTAMP('2026-06-30 21:00:00.000', 'YYYY-MM-DD HH24:MI:SS.FF3') AND TO_TIMESTAMP('2026-07-31 20:59:59.000', 'YYYY-MM-DD HH24:MI:SS.FF3')"
      );
    });
  });

  describe('Oracle SQL Generation', () => {
    it('generates Oracle TO_DATE BETWEEN clause', () => {
      const clause = generateOracleClause(
        'BI.CREATED_DATE',
        '2026-05-30 00:00:00',
        '2026-07-01 00:00:00',
        'between',
        'seconds',
        'AND'
      );
      expect(clause).toBe(
        "AND BI.CREATED_DATE BETWEEN TO_DATE('2026-05-30 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('2026-07-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')"
      );
    });

    it('generates Oracle TO_TIMESTAMP clause with milliseconds', () => {
      const clause = generateOracleClause(
        'BI.CREATED_DATE',
        '2026-05-30 00:00:00.000',
        '2026-07-01 23:59:59.999',
        'gte_lte',
        'milliseconds',
        'WHERE'
      );
      expect(clause).toBe(
        "WHERE BI.CREATED_DATE >= TO_TIMESTAMP('2026-05-30 00:00:00.000', 'YYYY-MM-DD HH24:MI:SS.FF3') AND BI.CREATED_DATE <= TO_TIMESTAMP('2026-07-01 23:59:59.999', 'YYYY-MM-DD HH24:MI:SS.FF3')"
      );
    });

    it('generates Oracle dynamic clauses for relative presets', () => {
      expect(generateOracleDynamic('BI.CREATED_DATE', 'thisMonth', 'AND')).toBe(
        "AND BI.CREATED_DATE >= TRUNC(SYSDATE, 'MM') AND BI.CREATED_DATE < ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)"
      );
      expect(generateOracleDynamic('BI.CREATED_DATE', 'last30days', 'AND')).toBe(
        'AND BI.CREATED_DATE >= SYSDATE - 30'
      );
    });
  });

  describe('PostgreSQL SQL Generation', () => {
    it('generates Postgres standard literal BETWEEN clause', () => {
      const clause = generatePostgresClause(
        'BI.CREATED_DATE',
        '2026-06-30 21:00:00.000',
        '2026-07-31 20:59:59.000',
        'between',
        'AND',
        'literal'
      );
      expect(clause).toBe(
        "AND BI.CREATED_DATE BETWEEN '2026-06-30 21:00:00.000' AND '2026-07-31 20:59:59.000'"
      );
    });

    it('generates Postgres explicit timestamp cast clause', () => {
      const clause = generatePostgresClause(
        'created_at',
        '2026-06-30 21:00:00',
        '2026-07-31 20:59:59',
        'gte_lte',
        'AND',
        'cast'
      );
      expect(clause).toBe(
        "AND created_at >= '2026-06-30 21:00:00'::timestamp AND created_at <= '2026-07-31 20:59:59'::timestamp"
      );
    });

    it('generates Postgres dynamic relative clause', () => {
      expect(generatePostgresDynamic('created_at', 'last30days', 'AND')).toBe(
        "AND created_at >= NOW() - INTERVAL '30 days'"
      );
      expect(generatePostgresDynamic('created_at', 'thisMonth', 'AND')).toBe(
        "AND created_at >= DATE_TRUNC('month', CURRENT_DATE) AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'"
      );
    });
  });
});
