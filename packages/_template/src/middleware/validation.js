// ---- SCHEMA-BASED VALIDATION PATTERN ----
// Every MCP tool validates its inputs through a Zod schema factory.
// This pattern guarantees type-safety and produces self-documenting error
// messages that bubble up through the MCP error response.
//
// Steps to add validation for a new tool:
//   1. Define your Zod schema in src/schemas/ (see toolSchemas.js)
//   2. Create a validate() call in the tool handler before any business logic
//   3. Return the validated (and possibly transformed) data
//
// Example — replace with your actual schemas:
// import { z } from 'zod';

/**
 * Generic validation wrapper.
 * Usage: const { id } = validate(someSchema, args);
 */
export function validate(schema, args) {
  const result = schema.safeParse(args);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Validation failed: ${messages}`);
  }
  return result.data;
}
