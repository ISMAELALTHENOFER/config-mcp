import { getEpic } from '../jira/jiraService.js';
import { getIssueHours } from '../tempo/tempoService.js';
import { validate, schemas } from '../middleware/validation.js';
import { aggregateHours } from '../tempo/tempoMapper.js';

export async function handleGetEpicProgress(args) {
  const { epicKey } = validate(schemas.epicKey, args);

  const epicData = await getEpic(epicKey);

  const completed = epicData.stories.filter(
    (s) => s.statusCategory === 'done',
  ).length;
  const progress = epicData.totalStories > 0
    ? Math.round((completed / epicData.totalStories) * 100)
    : 0;

  let hoursLogged = 0;
  try {
    const hoursResult = await getIssueHours(epicKey);
    hoursLogged = hoursResult.totalSeconds;
  } catch {
    hoursLogged = 0;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            epic: epicKey,
            epicSummary: epicData.epic?.summary || '',
            stories: epicData.totalStories,
            completed,
            progress,
            hoursLogged,
            hoursFormatted: aggregateHours(
              epicData.stories.map(() => ({ timeSpentSeconds: 0 })),
            ).formatted,
          },
          null,
          2,
        ),
      },
    ],
  };
}
