import { z } from 'zod';

const repositorySchema = z.string().min(1, 'Repository is required');

const pullNumberSchema = z
  .number({ coerce: true })
  .int()
  .positive('Pull request number must be a positive integer');

const urlSchema = z.string().url('Must be a valid URL');

export function validateRepository(repository) {
  return repositorySchema.parse(repository);
}

export function validatePullNumber(number) {
  return pullNumberSchema.parse(number);
}

export function validateUrl(url) {
  return urlSchema.parse(url);
}
