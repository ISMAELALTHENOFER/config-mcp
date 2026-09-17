const MAX_STATEMENT_PREVIEW = 240;
export const MAX_SQL_ATTACHMENT_BYTES = 1024 * 1024;
const SQL_MIME_TYPES = new Set(['text/plain', 'text/sql', 'application/sql', 'application/x-sql']);

export function assertSafeSqlAttachment(attachment) {
  if (!attachment?.filename?.toLowerCase().endsWith('.sql') || !SQL_MIME_TYPES.has(attachment.mimeType?.toLowerCase())) {
    throw new Error('Selected attachment is not an allowed SQL text attachment.');
  }
  if (!Number.isInteger(attachment.size) || attachment.size < 0 || attachment.size > MAX_SQL_ATTACHMENT_BYTES) {
    throw new Error(`Selected attachment exceeds the ${MAX_SQL_ATTACHMENT_BYTES}-byte limit.`);
  }
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
    if ((character === "'" || character === '"') && (!quote || quote === character)) quote = quote ? null : character;
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
  const matcher = /\b(?:TABLE|VIEW|INDEX|SEQUENCE|PROCEDURE|FUNCTION|TRIGGER|PACKAGE|INTO|UPDATE|FROM|JOIN)\s+([A-Z_][\w$#]*(?:\.[A-Z_][\w$#]*)?)/gi;
  for (const match of statement.matchAll(matcher)) objects.push(match[1].toUpperCase());
  return objects;
}

function risksIn(statement, type) {
  const risks = [];
  if (['DROP', 'TRUNCATE'].includes(type)) risks.push('destructivo');
  if (['INSERT', 'UPDATE', 'DELETE', 'MERGE'].includes(type)) risks.push('modifica_datos');
  if (['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'].includes(type)) risks.push('cambia_estructura');
  if (['GRANT', 'REVOKE'].includes(type)) risks.push('cambia_permisos');
  if (/\bEXECUTE\s+IMMEDIATE\b/i.test(statement)) risks.push('sql_dinamico');
  return risks;
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
    limitacion: 'La clasificación y el conteo son sintácticos y aproximados; no ejecutan SQL ni validan esquemas destino.',
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
    soloEnPrimera: onlyInFirst.slice(0, 10).map((statement) => statement.slice(0, MAX_STATEMENT_PREVIEW)),
    soloEnSegunda: onlyInSecond.slice(0, 10).map((statement) => statement.slice(0, MAX_STATEMENT_PREVIEW)),
    limitacion: 'Una coincidencia normalizada no prueba equivalencia semántica ni compatibilidad con esquemas destino.',
  };
}
