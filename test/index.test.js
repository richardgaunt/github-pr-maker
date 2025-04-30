import { execSync } from 'child_process';

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

jest.mock('@inquirer/prompts', () => ({
  input: jest.fn(),
  confirm: jest.fn()
}));

jest.mock('twig', () => ({
  default: {
    renderFile: jest.fn()
  }
}));

// Import our functions after mocking
const { getRecentCommits, checkGitRepository, checkGhCli, createPR } = require('../index.js');

describe('Git utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentCommits', () => {
    it('should parse git log output correctly', () => {
      // Mock the git log output
      execSync.mockReturnValueOnce(Buffer.from(
        'abc123|||Fix navigation bar|||Fixed styling issues\n' +
        'def456|||Add user auth|||Implemented JWT auth'
      ));

      const commits = getRecentCommits(2);

      expect(execSync).toHaveBeenCalledWith('git log -2 --pretty=format:%h|||%s|||%b');
      expect(commits).toEqual([
        {
          hash: 'abc123',
          subject: 'Fix navigation bar',
          body: 'Fixed styling issues'
        },
        {
          hash: 'def456',
          subject: 'Add user auth',
          body: 'Implemented JWT auth'
        }
      ]);
    });

    it('should handle commits with empty bodies', () => {
      execSync.mockReturnValueOnce(Buffer.from(
        'abc123|||Fix bug|||\n' +
        'def456|||Add feature|||This is a description'
      ));

      const commits = getRecentCommits(2);

      expect(commits).toEqual([
        {
          hash: 'abc123',
          subject: 'Fix bug',
          body: ''
        },
        {
          hash: 'def456',
          subject: 'Add feature',
          body: 'This is a description'
        }
      ]);
    });

    it('should return empty array on error', () => {
      execSync.mockImplementationOnce(() => {
        throw new Error('git command failed');
      });

      const commits = getRecentCommits();

      expect(commits).toEqual([]);
    });
  });

  describe('checkGitRepository', () => {
    it('should return true when in a git repo', () => {
      execSync.mockReturnValueOnce(Buffer.from('true'));

      const result = checkGitRepository();

      expect(execSync).toHaveBeenCalledWith('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      expect(result).toBe(true);
    });

    it('should return false when not in a git repo', () => {
      execSync.mockImplementationOnce(() => {
        throw new Error('not a git repository');
      });

      const result = checkGitRepository();

      expect(result).toBe(false);
    });
  });

  describe('checkGhCli', () => {
    it('should return true when gh is installed', () => {
      execSync.mockReturnValueOnce(Buffer.from('gh version 2.0.0'));

      const result = checkGhCli();

      expect(execSync).toHaveBeenCalledWith('gh --version', { stdio: 'ignore' });
      expect(result).toBe(true);
    });

    it('should return false when gh is not installed', () => {
      execSync.mockImplementationOnce(() => {
        throw new Error('command not found: gh');
      });

      const result = checkGhCli();

      expect(result).toBe(false);
    });
  });

  describe('createPR', () => {
    it('should create a PR successfully', async () => {
      execSync.mockReturnValueOnce(Buffer.from('https://github.com/user/repo/pull/123'));

      const result = await createPR('Test PR', 'PR body');

      expect(execSync).toHaveBeenCalledWith('gh pr create --title "Test PR" --body "PR body"');
      expect(result).toEqual({
        success: true,
        url: 'https://github.com/user/repo/pull/123'
      });
    });

    it('should handle PR creation errors', async () => {
      execSync.mockImplementationOnce(() => {
        throw new Error('Failed to create PR');
      });

      const result = await createPR('Test PR', 'PR body');

      expect(result).toEqual({
        success: false,
        error: 'Failed to create PR'
      });
    });
  });
});
