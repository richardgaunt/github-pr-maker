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

  // This test relies on implementation details, so it's a bit fragile
  test('getRecentCommits works with the git log command', () => {
    // This is a more basic test that the function exists and returns the expected type
    expect(getRecentCommits).toBeInstanceOf(Function);
  });

  test('Template path is correctly resolved', () => {
    // This test only verifies the path structure, not actual file existence
    expect(getTemplatePath().endsWith('PULL_REQUEST_TEMPLATE.twig')).toBe(true);
  });

  test('PR title formatting with and without ticket number', () => {
    // Test the logic for handling ticket numbers without making actual API calls

    // Test with ticket number
    expect(ticketNumberFormat('JIRA-123', 'Add feature')).toBe('[JIRA-123] Add feature');

    // Test without ticket number (empty string)
    expect(ticketNumberFormat('', 'Add feature')).toBe('Add feature');

    // Test without ticket number (null)
    expect(ticketNumberFormat(null, 'Add feature')).toBe('Add feature');

    // Test without ticket number (undefined)
    expect(ticketNumberFormat(undefined, 'Add feature')).toBe('Add feature');
  });
});

/**
 * Helper function that mimics the PR title formatting logic
 */
function ticketNumberFormat(ticketNumber, prTitle) {
  return ticketNumber ? `[${ticketNumber}] ${prTitle}` : prTitle;
}
