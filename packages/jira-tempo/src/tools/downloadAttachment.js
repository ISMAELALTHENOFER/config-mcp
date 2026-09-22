import { getAttachment } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';
import { env } from '../config/env.js';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve } from 'node:path';

function safeFilename(filename) {
  const name = basename(filename.replaceAll('\\', '/'));
  if (!name || name === '.' || name === '..')
    throw new Error('Selected attachment has an unsafe filename.');
  return name;
}

async function persistAttachment({ issueKey, attachmentId, filename, content }) {
  const root = resolve(env.JIRA_ATTACHMENT_DOWNLOAD_DIR);
  const destination = resolve(root, issueKey, attachmentId, safeFilename(filename));
  if (
    isAbsolute(relative(root, destination)) ||
    relative(root, destination).startsWith('..')
  ) {
    throw new Error('Selected attachment resolves outside the download directory.');
  }

  await mkdir(resolve(root, issueKey, attachmentId), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: 'wx' });
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return destination;
}

export async function handleDownloadAttachment(args) {
  const { issueKey, attachmentId } = validate(schemas.attachment, args);
  const attachment = await getAttachment(issueKey, attachmentId);
  const { content, ...metadata } = attachment;
  const localPath = await persistAttachment({
    issueKey,
    attachmentId,
    ...metadata,
    content,
  });
  return {
    content: [
      { type: 'text', text: JSON.stringify({ ...metadata, localPath }, null, 2) },
    ],
  };
}
