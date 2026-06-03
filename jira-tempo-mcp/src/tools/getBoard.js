import { getBoard } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetBoard(args) {
  const { boardId } = validate(schemas.boardId, args);

  const result = await getBoard(boardId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
