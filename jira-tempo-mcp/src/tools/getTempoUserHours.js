import { z } from 'zod';
import { getUserHours } from '../tempo/tempoService.js';
import { schemas } from '../middleware/validation.js';

const userHoursSchema = z.object({
  accountId: schemas.accountId.shape.accountId,
  from: schemas.dateRange.shape.from,
  to: schemas.dateRange.shape.to,
});

export async function handleGetTempoUserHours(args) {
  const { accountId, from, to } = userHoursSchema.parse(args);

  const result = await getUserHours(accountId, from, to);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
