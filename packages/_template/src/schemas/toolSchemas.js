// ---- TOOL SCHEMA DEFINITION PATTERN ----
// ALL_TOOLS is the single source of truth for every tool this server exposes.
// Each tool entry follows the MCP tool schema format:
//
//   {
//     name: 'snake_case_tool_name',
//     description: 'Clear, user-facing description of what the tool does.',
//     inputSchema: {
//       type: 'object',
//       properties: { ... },   // each property is a JSON Schema fragment
//       required: ['field1'],  // field names that MUST be provided
//     },
//   }
//
// The ALL_TOOLS array is consumed by both:
//   - ListTools handler (returns this array directly)
//   - Tool handler implementations (for input validation via Zod schemas)
//
// NOTE: Define corresponding Zod schemas in a schemas/ file and import them
// in your tool handlers for runtime validation.

export const ALL_TOOLS = [
  {
    name: 'example_get_resource',
    description: 'Fetches a resource by ID. Replace this with your actual tools.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier of the resource to fetch',
        },
      },
      required: ['id'],
    },
  },
];
