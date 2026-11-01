function normalize(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\r\n]*/g, ' ')
    .trim()
    .replace(/;$/, '')
    .trim()
    .toUpperCase();
}

export function isReadOnlySql(sql) {
  const normalizedSql = normalize(sql);

  if (!/^(SELECT|WITH)\b/.test(normalizedSql)) {
    return false;
  }

  return (
    !/\b(INSERT|UPDATE|DELETE|MERGE|ALTER|DROP|TRUNCATE|CREATE|GRANT|REVOKE)\b/.test(
      normalizedSql,
    ) &&
    !/\bFOR\s+UPDATE\b/.test(normalizedSql) &&
    !normalizedSql.includes(';')
  );
}

// Returns read | dml | ddl | plsql | unknown.
export function classifySql(sql) {
  const normalizedSql = normalize(sql);
  if (/^(SELECT|WITH)\b/.test(normalizedSql)) return 'read';
  if (/^(INSERT|UPDATE|DELETE|MERGE)\b/.test(normalizedSql)) {
    // A ';' inside DML means a second statement or an embedded block.
    return normalizedSql.includes(';') ? 'unknown' : 'dml';
  }
  if (/^(CREATE|ALTER|DROP|TRUNCATE|RENAME|COMMENT|GRANT|REVOKE)\b/.test(normalizedSql))
    return 'ddl';
  if (/^(BEGIN|DECLARE|CALL|EXEC|EXECUTE)\b/.test(normalizedSql)) return 'plsql';
  return 'unknown';
}

// Returns null when allowed, otherwise the rejection message.
export function checkWritePermission(connection, kind) {
  if (kind === 'read') {
    return 'Use the query tool for SELECT/WITH statements.';
  }
  if (kind === 'plsql') {
    return 'PL/SQL blocks cannot be executed. Read PL/SQL source with query (for example ALL_SOURCE).';
  }
  if (kind === 'unknown') {
    return 'Unrecognized statement. Allowed: INSERT/UPDATE/DELETE/MERGE (single statement) and, with allowDdl, DDL.';
  }
  if (!connection.write) {
    return `Connection "${connection.name}" is read-only. Set "write": true in connections.json to allow DML.`;
  }
  if (kind === 'ddl' && !connection.allowDdl) {
    return `Connection "${connection.name}" allows DML but not DDL. Set "allowDdl": true in connections.json to allow it.`;
  }
  return null;
}
