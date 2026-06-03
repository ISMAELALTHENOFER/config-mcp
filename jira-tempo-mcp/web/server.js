import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';
import * as jira from '../src/jira/jiraService.js';
import * as tempo from '../src/tempo/tempoService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.WEB_PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function wrap(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req);
      res.json({ success: true, data: result });
    } catch (err) {
      logger.error('API error', { error: err.message, url: req.url });
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

app.get('/api/my-tasks', wrap(async (req) => {
  return jira.getMyTasks(req.query.maxResults || 50);
}));

app.get('/api/search', wrap(async (req) => {
  return jira.searchJql(req.query.jql, req.query.maxResults || 50);
}));

app.get('/api/issue/:key', wrap(async (req) => {
  return jira.getIssue(req.params.key);
}));

app.get('/api/project/:key', wrap(async (req) => {
  return jira.getProject(req.params.key);
}));

app.get('/api/epic/:key', wrap(async (req) => {
  return jira.getEpic(req.params.key);
}));

app.get('/api/sprint/:id', wrap(async (req) => {
  return jira.getSprint(Number(req.params.id));
}));

app.get('/api/board/:id', wrap(async (req) => {
  return jira.getBoard(Number(req.params.id));
}));

app.get('/api/releases/:projectKey', wrap(async (req) => {
  return jira.getReleases(req.params.projectKey);
}));

app.get('/api/blocked', wrap(async (req) => {
  return jira.getBlockedIssues(req.query.projectKey || null, req.query.maxResults || 50);
}));

app.get('/api/project-metrics/:projectKey', wrap(async (req) => {
  return jira.getProjectMetrics(req.params.projectKey);
}));

app.get('/api/epic-progress/:epicKey', wrap(async (req) => {
  const epicData = await jira.getEpic(req.params.epicKey);
  const completed = epicData.stories.filter((s) => s.statusCategory === 'done').length;
  const progress = epicData.totalStories > 0 ? Math.round((completed / epicData.totalStories) * 100) : 0;

  let hoursLogged = 0;
  try {
    const hours = await tempo.getIssueHours(req.params.epicKey);
    hoursLogged = hours.totalSeconds;
  } catch {}

  return {
    epic: req.params.epicKey,
    epicSummary: epicData.epic?.summary || '',
    stories: epicData.totalStories,
    completed,
    progress,
    hoursLogged,
    storiesList: epicData.stories,
  };
}));

app.get('/api/tempo/worklogs/:issueKey', wrap(async (req) => {
  return tempo.getWorklogsByIssue(req.params.issueKey);
}));

app.get('/api/tempo/user-hours', wrap(async (req) => {
  return tempo.getUserHours(req.query.accountId, req.query.from, req.query.to);
}));

app.get('/api/tempo/project-hours', wrap(async (req) => {
  return tempo.getProjectHours(req.query.projectKey, req.query.from, req.query.to);
}));

app.get('/api/tempo/issue-hours/:issueKey', wrap(async (req) => {
  return tempo.getIssueHours(req.params.issueKey);
}));

app.listen(PORT, () => {
  logger.info(`Web dashboard running at http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
});
