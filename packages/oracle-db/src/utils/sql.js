const CLOSING_QUOTE_DELIMITER = { '[': ']', '{': '}', '(': ')', '<': '>' };

// Strips comments and blanks out string literals and quoted identifiers, so
// their content can never hide or fake keywords, ';' or comment markers.
// Returns null for an unterminated literal or comment.
function normalize(sql) {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const char = sql[i];
    if (sql.startsWith('--', i)) {
      const end = sql.slice(i).search(/[\r\n]/);
      i = end === -1 ? sql.length : i + end;
      out += ' ';
    } else if (sql.startsWith('/*', i)) {
      const end = sql.indexOf('*/', i + 2);
      if (end === -1) return null;
      i = end + 2;
      out += ' ';
    } else if ((char === 'q' || char === 'Q') && sql[i + 1] === "'") {
      const open = sql[i + 2];
      if (open === undefined) return null;
      const end = sql.indexOf(`${CLOSING_QUOTE_DELIMITER[open] ?? open}'`, i + 3);
      if (end === -1) return null;
      i = end + 2;
      out += "''";
    } else if (char === "'" || char === '"') {
      let j = i + 1;
      for (;;) {
        j = sql.indexOf(char, j);
        if (j === -1) return null;
        if (sql[j + 1] !== char) break;
        j += 2; // doubled quote is an escaped quote
      }
      i = j + 1;
      out += char + char;
    } else {
      out += char;
      i += 1;
    }
  }
  return out.trim().replace(/;$/, '').trim().toUpperCase();
}

const INLINE_PLSQL = /\bWITH\s+(FUNCTION|PROCEDURE)\b/;

export function isReadOnlySql(sql) {
  const normalizedSql = normalize(sql);
  if (normalizedSql === null || !/^(SELECT|WITH)\b/.test(normalizedSql)) {
    return false;
  }

  return (
    !/\b(INSERT|UPDATE|DELETE|MERGE|ALTER|DROP|TRUNCATE|CREATE|GRANT|REVOKE)\b/.test(
      normalizedSql,
    ) &&
    !/\bFOR\s+UPDATE\b/.test(normalizedSql) &&
    !INLINE_PLSQL.test(normalizedSql) &&
    !normalizedSql.includes(';')
  );
}

// Returns select | insert | update | delete | merge | ddl | plsql | unknown.
export function classifySql(sql) {
  const normalizedSql = normalize(sql);
  if (normalizedSql === null) return 'unknown';
  if (INLINE_PLSQL.test(normalizedSql)) return 'plsql';
  if (/^(SELECT|WITH)\b/.test(normalizedSql)) return 'select';
  const dml = /^(INSERT|UPDATE|DELETE|MERGE)\b/.exec(normalizedSql);
  if (dml) {
    // A ';' outside literals means a second statement or an embedded block.
    return normalizedSql.includes(';') ? 'unknown' : dml[1].toLowerCase();
  }
  if (/^(CREATE|ALTER|DROP|TRUNCATE|RENAME|COMMENT|GRANT|REVOKE)\b/.test(normalizedSql))
    return 'ddl';
  if (/^(BEGIN|DECLARE|CALL|EXEC|EXECUTE)\b/.test(normalizedSql)) return 'plsql';
  return 'unknown';
}

// Returns null when allowed, otherwise the rejection message.
export function checkWritePermission(connection, kind) {
  if (kind === 'select') {
    return 'Use the query tool for SELECT/WITH statements.';
  }
  if (kind === 'plsql') {
    return 'PL/SQL blocks cannot be executed. Read PL/SQL source with query (for example ALL_SOURCE).';
  }
  if (kind === 'unknown') {
    return 'Unrecognized statement. Allowed: one INSERT, UPDATE, DELETE, MERGE or DDL statement, as permitted by the connection.';
  }
  if (!connection.permissions.includes(kind)) {
    return `Connection "${connection.name}" does not allow ${kind.toUpperCase()} (allowed: ${connection.permissions.join(', ')}). Add "${kind}" to its "permissions" in connections.json.`;
  }
  return null;
}
