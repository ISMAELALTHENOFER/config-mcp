# config-mcp

Repositorio central de servidores MCP (Model Context Protocol) para integrar asistentes AI con herramientas del ecosistema TSG.

Cada servidor es un package independiente bajo `packages/`, con herramientas de solo lectura para consultar datos desde Jira, Tempo, GitLab, Oracle y otros sistemas.

## Servidores

| Proyecto | Descripción |
|---|---|
| [jira-tempo](./packages/jira-tempo/) | Consultas a Jira (issues, proyectos, epics, sprints, boards, JQL) y Tempo (worklogs, horas, métricas) |
| [gitlab](./packages/gitlab/) | Consultas a GitLab (merge requests, proyectos, ramas, archivos, pipelines) |
| [oracle-db](./packages/oracle-db/) | Consultas a Oracle DB (query SELECT, listar tablas, describir columnas, ping) |

## Librerías compartidas

| Package | Descripción |
|---|---|
| [mcp-core](./packages/mcp-core/) | Código compartido: rate limiting, sanitización, errores base |
| [_template](./packages/_template/) | Scaffold template para crear nuevos servidores MCP |

## Configuración centralizada

Todas las variables de entorno se centralizan en un **único archivo `.env`** en la raíz del repositorio:

```bash
# 1. Copiar el ejemplo
cp .env.example .env

# 2. Editar con tus credenciales
# .env contiene TODAS las variables para todos los servidores
```

Cada servidor carga automáticamente este `.env` al arrancar. No es necesario configurar variables por separado por servidor.

### Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `ORACLE_USER` | Usuario de Oracle DB | oracle-db |
| `ORACLE_PASSWORD` | Password de Oracle DB | oracle-db |
| `ORACLE_CONNECT_STRING` | Cadena de conexión Oracle (host:puerto/SID) | oracle-db |
| `JIRA_BASE_URL` | URL de la instancia Jira | jira-tempo |
| `JIRA_EMAIL` | Email de la cuenta Jira | jira-tempo |
| `JIRA_API_TOKEN` | API token de Jira | jira-tempo |
| `TEMPO_API_TOKEN` | API token de Tempo | jira-tempo |
| `GITLAB_BASE_URL` | URL base de la instancia GitLab | gitlab |
| `GITLAB_PERSONAL_ACCESS_TOKEN` | Token de acceso personal con alcance `read_api` | gitlab |
| `MCP_LOG_LEVEL` | Nivel de log: error / warn / info / debug | No |
| `MCP_PORT` | Puerto del servidor HTTP (default: 3000). Usado por jira-tempo y gitlab. | No |

## Uso en OpenCode

Una vez clonado el repo y configurado el `.env`, registrar los servidores en `opencode.json`:

```json
{
  "mcp": {
    "jira-tempo": {
      "command": ["node", "ruta/completa/config-mcp/packages/jira-tempo/src/server.js"],
      "enabled": true,
      "type": "local"
    },
    "gitlab-mcp": {
      "command": ["node", "ruta/completa/config-mcp/packages/gitlab/src/server.js"],
      "enabled": true,
      "type": "local"
    },
    "oracle-db": {
      "command": ["node", "ruta/completa/config-mcp/packages/oracle-db/src/server.js"],
      "enabled": true,
      "type": "local"
    }
  }
}
```

> **Nota**: No es necesario incluir `environment` en la configuración de OpenCode. Cada servidor lee las credenciales directamente del `.env` raíz.

## Especificaciones

- [Jira + Tempo Spec](./docs/jira-tempo-spec.md) — documento de diseño y especificación técnica del servidor Jira/Tempo
- [GitLab Spec](./docs/gitlab-spec.md) — documento de diseño y especificación técnica del servidor GitLab

## Principios

- **Solo lectura**: ningún servidor modifica datos — solo consultan
- **Rate limiting**: todas las llamadas externas pasan por control de cuota
- **Validación estricta**: inputs validados con Zod antes de cualquier llamada API
- **Sin exposición de secretos**: credenciales redactadas en logs, nunca en respuestas
- **Configuración centralizada**: un solo `.env` en la raíz para todos los servidores
