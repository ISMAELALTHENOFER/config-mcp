import { getTeamHours } from '../tempo/tempoService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetTempoTeamHours(args) {
  const { teamId } = validate(schemas.teamId, args);

  const result = await getTeamHours(teamId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
