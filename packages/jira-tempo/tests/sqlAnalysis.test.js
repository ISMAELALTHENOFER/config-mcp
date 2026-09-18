import { describe, it, expect } from '@jest/globals';
import { assertSafeSqlAttachment, compareSql, describeSql, MAX_SQL_ATTACHMENT_BYTES } from '../src/jira/sqlAnalysis.js';

describe('SQL attachment analysis', () => {
  it('accepts only bounded SQL text attachments', () => {
    expect(() => assertSafeSqlAttachment({ filename: 'change.SQL', mimeType: 'application/sql', size: 10 })).not.toThrow();
    expect(() => assertSafeSqlAttachment({ filename: 'report.pdf', mimeType: 'application/pdf', size: 10 })).toThrow('allowed SQL');
    expect(() => assertSafeSqlAttachment({ filename: 'change.sql', mimeType: 'text/plain', size: MAX_SQL_ATTACHMENT_BYTES + 1 })).toThrow('exceeds');
  });

  it('describes DDL, DML, objects, and risks without executing SQL', () => {
    expect(describeSql('-- setup\nCREATE TABLE audit_log (id INT); DELETE FROM audit_log;')).toMatchObject({
      sentencias: 2,
      categorias: ['CREATE', 'DELETE'],
      objetosReferenciados: ['AUDIT_LOG'],
      indicadoresDeRiesgo: ['cambia_estructura', 'modifica_datos'],
    });
  });

  it('compares normalized statements but states its semantic limitation', () => {
    const result = compareSql('SELECT * FROM users; -- comment', ' SELECT   * FROM users ;');
    expect(result.equivalentesNormalizados).toBe(true);
    expect(result.limitacion).toContain('no prueba equivalencia semántica');
  });

  it('does not split a string literal on semicolons', () => {
    expect(describeSql("INSERT INTO audit_log VALUES ('a;b'); SELECT * FROM audit_log;").sentencias).toBe(2);
  });
});
