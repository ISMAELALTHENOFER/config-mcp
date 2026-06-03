import { z } from 'zod';
import { getProjectHours } from '../tempo/tempoService.js';
import { schemas } from '../middleware/validation.js';

const projectHoursSchema = z.object({
  projectKey: schemas.projectKey.shape.projectKey,
  from: schemas.dateRange.shape.from,
  to: schemas.dateRange.shape.to,
});

export async function handleGetTempoProjectHours(args) {
  const { projectKey, from, to } = projectHoursSchema.parse(args);

  const result = await getProjectHours(projectKey, from, to);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
