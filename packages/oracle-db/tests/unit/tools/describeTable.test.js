import { describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);

const { handleDescribeTable } = await import('../../../src/tools/describeTable.js');

function useConnection(rows, config = { schema: '' }) {
  const connection = { execute: jest.fn().mockResolvedValue({ rows }) };
  mockWithConnection.mockImplementation(async (_name, fn) => fn(connection, config));
  return connection;
}

describe('oracle-db describe_table tool', () => {
  it('returns the table structure', async () => {
    const connection = useConnection([{ COLUMN_NAME: 'ID', DATA_TYPE: 'NUMBER' }]);

    const result = await handleDescribeTable({ table_name: 'empleados' });

    expect(result.content[0].text).toContain('"tabla": "EMPLEADOS"');
    expect(result.content[0].text).toContain('"COLUMN_NAME": "ID"');
    expect(connection.execute.mock.calls[0][1]).toEqual({
      tableName: 'EMPLEADOS',
      owner: null,
    });
  });

  it('defaults the owner to the connection schema and honors an explicit schema', async () => {
    const connection = useConnection([{ COLUMN_NAME: 'ID' }], { schema: 'SIAT' });

    await handleDescribeTable({ table_name: 'T', connection: 'test' });
    await handleDescribeTable({ table_name: 'T', schema: 'otro', connection: 'test' });

    expect(connection.execute.mock.calls[0][1].owner).toBe('SIAT');
    expect(connection.execute.mock.calls[1][1].owner).toBe('OTRO');
    expect(mockWithConnection.mock.calls.at(-1)[0]).toBe('test');
  });

  it('returns an error when the table is not found', async () => {
    useConnection([]);

    const result = await handleDescribeTable({ table_name: 'NO_EXISTE' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No se encontró la tabla "NO_EXISTE"');
  });
});
