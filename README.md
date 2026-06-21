# config-mcp

Repositorio central de servidores MCP (Model Context Protocol) para integrar asistentes AI con herramientas del ecosistema TSG.

Cada servidor es un package independiente bajo `packages/`, con herramientas de solo lectura para consultar datos desde Jira, Tempo, GitLab y otros sistemas.

## Servidores

| Proyecto | Descripción |
|---|---|
| [jira-tempo](./packages/jira-tempo/) | Consultas a Jira (issues, proyectos, epics, sprints, boards, JQL) y Tempo (worklogs, horas) |
| [gitlab](./packages/gitlab/) | Consultas a GitLab (merge requests, proyectos, ramas, archivos, pipelines) |

## Librerías compartidas

| Package | Descripción |
|---|---|
| [mcp-core](./packages/mcp-core/) | Código compartido: rate limiting, sanitización, seguridad, errores base |

## Uso

Cada servidor tiene su propio `README.md` con instrucciones de instalación, configuración y ejemplos de integración para cada cliente (OpenCode, Claude, Cursor, Windsurf, VSCode).

La configuración general en OpenCode sigue este patrón:

```json
{
  "mcp": {
    "<nombre-servidor>": {
      "command": ["node", "ruta/completa/packages/<server>/src/server.js"],
      "enabled": true,
      "type": "local",
      "env": {
        "VARIABLE": "valor"
      }
    }
  }
}
```

## Especificaciones

- [Jira + Tempo Spec](./docs/jira-tempo-spec.md) — documento de diseño y especificación técnica del servidor Jira/Tempo

## Principios

- **Solo lectura**: ningún servidor modifica datos — solo consultan
- **Rate limiting**: todas las llamadas externas pasan por control de cuota
- **Validación estricta**: inputs validados con Zod antes de cualquier llamada API
- **Sin exposición de secretos**: credenciales redactadas en logs, nunca en respuestas
