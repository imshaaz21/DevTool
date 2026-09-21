import { computeChecksums, matchStored, dbmsMatches, EMPTY_CHECKSUM } from '@/lib/liquibaseChecksum';

// Real changeset; expected values come from Liquibase 4.29.2 on PostgreSQL
const CHANGESET = `
<changeSet id="idx_blinv_component_procedure_category_code_1770124129511" author="antikythera" runInTransaction="false">
    <preConditions onFail="MARK_RAN">
        <not>
            <indexExists tableName="blinv_component_procedure" columnNames="category_code"/>
        </not>
    </preConditions>
    <sql dbms="oracle">CREATE INDEX idx_blinv_component_procedure_category_code ON blinv_component_procedure (category_code) ONLINE;</sql>
    <sql dbms="postgresql">CREATE INDEX CONCURRENTLY idx_blinv_component_procedure_category_code ON blinv_component_procedure (category_code);</sql>
    <rollback>
        <sql dbms="postgresql">DROP INDEX CONCURRENTLY IF EXISTS idx_blinv_component_procedure_category_code;</sql>
    </rollback>
</changeSet>`;
const PG = '9:a8e825e3de21af024b922d861c863507';

describe('liquibaseChecksum', () => {
  it('matches the checksum Liquibase computed for postgresql', () => {
    const [r] = computeChecksums(CHANGESET, 'postgresql');
    expect(r.id).toBe('idx_blinv_component_procedure_category_code_1770124129511');
    expect(r.checksum).toBe(PG);
    expect(r.sqlCount).toBe(1);
  });

  it('ignores whitespace, preconditions and rollback', () => {
    const reformatted = CHANGESET.replace('CONCURRENTLY idx', 'CONCURRENTLY\n\t  idx').replace(/<rollback>[\s\S]*<\/rollback>/, '');
    expect(computeChecksums(reformatted, 'postgresql')[0].checksum).toBe(PG);
  });

  it('gives the empty checksum when no sql targets the database', () => {
    expect(computeChecksums(CHANGESET, 'mysql')[0].checksum).toBe(EMPTY_CHECKSUM);
  });

  it('parses a full changelog with namespaces', () => {
    const xml = `<?xml version="1.0"?><databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog">${CHANGESET}${CHANGESET.replace('_1770124129511', '_2')}</databaseChangeLog>`;
    expect(computeChecksums(xml, 'postgresql')).toHaveLength(2);
  });

  it('matches stored values from a CSV export, flagging stale duplicates', () => {
    const results = computeChecksums(CHANGESET + CHANGESET.replace('_1770124129511', '_2'), 'postgresql');
    const csv = [
      `idx_blinv_component_procedure_category_code_1770124129511,antikythera,x.xml,2026-09-21,2594,MARK_RAN,"${PG}"`,
      `idx_blinv_component_procedure_category_code_1770124129511,antikythera,x.xml,2026-05-15,2492,EXECUTED,"${EMPTY_CHECKSUM}"`,
    ].join('\n');
    const m = matchStored(results, csv);
    expect(m.get(results[0].id)).toEqual([
      { stored: PG, matches: true },
      { stored: EMPTY_CHECKSUM, matches: false },
    ]);
    expect(m.get(results[1].id)).toBeUndefined();
  });

  it('follows Liquibase dbms rules', () => {
    expect(dbmsMatches(null, 'postgresql')).toBe(true);
    expect(dbmsMatches('oracle, PostgreSQL', 'postgresql')).toBe(true);
    expect(dbmsMatches('!postgresql', 'postgresql')).toBe(false);
    expect(dbmsMatches('!oracle', 'postgresql')).toBe(true);
    expect(dbmsMatches('oracle', 'postgresql')).toBe(false);
  });
});
