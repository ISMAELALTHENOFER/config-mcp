import { describe, it, expect, jest } from '@jest/globals';

const getSqlAttachment = jest.fn();
jest.unstable_mockModule('../src/jira/jiraService.js', () => ({ getSqlAttachment }));
const { handleInspectSqlAttachment } = await import('../src/tools/inspectSqlAttachment.js');

describe('inspect_sql_attachment handler', () => {
  const selected = { issueKey: 'TEST-123', attachmentId: '42' };
  const entries = [
    { filename: 'changes/001.sql', bytes: 9, sql: 'SELECT 1;' },
    { filename: 'changes/002.sql', bytes: 9, sql: 'SELECT 2;' },
  ];

  it('returns the legacy summary without SQL by default or explicit false', async () => {
    getSqlAttachment.mockResolvedValue({ filename: 'changes.zip', bytes: 250, entries });
    const baseline = JSON.parse((await handleInspectSqlAttachment(selected)).content[0].text);
    const explicit = JSON.parse((await handleInspectSqlAttachment({ ...selected, includeSql: false })).content[0].text);
    expect(explicit).toEqual(baseline);
    expect(baseline.entradas).toHaveLength(2);
    for (const entry of baseline.entradas) {
      expect(entry).toHaveProperty('descripcion');
      expect(entry).not.toHaveProperty('sql');
    }
    expect(getSqlAttachment).toHaveBeenCalledWith('TEST-123', '42');
  });

  it('returns every validated ZIP entry SQL and plain SQL only with opt-in', async () => {
    getSqlAttachment.mockResolvedValue({ filename: 'changes.zip', bytes: 250, entries });
    const zip = JSON.parse((await handleInspectSqlAttachment({ ...selected, includeSql: true })).content[0].text);
    expect(zip.entradas.map(({ sql }) => sql)).toEqual(entries.map(({ sql }) => sql));

    getSqlAttachment.mockResolvedValue({ filename: 'change.sql', bytes: 9, entries: [{ ...entries[0], filename: 'change.sql' }] });
    const plain = JSON.parse((await handleInspectSqlAttachment({ ...selected, includeSql: true })).content[0].text);
    expect(plain.entradas).toMatchObject([{ sql: 'SELECT 1;', filename: 'change.sql' }]);
  });

  it('rejects non-boolean opt-in before retrieving an attachment', async () => {
    getSqlAttachment.mockClear();
    await expect(handleInspectSqlAttachment({ ...selected, includeSql: 'true' })).rejects.toThrow('includeSql');
    expect(getSqlAttachment).not.toHaveBeenCalled();
  });
});
