import {
  yamlToJson,
  jsonToYaml,
  formatYaml,
  isProbablyYaml,
  YAML_SAMPLE,
} from '../lib/yamlConverter';

describe('yaml converter', () => {
  describe('yamlToJson', () => {
    it('asks for input when given none', () => {
      expect(yamlToJson('   ').error).toBe('Enter some YAML.');
    });

    it('converts a flat mapping', () => {
      const result = yamlToJson('name: payments\nreplicas: 3');
      expect(result.ok).toBe(true);
      expect(JSON.parse(result.output)).toEqual({ name: 'payments', replicas: 3 });
    });

    it('converts nested mappings and sequences', () => {
      const result = yamlToJson('image:\n  tag: "2.11.4"\nports:\n  - 80\n  - 443');
      expect(JSON.parse(result.output)).toEqual({ image: { tag: '2.11.4' }, ports: [80, 443] });
    });

    it('indents with two spaces by default', () => {
      expect(yamlToJson('a: 1').output).toBe('{\n  "a": 1\n}');
    });

    it('honours a requested indent', () => {
      expect(yamlToJson('a: 1', 4).output).toBe('{\n    "a": 1\n}');
    });

    it('reads a quoted number as a string', () => {
      expect(JSON.parse(yamlToJson('port: "8080"').output)).toEqual({ port: '8080' });
    });

    it('reads null', () => {
      expect(JSON.parse(yamlToJson('value: null').output)).toEqual({ value: null });
    });

    it('reads booleans', () => {
      expect(JSON.parse(yamlToJson('on: true\noff: false').output)).toEqual({ on: true, off: false });
    });

    it('leaves yes and no as strings, which JSON schema requires', () => {
      expect(JSON.parse(yamlToJson('enabled: yes').output)).toEqual({ enabled: 'yes' });
    });

    it('expands an anchor', () => {
      const result = yamlToJson('base: &base\n  cpu: "1"\nlimits: *base');
      expect(JSON.parse(result.output)).toEqual({ base: { cpu: '1' }, limits: { cpu: '1' } });
    });

    it('refuses a custom tag rather than constructing an object', () => {
      const result = yamlToJson('value: !!js/function "function () {}"');
      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('reports a syntax error with the line the parser objected to', () => {
      const result = yamlToJson('a: 1\n  b: 2\nc: 3');
      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.errorLine).toBeGreaterThan(1);
    });

    it('calls a comment only document empty', () => {
      expect(yamlToJson('# nothing here').error).toBe('That YAML is empty.');
    });

    it('converts the sample it ships', () => {
      const parsed = JSON.parse(yamlToJson(YAML_SAMPLE).output);
      expect(parsed.name).toBe('payments-api');
      expect(parsed.replicas).toBe(3);
      expect(parsed.env).toHaveLength(2);
    });
  });

  describe('jsonToYaml', () => {
    it('asks for input when given none', () => {
      expect(jsonToYaml('  ').error).toBe('Enter some JSON.');
    });

    it('converts a flat object', () => {
      const result = jsonToYaml('{"name":"payments","replicas":3}');
      expect(result.ok).toBe(true);
      expect(result.output).toBe('name: payments\nreplicas: 3\n');
    });

    it('converts a nested object with the requested indent', () => {
      expect(jsonToYaml('{"a":{"b":1}}', { indent: 4 }).output).toBe('a:\n    b: 1\n');
    });

    it('keeps key order by default', () => {
      expect(jsonToYaml('{"b":1,"a":2}').output).toBe('b: 1\na: 2\n');
    });

    it('sorts keys on request', () => {
      expect(jsonToYaml('{"b":1,"a":2}', { sortKeys: true }).output).toBe('a: 2\nb: 1\n');
    });

    it('wraps a long string by default', () => {
      const long = 'word '.repeat(40).trim();
      expect(jsonToYaml(JSON.stringify({ text: long })).output.split('\n').length).toBeGreaterThan(2);
    });

    it('keeps a long string on one line on request', () => {
      const long = 'word '.repeat(40).trim();
      const output = jsonToYaml(JSON.stringify({ text: long }), { noWrap: true }).output;
      expect(output.trimEnd().split('\n')).toHaveLength(1);
    });

    it('converts an array at the root', () => {
      expect(jsonToYaml('[1,2]').output).toBe('- 1\n- 2\n');
    });

    it('reports invalid JSON with the parser message', () => {
      const result = jsonToYaml('{broken}');
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/JSON|token/i);
    });
  });

  describe('formatYaml', () => {
    it('normalises indentation and quoting through a round trip', () => {
      expect(formatYaml('a:    1\nb:  "two"').output).toBe('a: 1\nb: two\n');
    });

    it('can sort keys while formatting', () => {
      expect(formatYaml('b: 1\na: 2', { sortKeys: true }).output).toBe('a: 2\nb: 1\n');
    });

    it('passes a parse failure straight through', () => {
      expect(formatYaml('a: 1\n  b: 2\nc: 3').ok).toBe(false);
    });
  });

  describe('round trip', () => {
    it('survives yaml to json and back', () => {
      const once = yamlToJson(YAML_SAMPLE).output;
      const back = jsonToYaml(once).output;
      expect(JSON.parse(yamlToJson(back).output)).toEqual(JSON.parse(once));
    });
  });

  describe('isProbablyYaml', () => {
    it.each(['name: value', '--- \na: 1', '- one\n- two', "'quoted key': 1"])(
      'recognises %s as yaml',
      (text) => {
        expect(isProbablyYaml(text)).toBe(true);
      }
    );

    it.each(['', '   ', '{"a":1}', '[1,2]'])('does not claim %s is yaml', (text) => {
      expect(isProbablyYaml(text)).toBe(false);
    });
  });
});
