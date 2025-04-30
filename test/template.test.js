import { existsSync } from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

jest.mock('twig', () => ({
  default: {
    renderFile: jest.fn((templatePath, data, callback) => {
      // Simple mock implementation to verify template engine integration
      const rendered = `Rendered template with ticket ${data.ticket_number}`;
      callback(null, rendered);
    })
  }
}));

// Import our function after mocking
const { getTemplatePath } = require('../index.js');

describe('Template functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplatePath', () => {
    it('should return the template path when it exists', () => {
      // Set up fs mock to return true for existsSync
      existsSync.mockReturnValueOnce(true);

      const templatePath = getTemplatePath();
      const expectedPath = path.join(process.cwd(), 'templates', 'PULL_REQUEST_TEMPLATE.twig');

      expect(existsSync).toHaveBeenCalledWith(expectedPath);
      expect(templatePath).toBe(expectedPath);
    });

    it('should throw an error when template does not exist', () => {
      // Set up fs mock to return false for existsSync
      existsSync.mockReturnValueOnce(false);

      expect(() => getTemplatePath()).toThrow('PR template not found');
    });
  });
});
