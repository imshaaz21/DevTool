import CryptoJS from 'crypto-js';

// Mirrors Liquibase 4.22+ checksum v9 (liquibase-core ChangeSet / AbstractSQLChange / DatabaseList).
// Only <sql> changes are supported; other change types hash a serialized form and are reported as unsupported.

export const EMPTY_CHECKSUM = '9:d41d8cd98f00b204e9800998ecf8427e';

// Children of <changeSet> that are not changes and never affect the checksum
const NON_CHANGE_TAGS = new Set(['preConditions', 'rollback', 'comment', 'validCheckSum']);

export interface ChangeSetChecksum {
  id: string;
  author: string;
  checksum: string;
  sqlCount: number;
  unsupported: string[];
}

export interface StoredMatch {
  stored: string;
  matches: boolean;
}

const md5 = (text: string) => CryptoJS.MD5(text).toString();

// DatabaseList.definitionMatches(dbms, shortName, true)
export function dbmsMatches(dbmsAttr: string | null, database: string): boolean {
  const defs = (dbmsAttr ?? '')
    .toLowerCase()
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  if (defs.length === 0 || defs.includes('all')) return true;
  if (defs.includes('none') || defs.includes(`!${database}`)) return false;
  const supported = defs.filter((d) => !d.startsWith('!'));
  return supported.length === 0 || supported.includes(database);
}

// AbstractSQLChange.generateCheckSum: MD5 of the SQL with every space, tab, CR and LF removed
export function sqlChecksum(sql: string): string {
  return `9:${md5(sql.replace(/[ \t\r\n]/g, ''))}`;
}

// Text/CDATA content only; nested elements such as <comment> are not part of the SQL
function ownText(el: Element): string {
  return Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE || n.nodeType === Node.CDATA_SECTION_NODE)
    .map((n) => n.nodeValue ?? '')
    .join('');
}

function changeSetChecksum(changeSet: Element, database: string): ChangeSetChecksum {
  let toHash = '';
  let sqlCount = 0;
  const unsupported: string[] = [];

  for (const child of Array.from(changeSet.children)) {
    const tag = child.localName;
    if (NON_CHANGE_TAGS.has(tag)) continue;
    if (tag !== 'sql') {
      unsupported.push(tag);
      continue;
    }
    if (dbmsMatches(child.getAttribute('dbms'), database)) {
      toHash += `${sqlChecksum(ownText(child))}:`;
      sqlCount++;
    }
  }

  return {
    id: changeSet.getAttribute('id') ?? '',
    author: changeSet.getAttribute('author') ?? '',
    checksum: `9:${md5(toHash)}`,
    sqlCount,
    unsupported,
  };
}

function parseXml(xml: string): Document {
  const parser = new DOMParser();
  let doc = parser.parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    // Allow pasting bare <changeSet> fragments without the <databaseChangeLog> wrapper
    const body = xml.replace(/<\?xml[^>]*\?>/, '');
    doc = parser.parseFromString(`<root>${body}</root>`, 'application/xml');
  }
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid XML: check the pasted changeset(s).');
  }
  return doc;
}

export function computeChecksums(xml: string, database: string): ChangeSetChecksum[] {
  const changeSets = Array.from(parseXml(xml).getElementsByTagNameNS('*', 'changeSet'));
  if (changeSets.length === 0) throw new Error('No <changeSet> found.');
  return changeSets.map((cs) => changeSetChecksum(cs, database));
}

const CHECKSUM_RE = /\b\d+:[0-9a-f]{32}\b/i;

// Accepts a bare checksum, psql output, or a databasechangelog CSV export.
// A line is tied to a changeset when one of its fields equals the changeset id.
export function matchStored(results: ChangeSetChecksum[], stored: string): Map<string, StoredMatch[]> {
  const byId = new Map<string, StoredMatch[]>();
  const lines = stored.split(/\r?\n/);

  for (const line of lines) {
    const found = line.match(CHECKSUM_RE)?.[0].toLowerCase();
    if (!found) continue;
    const fields = line.split(/[,|\t;\s]+/).map((f) => f.replace(/^["']|["']$/g, ''));
    const targets = results.length === 1 ? results : results.filter((r) => fields.includes(r.id));
    for (const r of targets) {
      const list = byId.get(r.id) ?? [];
      list.push({ stored: found, matches: found === r.checksum });
      byId.set(r.id, list);
    }
  }
  return byId;
}
