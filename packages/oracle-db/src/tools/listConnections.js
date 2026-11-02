import {
  CONNECTIONS,
  DEFAULT_CONNECTION,
  permissionMode,
} from '../config/connections.js';

export async function handleListConnections() {
  const conexiones = Object.values(CONNECTIONS).map((config) => ({
    nombre: config.name,
    descripcion: config.label,
    esquema: config.schema || config.user.toUpperCase(),
    permisos: permissionMode(config),
    default: config.name === DEFAULT_CONNECTION,
  }));

  return {
    content: [{ type: 'text', text: JSON.stringify({ conexiones }, null, 2) }],
  };
}
