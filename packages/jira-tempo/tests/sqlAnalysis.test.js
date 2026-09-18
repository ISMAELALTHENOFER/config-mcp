import { describe, it, expect } from '@jest/globals';
import { deflateRawSync } from 'node:zlib';
import { assertSafeSqlAttachment, compareSql, describeSql, inspectSqlAttachmentBytes, MAX_SQL_ATTACHMENT_BYTES } from '../src/jira/sqlAnalysis.js';

function zip(name, text, method = 0) {
  let crc = 0xffffffff;
  for (const byte of Buffer.from(text)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  const nameBytes = Buffer.from(name);
  const source = Buffer.from(text);
  const data = method === 8 ? deflateRawSync(source) : source;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(method, 8); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(source.length, 22); local.writeUInt16LE(nameBytes.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(method, 10); central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(source.length, 24); central.writeUInt16LE(nameBytes.length, 28);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10); eocd.writeUInt32LE(46 + nameBytes.length, 12); eocd.writeUInt32LE(30 + nameBytes.length + data.length, 16);
  return Buffer.concat([local, nameBytes, data, central, nameBytes, eocd]);
}

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

  it('reports DML and numeric literal IDs', () => {
    expect(describeSql('INSERT INTO users (id, name) VALUES (42, \'Ana\'); UPDATE users SET active = 1 WHERE user_id = 7;')).toMatchObject({ dml: 2, idsLiteralesNumericos: ['7', '42'] });
  });

  it('inspects bounded SQL ZIP entries entirely in memory', () => {
    const archive = zip('changes/001.sql', 'INSERT INTO users (id) VALUES (42);', 8);
    expect(inspectSqlAttachmentBytes({ filename: 'changes.zip', mimeType: 'application/zip', size: archive.length }, archive)).toEqual([{ filename: 'changes/001.sql', bytes: 35, sql: 'INSERT INTO users (id) VALUES (42);' }]);
  });

  it('rejects unsafe ZIP entry paths', () => {
    const archive = zip('../escape.sql', 'SELECT 1;');
    expect(() => inspectSqlAttachmentBytes({ filename: 'changes.zip', mimeType: 'application/zip', size: archive.length }, archive)).toThrow('unsafe entry path');
  });

  it('rejects encrypted and corrupt ZIP entries', () => {
    const encrypted = zip('change.sql', 'SELECT 1;');
    encrypted.writeUInt16LE(1, 30 + Buffer.byteLength('change.sql') + Buffer.byteLength('SELECT 1;') + 8);
    expect(() => inspectSqlAttachmentBytes({ filename: 'changes.zip', mimeType: 'application/zip', size: encrypted.length }, encrypted)).toThrow('encrypted archives');

    const corrupt = zip('change.sql', 'SELECT 1;');
    corrupt[30 + Buffer.byteLength('change.sql')] ^= 1;
    expect(() => inspectSqlAttachmentBytes({ filename: 'changes.zip', mimeType: 'application/zip', size: corrupt.length }, corrupt)).toThrow('invalid uncompressed data');
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
