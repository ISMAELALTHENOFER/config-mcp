import { describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);

const { handleQuery } = await import('../../../src/tools/query.js');

describe('oracle-db-test query tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithConnection.mockResolvedValue({ rows: [], metaData: [] });
  });

  it('executes a SELECT with the default row limit', async () => {
    await handleQuery({ sql: 'SELECT 1 FROM dual' });

    expect(mockWithConnection).toHaveBeenCalledTimes(1);
    const connectionHandler = mockWithConnection.mock.calls[0][0];
    const connection = {
      execute: jest.fn().mockResolvedValue({ rows: [], metaData: [] }),
    };
    await connectionHandler(connection);
    expect(connection.execute).toHaveBeenCalledWith(
      'SELECT 1 FROM dual',
      {},
      { maxRows: 100, outFormat: 'object' },
    );
  });

  it.each([
    'UPDATE users SET active = 0',
    'WITH changed AS (UPDATE users SET active = 0) SELECT * FROM changed',
    'SELECT * FROM users FOR UPDATE',
  ])('rejects non-read-only SQL: %s', async (sql) => {
    const result = await handleQuery({ sql });

    expect(result.isError).toBe(true);
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('rejects an invalid limit', async () => {
    const result = await handleQuery({ sql: 'SELECT 1 FROM dual', limit: 1001 });

    expect(result.isError).toBe(true);
    expect(mockWithConnection).not.toHaveBeenCalled();
  });
});
