import { getUserHours } from '../tempo/tempoService.js';
import { summarizeWorkload } from '../tempo/workloadSummary.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetTeamWorkloadSummary(args) {
  const input = validate(schemas.teamWorkloadSummary, args);
  const results = await Promise.all(
    input.accountIds.map((accountId) => getUserHours(accountId, input.from, input.to)),
  );
  return {
    content: [
      { type: 'text', text: JSON.stringify(summarizeWorkload(results, input), null, 2) },
    ],
  };
}
