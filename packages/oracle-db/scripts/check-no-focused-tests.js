import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const testsDirectory = fileURLToPath(new URL('../tests/', import.meta.url));
const focusedTestPattern = /\b(?:describe|it|test)\.only\s*\(/;

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(path)));
    } else if (entry.name.endsWith('.js')) {
      files.push(path);
    }
  }

  return files;
}

const files = await collectJavaScriptFiles(testsDirectory);
const focusedTests = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (focusedTestPattern.test(source)) {
    focusedTests.push(file);
  }
}

if (focusedTests.length > 0) {
  console.error(`Focused tests are not allowed: ${focusedTests.join(', ')}`);
  process.exit(1);
}
