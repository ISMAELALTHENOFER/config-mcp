import { z } from 'zod';

const projectPathSchema = z.string().min(1, 'Project path is required');

const mrIidSchema = z
  .number({ coerce: true })
  .int()
  .positive('MR IID must be a positive integer');

const urlSchema = z.string().url('Must be a valid URL');

export function validateProjectPath(path) {
  return projectPathSchema.parse(path);
}

export function validateMrIid(iid) {
  return mrIidSchema.parse(iid);
}

export function validateUrl(url) {
  return urlSchema.parse(url);
}
