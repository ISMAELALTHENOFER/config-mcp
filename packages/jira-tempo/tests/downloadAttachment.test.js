import { describe, it, expect, jest } from '@jest/globals';

const getAttachment = jest.fn();
jest.unstable_mockModule('../src/jira/jiraService.js', () => ({ getAttachment }));
const { handleDownloadAttachment } = await import('../src/tools/downloadAttachment.js');

describe('download_attachment handler', () => {
  it('validates input and returns JSON content without writing files', async () => {
    getAttachment.mockResolvedValue({ issueKey: 'TEST-123', attachmentId: '42', contentBase64: 'AQID' });
    const result = await handleDownloadAttachment({ issueKey: 'TEST-123', attachmentId: '42' });
    expect(JSON.parse(result.content[0].text).contentBase64).toBe('AQID');
    expect(getAttachment).toHaveBeenCalledWith('TEST-123', '42');
  });
});
