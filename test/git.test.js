// @ts-check
import { execSync } from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Import our functions
import { getRecentCommits, checkGitRepository, checkGhCli } from '../index';

describe('Git utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentCommits', () => {
    it('should parse git log output correctly', () => {
      // Mock the git log output
      execSync.mockReturnValueOnce(Buffer.from(
        'abc123|||Fix navigation bar|||Fixed styling issues in the navigation bar\n' +
        'def456|||Add user authentication|||Implemented JWT authentication\n' +
        'ghi789|||Update README|||Updated installation instructions'
      ));

      const commits = getRecentCommits(3);

      // Verify the command that was executed
      expect(execSync).toHaveBeenCalledWith('git log -3 --pretty=format:%h|||%s|||%b');

      // Verify the parsed output
      expect(commits).toEqual([
        {
          hash: 'abc123',
          subject: 'Fix navigation bar',
          body: 'Fixed styling issues in the navigation bar'
        },
        {
          hash: 'def456',
          subject: 'Add user authentication',
          body: 'Implemented JWT authentication'
        },
        {
          hash: 'ghi789',
          subject: 'Update README',
          body: 'Updated installation instructions'
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
});
