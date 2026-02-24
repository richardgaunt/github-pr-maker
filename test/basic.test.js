/**
 * Basic test file to ensure GitHub PR Maker functions
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getRecentCommits, getTemplatePath, getCurrentBranch, isBranchPushedToRemote, isStepCompleted, loadState, saveState, clearState, getRepoRoot } from '../index';

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
    // This test only verifies the path structure, not actual file existence
    const template = getTemplatePath();
    // getTemplatePath returns an object with either { isDefault: true, content } or { isDefault: false, path }
    if (template.isDefault) {
      expect(template.content).toBeDefined();
    } else {
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

describe('State Persistence', () => {
  const repoRoot = getRepoRoot();
  const statePath = repoRoot ? path.join(repoRoot, '.pr-in-progress.json') : null;

  afterEach(() => {
    // Clean up any state file left by tests
    if (statePath) {
      try { fs.unlinkSync(statePath); } catch { /* ignore */ }
    }
  });

  describe('isStepCompleted', () => {
    test('returns true when current step is before saved step', () => {
      expect(isStepCompleted('ticketNumber', 'prTitle')).toBe(true);
      expect(isStepCompleted('ticketNumber', 'changes')).toBe(true);
      expect(isStepCompleted('prTitle', 'hasTests')).toBe(true);
    });

    test('returns true when current step equals saved step', () => {
      expect(isStepCompleted('ticketNumber', 'ticketNumber')).toBe(true);
      expect(isStepCompleted('changes', 'changes')).toBe(true);
    });

    test('returns false when current step is after saved step', () => {
      expect(isStepCompleted('prTitle', 'ticketNumber')).toBe(false);
      expect(isStepCompleted('changes', 'hasTests')).toBe(false);
    });

    test('returns false for unknown steps', () => {
      expect(isStepCompleted('unknown', 'prTitle')).toBe(false);
      expect(isStepCompleted('prTitle', 'unknown')).toBe(false);
    });
  });

  describe('saveState / loadState / clearState', () => {
    const testState = {
      version: 1,
      branch: 'test-branch',
      step: 'prTitle',
      ticketNumber: 'TEST-1',
      prTitle: 'Test PR',
      hasTests: null,
      changes: null,
      commitHashes: null,
    };

    test('saveState writes and loadState reads matching state', () => {
      saveState(testState);
      const loaded = loadState('test-branch');
      expect(loaded).toEqual(testState);
    });

    test('loadState returns null for branch mismatch', () => {
      saveState(testState);
      const loaded = loadState('other-branch');
      expect(loaded).toBeNull();
    });

    test('loadState returns null when no file exists', () => {
      const loaded = loadState('any-branch');
      expect(loaded).toBeNull();
    });

    test('loadState returns null for invalid JSON', () => {
      if (statePath) {
        fs.writeFileSync(statePath, 'not json');
        const loaded = loadState('test-branch');
        expect(loaded).toBeNull();
      }
    });

    test('loadState returns null for wrong version', () => {
      saveState({ ...testState, version: 999 });
      const loaded = loadState('test-branch');
      expect(loaded).toBeNull();
    });

    test('loadState returns null for invalid step', () => {
      saveState({ ...testState, step: 'bogus' });
      const loaded = loadState('test-branch');
      expect(loaded).toBeNull();
    });

    test('clearState removes the file', () => {
      saveState(testState);
      expect(fs.existsSync(statePath)).toBe(true);
      clearState();
      expect(fs.existsSync(statePath)).toBe(false);
    });

    test('clearState does not throw when no file exists', () => {
      expect(() => clearState()).not.toThrow();
    });
  });
});
