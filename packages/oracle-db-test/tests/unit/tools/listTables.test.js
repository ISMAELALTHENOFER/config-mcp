import { describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);

const { handleListTables } = await import('../../../src/tools/listTables.js');

describe('oracle-db-test list tables tool', () => {
  it('accepts a call without arguments', async () => {
    mockWithConnection.mockResolvedValue({ rows: [] });

    const result = await handleListTables();

    expect(result.content[0].text).toContain('"total": 0');
    expect(mockWithConnection).toHaveBeenCalledTimes(1);
  });
});
