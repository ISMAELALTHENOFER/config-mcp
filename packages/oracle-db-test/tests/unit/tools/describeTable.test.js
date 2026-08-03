import { describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);

const { handleDescribeTable } = await import('../../../src/tools/describeTable.js');

describe('oracle-db-test describe_table tool', () => {
  it('returns the table structure', async () => {
    const connection = {
      execute: jest.fn().mockResolvedValue({
        rows: [{ COLUMN_NAME: 'ID', DATA_TYPE: 'NUMBER' }],
      }),
    };
    mockWithConnection.mockImplementation(async (fn) => fn(connection));

    const result = await handleDescribeTable({ table_name: 'EMPLEADOS' });

    expect(result.content[0].text).toContain('"tabla": "EMPLEADOS"');
    expect(result.content[0].text).toContain('"COLUMN_NAME": "ID"');
  });

  it('returns an error when the table is not found', async () => {
    const connection = { execute: jest.fn().mockResolvedValue({ rows: [] }) };
    mockWithConnection.mockImplementation(async (fn) => fn(connection));

    const result = await handleDescribeTable({ table_name: 'NO_EXISTE' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No se encontró la tabla "NO_EXISTE"');
  });
});
