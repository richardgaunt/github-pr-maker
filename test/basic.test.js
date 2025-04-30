/**
 * Basic test file to ensure GitHub PR Maker functions
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { getRecentCommits, getTemplatePath } from '../index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('GitHub PR Maker', () => {
  test('Module exports expected functions', () => {
    expect(typeof getRecentCommits).toBe('function');
    expect(typeof getTemplatePath).toBe('function');
  });

  test('Template path is correctly resolved', () => {
    // This test only verifies the path structure, not actual file existence
    expect(getTemplatePath().endsWith('PULL_REQUEST_TEMPLATE.twig')).toBe(true);
  });
});
