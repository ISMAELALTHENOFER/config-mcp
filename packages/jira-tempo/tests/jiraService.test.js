import { describe, it, expect, jest } from '@jest/globals';

process.env.JIRA_BASE_URL ??= 'https://jira.example.test';
process.env.JIRA_EMAIL ??= 'test@example.test';
process.env.JIRA_API_TOKEN ??= 'test-token';
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

  it('returns bounded binary content as base64 with verification metadata', async () => {
    jiraGet.mockResolvedValue({ fields: { attachment: [{ id: '42', filename: 'file.bin', mimeType: 'application/octet-stream', size: 3, content: '/secure/file' }] } });
    jiraGetBytes.mockResolvedValue(Buffer.from([1, 2, 3]));

    await expect(getAttachment('TEST-123', '42')).resolves.toMatchObject({
      filename: 'file.bin', mimeType: 'application/octet-stream', bytes: 3, contentBase64: 'AQID',
    });
    expect(jiraGetBytes).toHaveBeenCalledWith('https://jira.example.test/secure/file', 1024 * 1024);
  });

  it('rejects attachment URLs outside the Jira origin', async () => {
    jiraGet.mockResolvedValue({ fields: { attachment: [{ id: '42', filename: 'file.bin', mimeType: 'application/octet-stream', size: 3, content: 'https://other.example/file' }] } });
    await expect(getAttachment('TEST-123', '42')).rejects.toThrow('unsupported download origin');
    expect(jiraGetBytes).not.toHaveBeenCalled();
  });
});
