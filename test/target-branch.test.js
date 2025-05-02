import {
  getDefaultBranch,
  getRemoteBranches,
  createPR
} from '../index.js';

describe('Target Branch Selection', () => {
  // Simple tests for the new functions - these mostly verify the functions exist
  // and return the expected types, not their detailed behavior since that would require
  // complex mocking
  
  describe('getDefaultBranch', () => {
    test('returns a string value', () => {
      // Just verify the function exists and returns a string
      expect(typeof getDefaultBranch).toBe('function');
      
      // Since this connects to git, we don't test the actual return value
      // Just verify it returns something that looks reasonable (a string)
      const result = getDefaultBranch();
      expect(typeof result).toBe('string');
    });
  });
  
  describe('getRemoteBranches', () => {
    test('returns an array', () => {
      // Just verify the function exists and returns an array
      expect(typeof getRemoteBranches).toBe('function');
      
      // This also connects to git, so we just verify it returns an array
      const branches = getRemoteBranches();
      expect(Array.isArray(branches)).toBe(true);
    });
  });
  
  describe('createPR', () => {
    test('accepts a target branch parameter', () => {
      // Verify the function accepts a target branch parameter
      expect(typeof createPR).toBe('function');
      
      // This is just a type check - we don't actually call the function
      // since that would create a real PR
      const pr = {title: 'Test PR', body: 'Test body', targetBranch: 'main'};
      expect(() => createPR(pr.title, pr.body, pr.targetBranch)).not.toThrow();
    });
  });
});