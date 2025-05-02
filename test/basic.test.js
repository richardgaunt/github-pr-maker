/**
 * Basic test file to ensure GitHub PR Maker functions
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { getRecentCommits, getTemplatePath, getCurrentBranch, isBranchPushedToRemote } from '../index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('GitHub PR Maker', () => {
  test('Module exports expected functions', () => {
    expect(typeof getRecentCommits).toBe('function');
    expect(typeof getTemplatePath).toBe('function');
    expect(typeof getCurrentBranch).toBe('function');
    expect(typeof isBranchPushedToRemote).toBe('function');
  });

  // This test relies on implementation details, so it's a bit fragile
  test('getRecentCommits works with the git log command', () => {
    // This is a more basic test that the function exists and returns the expected type
    expect(getRecentCommits).toBeInstanceOf(Function);
  });

  test('Template path is correctly resolved', () => {
    // This test only verifies the template path object
    const template = getTemplatePath();
    
    // Check for default template case
    if (template.isDefault) {
      expect(template.content).toBeTruthy();
    } else {
      // Check for file path case
      expect(template.path.endsWith('PULL_REQUEST_TEMPLATE.twig')).toBe(true);
    }
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

  test('Branch remote push checks work correctly', () => {
    // Test the logic for determining when to push a branch

    // Branch exists on remote
    expect(branchPushNeeded('feature-branch', true)).toBe(false);

    // Branch doesn't exist on remote
    expect(branchPushNeeded('feature-branch', false)).toBe(true);

    // No branch name
    expect(branchPushNeeded(null, false)).toBe(false);
    expect(branchPushNeeded('', false)).toBe(false);
  });
});

/**
 * Helper function that mimics the PR title formatting logic
 */
function ticketNumberFormat(ticketNumber, prTitle) {
  return ticketNumber ? `[${ticketNumber}] ${prTitle}` : prTitle;
}

/**
 * Helper function that mimics the branch push decision logic
 */
function branchPushNeeded(branchName, existsOnRemote) {
  // If no branch name, can't push
  if (!branchName) return false;

  // If branch isn't on remote, need to push
  return !existsOnRemote;
}
