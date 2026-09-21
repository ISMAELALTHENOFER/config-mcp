import { describe, it, expect, jest } from '@jest/globals';

process.env.JIRA_BASE_URL ??= 'https://jira.example.test';
process.env.JIRA_EMAIL ??= 'test@example.test';
process.env.JIRA_API_TOKEN ??= 'test-token';
process.env.JIRA_ATTACHMENT_DOWNLOAD_DIR ??= 'test-downloads';
process.env.TEMPO_API_TOKEN ??= 'test-token';

const jiraGet = jest.fn();
const jiraGetBytes = jest.fn();
jest.unstable_mockModule('../src/jira/jiraClient.js', () => ({ jiraGet, jiraGetBytes }));

const { getAttachment } = await import('../src/jira/jiraService.js');

describe('Jira attachment download service', () => {
  beforeEach(() => {
    jiraGet.mockReset();
    jiraGetBytes.mockReset();
  });

  it('returns bounded binary content with verification metadata', async () => {
    jiraGet.mockResolvedValue({ fields: { attachment: [{ id: '42', filename: 'file.bin', mimeType: 'application/octet-stream', size: 3, content: '/secure/file' }] } });
    jiraGetBytes.mockResolvedValue(Buffer.from([1, 2, 3]));

    await expect(getAttachment('TEST-123', '42')).resolves.toMatchObject({
      filename: 'file.bin', mimeType: 'application/octet-stream', bytes: 3, sha256: '039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81', content: Buffer.from([1, 2, 3]),
    });
    expect(jiraGetBytes).toHaveBeenCalledWith('https://jira.example.test/secure/file', 1024 * 1024);
  });

  it('rejects attachment URLs outside the Jira origin', async () => {
    jiraGet.mockResolvedValue({ fields: { attachment: [{ id: '42', filename: 'file.bin', mimeType: 'application/octet-stream', size: 3, content: 'https://other.example/file' }] } });
    await expect(getAttachment('TEST-123', '42')).rejects.toThrow('unsupported download origin');
    expect(jiraGetBytes).not.toHaveBeenCalled();
  });
});
