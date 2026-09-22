import { describe, it, expect, jest } from '@jest/globals';

process.env.JIRA_BASE_URL ??= 'https://jira.example.test';
process.env.JIRA_EMAIL ??= 'test@example.test';
process.env.JIRA_API_TOKEN ??= 'test-token';
process.env.TEMPO_API_TOKEN ??= 'test-token';

const jiraGet = jest.fn();
const tempoGet = jest.fn();
const getEpic = jest.fn();
const getIssueHierarchy = jest.fn();
jest.unstable_mockModule('../src/jira/jiraClient.js', () => ({ jiraGet }));
jest.unstable_mockModule('../src/tempo/tempoClient.js', () => ({ tempoGet }));
jest.unstable_mockModule('../src/jira/jiraService.js', () => ({
  getEpic,
  getIssueHierarchy,
}));

const { getIssueHours } = await import('../src/tempo/tempoService.js');

const worklogs = (issueKey, seconds) => ({
  results: [{ id: issueKey, issue: { id: issueKey, key: issueKey }, timeSpentSeconds: seconds }],
});

describe('Tempo issue hours', () => {
  beforeEach(() => {
    jiraGet.mockReset();
    tempoGet.mockReset();
    getEpic.mockReset();
    getIssueHierarchy.mockReset();
  });

  it('preserves direct issue totals', async () => {
    jiraGet.mockResolvedValue({ id: '1', fields: { issuetype: { name: 'Story' } } });
    tempoGet.mockResolvedValue(worklogs('TEST-1', 3600));

    const result = await getIssueHours('TEST-1');

    expect(result).toMatchObject({
      issueKey: 'TEST-1', totalSeconds: 3600, formatted: '1h', worklogCount: 1,
    });
    expect(Object.keys(result).sort()).toEqual([
      'formatted', 'issueKey', 'totalSeconds', 'worklogCount', 'worklogs',
    ]);
    expect(tempoGet).toHaveBeenCalledWith('/worklogs/issue/1');
    expect(getEpic).not.toHaveBeenCalled();
  });

  it('aggregates Epic, story, and subtask worklogs', async () => {
    jiraGet
      .mockResolvedValueOnce({ id: '100', fields: { issuetype: { name: 'Epic' } } })
      .mockResolvedValueOnce({ id: '101' })
      .mockResolvedValueOnce({ id: '102' });
    getEpic.mockResolvedValue({ stories: [{ key: 'TEST-2' }] });
    getIssueHierarchy.mockResolvedValue({ children: [{ key: 'TEST-3' }] });
    tempoGet
      .mockResolvedValueOnce(worklogs('TEST-1', 600))
      .mockResolvedValueOnce(worklogs('TEST-2', 1200))
      .mockResolvedValueOnce(worklogs('TEST-3', 1800));

    const result = await getIssueHours('TEST-1');

    expect(result).toMatchObject({
      issueKey: 'TEST-1', totalSeconds: 3600, formatted: '1h', worklogCount: 3,
    });
    expect(result.breakdown).toEqual([
      expect.objectContaining({
        issueKey: 'TEST-1', totalSeconds: 600, formatted: '10m', worklogCount: 1,
        worklogs: [expect.objectContaining({ issueKey: 'TEST-1', timeSpentSeconds: 600 })],
      }),
      expect.objectContaining({
        issueKey: 'TEST-2', totalSeconds: 1200, formatted: '20m', worklogCount: 1,
        worklogs: [expect.objectContaining({ issueKey: 'TEST-2', timeSpentSeconds: 1200 })],
      }),
      expect.objectContaining({
        issueKey: 'TEST-3', totalSeconds: 1800, formatted: '30m', worklogCount: 1,
        worklogs: [expect.objectContaining({ issueKey: 'TEST-3', timeSpentSeconds: 1800 })],
      }),
    ]);
  });
});
