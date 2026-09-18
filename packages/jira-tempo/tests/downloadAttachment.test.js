import { describe, it, expect, jest } from '@jest/globals';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const downloadDirectory = await mkdtemp(join(tmpdir(), 'jira-tempo-download-'));
process.env.JIRA_BASE_URL ??= 'https://jira.example.test';
process.env.JIRA_EMAIL ??= 'test@example.test';
process.env.JIRA_API_TOKEN ??= 'test-token';
process.env.JIRA_ATTACHMENT_DOWNLOAD_DIR = downloadDirectory;
process.env.TEMPO_API_TOKEN ??= 'test-token';

const getAttachment = jest.fn();
jest.unstable_mockModule('../src/jira/jiraService.js', () => ({ getAttachment }));
const { handleDownloadAttachment } = await import('../src/tools/downloadAttachment.js');

describe('download_attachment handler', () => {
  afterAll(async () => rm(downloadDirectory, { recursive: true, force: true }));

  it('persists selected bytes and returns metadata without Base64', async () => {
    getAttachment.mockResolvedValue({ issueKey: 'TEST-123', attachmentId: '42', filename: '../file.bin', mimeType: 'application/octet-stream', bytes: 3, sha256: 'hash', content: Buffer.from([1, 2, 3]) });
    const result = await handleDownloadAttachment({ issueKey: 'TEST-123', attachmentId: '42' });
    const attachment = JSON.parse(result.content[0].text);
    expect(attachment).toMatchObject({ filename: '../file.bin', mimeType: 'application/octet-stream', bytes: 3, sha256: 'hash' });
    expect(attachment).not.toHaveProperty('contentBase64');
    expect(attachment.localPath).toBe(join(downloadDirectory, 'TEST-123', '42', 'file.bin'));
    await expect(readFile(attachment.localPath)).resolves.toEqual(Buffer.from([1, 2, 3]));
    expect(getAttachment).toHaveBeenCalledWith('TEST-123', '42');
  });
});
