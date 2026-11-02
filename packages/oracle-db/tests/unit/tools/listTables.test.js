import { describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);

const { handleListTables } = await import('../../../src/tools/listTables.js');

describe('oracle-db list_tables tool', () => {
  it('accepts a call without arguments and uses the default connection', async () => {
    const connection = { execute: jest.fn().mockResolvedValue({ rows: [] }) };
    mockWithConnection.mockImplementation(async (_name, fn) =>
      fn(connection, { schema: '' }),
    );

    const result = await handleListTables();

    expect(result.content[0].text).toContain('"total": 0');
    expect(mockWithConnection.mock.calls[0][0]).toBeUndefined();
    expect(connection.execute.mock.calls[0][1]).toEqual({ owner: null, filter: null });
  });

  it('lists the connection schema with an uppercase filter', async () => {
    const connection = {
      execute: jest.fn().mockResolvedValue({ rows: [{ TABLE_NAME: 'SOLICITUD' }] }),
    };
    mockWithConnection.mockImplementation(async (_name, fn) =>
      fn(connection, { schema: 'SIAT' }),
    );

    const result = await handleListTables({ filter: 'solic%', connection: 'test' });

    expect(mockWithConnection.mock.calls.at(-1)[0]).toBe('test');
    expect(connection.execute.mock.calls[0][1]).toEqual({
      owner: 'SIAT',
      filter: 'SOLIC%',
    });
    expect(result.content[0].text).toContain('"total": 1');
  });
});
