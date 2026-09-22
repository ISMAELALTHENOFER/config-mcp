import { inflateRawSync } from 'node:zlib';

const MAX_STATEMENT_PREVIEW = 240;
export const MAX_SQL_ATTACHMENT_BYTES = 1024 * 1024;
export const MAX_SQL_ARCHIVE_ENTRIES = 20;
export const MAX_SQL_ARCHIVE_ENTRY_BYTES = 1024 * 1024;
export const MAX_SQL_ARCHIVE_TOTAL_BYTES = 1024 * 1024;
const SQL_MIME_TYPES = new Set([
  'text/plain',
  'text/sql',
  'application/sql',
  'application/x-sql',
]);
const ZIP_MIME_TYPES = new Set(['application/zip', 'application/x-zip-compressed']);

export function assertSafeAttachment(attachment) {
  if (
    !Number.isInteger(attachment?.size) ||
    attachment.size < 0 ||
    attachment.size > MAX_SQL_ATTACHMENT_BYTES
  ) {
    throw new Error(
      `Selected attachment exceeds the ${MAX_SQL_ATTACHMENT_BYTES}-byte limit.`,
    );
  }
}

export function assertSafeSqlAttachment(attachment) {
  const filename = attachment?.filename?.toLowerCase();
  const mimeType = attachment?.mimeType?.toLowerCase();
  if (!filename?.endsWith('.sql') && !filename?.endsWith('.zip')) {
    throw new Error('Selected attachment is not an allowed SQL text attachment.');
  }
  if (filename.endsWith('.sql') && !SQL_MIME_TYPES.has(mimeType))
    throw new Error('Selected attachment is not an allowed SQL text attachment.');
  if (filename.endsWith('.zip') && !ZIP_MIME_TYPES.has(mimeType))
    throw new Error('Selected attachment is not an allowed SQL ZIP attachment.');
  assertSafeAttachment(attachment);
}

function safeZipPath(name) {
  const normalized = name.endsWith('/') ? name.slice(0, -1) : name;
  return (
    normalized &&
    !normalized.includes('\\') &&
    !normalized.startsWith('/') &&
    !normalized.split('/').some((part) => !part || part === '.' || part === '..')
  );
}

function zipError(message) {
  throw new Error(`Selected ZIP attachment is not supported: ${message}`);
}

function decodeUtf8(bytes, message) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(message);
  }
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readZipEntries(bytes) {
  const minimumEocdOffset = Math.max(0, bytes.length - 65557);
  let eocdOffset = -1;
  for (let offset = bytes.length - 22; offset >= minimumEocdOffset; offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0 || eocdOffset + 22 > bytes.length)
    zipError('corrupt ZIP directory.');
  const disk = bytes.readUInt16LE(eocdOffset + 4);
  const directoryDisk = bytes.readUInt16LE(eocdOffset + 6);
  const count = bytes.readUInt16LE(eocdOffset + 10);
  const directorySize = bytes.readUInt32LE(eocdOffset + 12);
  const directoryOffset = bytes.readUInt32LE(eocdOffset + 16);
  if (
    disk ||
    directoryDisk ||
    count === 0xffff ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff
  )
    zipError('multi-disk and ZIP64 archives are not supported.');
  if (count > MAX_SQL_ARCHIVE_ENTRIES)
    zipError(`archive has more than ${MAX_SQL_ARCHIVE_ENTRIES} entries.`);
  if (directoryOffset + directorySize > eocdOffset)
    zipError('corrupt ZIP directory bounds.');

  const entries = [];
  let offset = directoryOffset;
  let totalBytes = 0;
  for (let index = 0; index < count; index += 1) {
    if (
      offset + 46 > directoryOffset + directorySize ||
      bytes.readUInt32LE(offset) !== 0x02014b50
    )
      zipError('corrupt ZIP entry directory.');
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const crc = bytes.readUInt32LE(offset + 16);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const nextOffset = offset + 46 + nameLength + extraLength + commentLength;
    if (nextOffset > directoryOffset + directorySize)
      zipError('corrupt ZIP entry lengths.');
    if (flags & 1) zipError('encrypted archives are not supported.');
    const name = decodeUtf8(
      bytes.subarray(offset + 46, offset + 46 + nameLength),
      'ZIP entry name is not valid UTF-8.',
    );
    if (!safeZipPath(name)) zipError(`unsafe entry path: ${name || '(empty)'}.`);
    if (
      uncompressedSize > MAX_SQL_ARCHIVE_ENTRY_BYTES ||
      totalBytes + uncompressedSize > MAX_SQL_ARCHIVE_TOTAL_BYTES
    )
      zipError(
        `SQL entries exceed the ${MAX_SQL_ARCHIVE_TOTAL_BYTES}-byte extraction limit.`,
      );
    totalBytes += uncompressedSize;
    if (localOffset + 30 > bytes.length || bytes.readUInt32LE(localOffset) !== 0x04034b50)
      zipError(`corrupt local header for ${name}.`);
    const localFlags = bytes.readUInt16LE(localOffset + 6);
    const localMethod = bytes.readUInt16LE(localOffset + 8);
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (
      localFlags !== flags ||
      localMethod !== method ||
      dataOffset + compressedSize > directoryOffset ||
      !bytes
        .subarray(localOffset + 30, localOffset + 30 + localNameLength)
        .equals(bytes.subarray(offset + 46, offset + 46 + nameLength))
    )
      zipError(`corrupt local header for ${name}.`);
    if (name.toLowerCase().endsWith('.sql')) {
      if (![0, 8].includes(method))
        zipError(`unsupported compression method for ${name}.`);
      entries.push({
        name,
        method,
        compressedSize,
        uncompressedSize,
        crc,
        data: bytes.subarray(dataOffset, dataOffset + compressedSize),
      });
    }
    offset = nextOffset;
  }
  if (!entries.length) zipError('archive contains no SQL files.');
  return entries;
}

export function inspectSqlAttachmentBytes(attachment, bytes) {
  assertSafeSqlAttachment(attachment);
  if (bytes.length > MAX_SQL_ATTACHMENT_BYTES)
    throw new Error(
      `Selected attachment exceeds the ${MAX_SQL_ATTACHMENT_BYTES}-byte limit.`,
    );
  if (!attachment.filename.toLowerCase().endsWith('.zip'))
    return [
      {
        filename: attachment.filename,
        bytes: bytes.length,
        sql: decodeUtf8(bytes, 'Selected attachment is not supported UTF-8 text.'),
      },
    ];
  return readZipEntries(bytes).map((entry) => {
    let content;
    try {
      content =
        entry.method === 0
          ? entry.data
          : inflateRawSync(entry.data, { maxOutputLength: MAX_SQL_ARCHIVE_ENTRY_BYTES });
    } catch {
      zipError(`corrupt compressed data for ${entry.name}.`);
    }
    if (
      content.length !== entry.uncompressedSize ||
      content.length > MAX_SQL_ARCHIVE_ENTRY_BYTES ||
      crc32(content) !== entry.crc
    )
      zipError(`invalid uncompressed data for ${entry.name}.`);
    return {
      filename: entry.name,
      bytes: content.length,
      sql: decodeUtf8(content, `ZIP entry ${entry.name} is not valid UTF-8 SQL text.`),
    };
  });
}

function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\r\n]*/g, ' ');
}

function normalizeStatement(statement) {
  return stripComments(statement).replace(/\s+/g, ' ').trim().replace(/;$/, '').trim();
}

function statements(sql) {
  // ponytail: quote-aware splitting only; use a dialect parser if stored-program bodies need exact statement boundaries.
  const result = [];
  let statement = '';
  let quote = null;
  for (const character of sql) {
    if ((character === "'" || character === '"') && (!quote || quote === character))
      quote = quote ? null : character;
    if (character === ';' && !quote) {
      const normalized = normalizeStatement(statement);
      if (normalized) result.push(normalized);
      statement = '';
    } else statement += character;
  }
  const normalized = normalizeStatement(statement);
  if (normalized) result.push(normalized);
  return result;
}

function classify(statement) {
  const match = statement.match(/^\s*([A-Z]+)/i);
  return match ? match[1].toUpperCase() : 'UNKNOWN';
}

function objectsIn(statement) {
  const objects = [];
  const matcher =
    /\b(?:TABLE|VIEW|INDEX|SEQUENCE|PROCEDURE|FUNCTION|TRIGGER|PACKAGE|INTO|UPDATE|FROM|JOIN)\s+([A-Z_][\w$#]*(?:\.[A-Z_][\w$#]*)?)/gi;
  for (const match of statement.matchAll(matcher)) objects.push(match[1].toUpperCase());
  return objects;
}

function risksIn(statement, type) {
  const risks = [];
  if (['DROP', 'TRUNCATE'].includes(type)) risks.push('destructivo');
  if (['INSERT', 'UPDATE', 'DELETE', 'MERGE'].includes(type))
    risks.push('modifica_datos');
  if (['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'].includes(type))
    risks.push('cambia_estructura');
  if (['GRANT', 'REVOKE'].includes(type)) risks.push('cambia_permisos');
  if (/\bEXECUTE\s+IMMEDIATE\b/i.test(statement)) risks.push('sql_dinamico');
  return risks;
}

function literalIdsIn(sql) {
  const ids = new Set(
    [...sql.matchAll(/\b(?:[A-Z_][\w$#]*_)?ID\s*=\s*(\d+)\b/gi)].map((match) => match[1]),
  );
  for (const match of sql.matchAll(
    /\bINSERT\s+INTO\s+[^()\s]+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi,
  )) {
    const columns = match[1].split(',');
    const values = match[2].split(',');
    columns.forEach((column, index) => {
      const value = values[index]?.trim();
      if (/^(?:[A-Z_][\w$#]*_)?ID$/i.test(column.trim()) && /^\d+$/.test(value))
        ids.add(value);
    });
  }
  return [...ids].sort((a, b) => Number(a) - Number(b));
}

export function describeSql(sql) {
  const parsed = statements(sql).map((statement) => {
    const type = classify(statement);
    return { type, objects: objectsIn(statement), risks: risksIn(statement, type) };
  });
  const types = [...new Set(parsed.map((entry) => entry.type))].sort();
  const objects = [...new Set(parsed.flatMap((entry) => entry.objects))].sort();
  const risks = [...new Set(parsed.flatMap((entry) => entry.risks))].sort();
  return {
    sentencias: parsed.length,
    categorias: types,
    objetosReferenciados: objects,
    indicadoresDeRiesgo: risks,
    dml: parsed.filter((entry) =>
      ['INSERT', 'UPDATE', 'DELETE', 'MERGE'].includes(entry.type),
    ).length,
    idsLiteralesNumericos: literalIdsIn(sql),
    limitacion:
      'La clasificación y los IDs literales son sintácticos y aproximados; no ejecutan SQL ni validan esquemas destino, sintaxis Oracle, dependencias, orden, pipelines ni aprobaciones.',
  };
}

export function compareSql(firstSql, secondSql) {
  const first = statements(firstSql);
  const second = statements(secondSql);
  const onlyInFirst = first.filter((statement) => !second.includes(statement));
  const onlyInSecond = second.filter((statement) => !first.includes(statement));
  return {
    equivalentesNormalizados: onlyInFirst.length === 0 && onlyInSecond.length === 0,
    primera: describeSql(firstSql),
    segunda: describeSql(secondSql),
    soloEnPrimera: onlyInFirst
      .slice(0, 10)
      .map((statement) => statement.slice(0, MAX_STATEMENT_PREVIEW)),
    soloEnSegunda: onlyInSecond
      .slice(0, 10)
      .map((statement) => statement.slice(0, MAX_STATEMENT_PREVIEW)),
    limitacion:
      'Una coincidencia normalizada no prueba equivalencia semántica ni compatibilidad con esquemas destino.',
  };
}
