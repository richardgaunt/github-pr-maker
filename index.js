#!/usr/bin/env node

import { execSync } from 'child_process';
import { input, confirm, search } from '@inquirer/prompts';
import twig from 'twig';
import { promisify } from 'util';
import { existsSync } from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));


const renderFileAsync = promisify(twig.renderFile);

// Get the three most recent commits
export function getRecentCommits(count = 3) {
  try {
    const format = '--pretty=format:%h\\|\\|\\|%s\\|\\|\\|%b';
    const output = execSync(`git log -${count} ${format}`).toString().trim();

    return output.split('\n').map(line => {
      const [hash, subject, body] = line.split('|||');
      return {
        hash,
        subject,
        body: body ? body.trim() : ''
      };
    });
  } catch (error) {
    console.error('Failed to get recent commits:', error.message);
    return [];
  }
}

// Check if we're in a git repository
export function checkGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Get current branch name
export function getCurrentBranch() {
  try {
    return execSync('git branch --show-current').toString().trim();
  } catch {
    return null;
  }
}

// Get default branch name
export function getDefaultBranch() {
  try {
    // Try to get the remote's default branch
    // First get the default remote (usually origin)
    const remote = execSync('git remote').toString().trim().split('\n')[0];

    // Then get the default branch (what HEAD points to)
    const output = execSync(`git remote show ${remote} | grep "HEAD branch"`).toString().trim();
    const match = output.match(/HEAD branch:\s*(.+)$/);

    if (match && match[1]) {
      return match[1];
    }

    // Fallback to 'main' or 'master' if we can't determine it
    return 'main';
  } catch {
    // Fallback to a sensible default
    return 'main';
  }
}

// Get list of remote branches
export function getRemoteBranches() {
  try {
    // Get all remote branches, excluding HEAD reference
    const output = execSync('git branch -r | grep -v HEAD').toString().trim();

    // Parse and clean branch names
    return output.split('\n')
      .map(branch => branch.trim().replace(/^origin\//, ''))
      .filter(branch => branch !== '');
  } catch {
    return [];
  }
}

// Check if branch is pushed to remote
export function isBranchPushedToRemote(branchName) {
  try {
    // Check if the branch exists on the remote
    execSync(`git ls-remote --heads origin ${branchName}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Push branch to remote
export function pushBranchToRemote(branchName) {
  try {
    execSync(`git push -u origin ${branchName}`);
    return true;
  } catch (error) {
    console.error('Failed to push branch to remote:', error.message);
    return false;
  }
}

// Check if gh CLI is installed
export function checkGhCli() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Default PR template content as a fallback
const DEFAULT_TEMPLATE = `{% if has_ticket %}
## Ticket
{{ ticket_number }}
{% endif %}

## Changes
{% for change in changes %}
- {{ change }}
{% endfor %}

{% if has_tests %}
## Tests
- ✅ Includes tests
{% else %}
## Tests
- ❌ No tests included
{% endif %}
`;

// Get the directory where the script is installed
function getScriptDir() {
  // Use import.meta.url to get the full URL of the current module
  const fileUrl = import.meta.url;
  // Convert the file URL to a system path and get the directory
  return path.dirname(new URL(fileUrl).pathname);
}

// Get the template path or create default template
export function getTemplatePath() {
  // Get template ONLY from the script's installation directory
  const scriptDir = getScriptDir();
  const templatePath = path.join(scriptDir, 'templates', 'PULL_REQUEST_TEMPLATE.twig');

  // Check if template exists in the app installation directory
  if (!existsSync(templatePath)) {
    console.log(`🔍 Template not found in application directory: ${templatePath}`);
    console.log('⚠️ Using default template');
    return { isDefault: true, content: DEFAULT_TEMPLATE };
  }

  console.log(`📋 Using template from application directory: ${templatePath}`);
  return { isDefault: false, path: templatePath };
}

// Create PR using GitHub CLI
export async function createPR(title, body, targetBranch = null) {
  try {
    // Build the command with optional target branch
    let command = `gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}"`;

    // Add target branch if specified
    if (targetBranch) {
      command += ` --base "${targetBranch}"`;
    }

    const output = execSync(command).toString().trim();
    return {
      success: true,
      url: output
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function
export async function main() {
  console.log('🚀 GitHub PR Maker');

  // Check if we're in a git repository
  if (!checkGitRepository()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  // Check if gh CLI is installed
  if (!checkGhCli()) {
    console.error('Error: GitHub CLI (gh) is not installed or not in PATH');
    process.exit(1);
  }

  // Get ticket number and PR title first
  const ticketNumber = await input({
    message: '🎫 Ticket number (e.g., JIRA-123, leave empty if none):',
  });

  const prTitle = await input({
    message: '📝 Pull Request title:',
  });

  // Ask about tests
  const hasTests = await confirm({
    message: '✅ Does this PR include tests?',
    default: false
  });

  // Get recent commits
  const commits = getRecentCommits(3);

  if (commits.length === 0) {
    console.error('Error: No commits found');
    process.exit(1);
  }

  console.log('\n📝 Recent commits:');

  // Let user review and select commits
  const changes = [];

  for (const commit of commits) {
    console.log(`\n${commit.hash} ${commit.subject}`);
    if (commit.body) {
      console.log(`${commit.body}`);
    }

    const includeCommit = await confirm({
      message: '🔄 Include this commit in PR description?'
    });

    if (includeCommit) {
      // Directly present the edit field with default value
      const message = await input({
        message: '✏️ Edit description for PR:',
        default: commit.subject
      });

      changes.push(message);
    }
  }

  // Get template and render it
  const template = getTemplatePath();

  let renderedTemplate;
  if (template.isDefault) {
    // Render the default template string
    renderedTemplate = twig.twig({ data: template.content }).render({
      ticket_number: ticketNumber || '',
      changes,
      has_tests: hasTests,
      has_ticket: !!ticketNumber
    });
  } else {
    // Render from file
    renderedTemplate = await renderFileAsync(template.path, {
      ticket_number: ticketNumber || '',
      changes,
      has_tests: hasTests,
      has_ticket: !!ticketNumber
    });
  }

  console.log('\n📋 PR Preview:');
  console.log(`Title: ${ticketNumber ? `[${ticketNumber}] ` : ''}${prTitle}`);
  console.log('\nBody:');
  console.log(renderedTemplate);

  // Confirm PR creation
  const confirmCreate = await confirm({
    message: '🚀 Create this Pull Request?',
    default: true
  });

  if (confirmCreate) {
    // Get current branch name
    const currentBranch = getCurrentBranch();

    if (!currentBranch) {
      console.error('\n❌ Failed to determine current branch');
      process.exit(1);
    }

    // Check if branch is pushed to remote
    let needsToPush = false;
    if (!isBranchPushedToRemote(currentBranch)) {
      const shouldPush = await confirm({
        message: `Branch '${currentBranch}' not found on remote. Push to origin?`,
        default: true
      });

      if (!shouldPush) {
        console.log('\n❌ Cannot create PR without pushing branch to remote.');
        return;
      }

      needsToPush = true;
      console.log(`\n🔄 Pushing branch '${currentBranch}' to remote...`);
      const pushSucceeded = pushBranchToRemote(currentBranch);
      if (!pushSucceeded) {
        console.error('\n❌ Failed to push branch to remote. Cannot create PR.');
        process.exit(1);
      }
      console.log(`✅ Branch '${currentBranch}' successfully pushed to remote.`);
    }

    const defaultBranch = getDefaultBranch();
    // Default branch gets added to the start of the array.
    const remoteBranches = getRemoteBranches()
      .sort((branchA, branchB) => {
        return (branchA === defaultBranch) ? -1 : (branchB === defaultBranch) ? 1 : branchA.localeCompare(branchB);
      })
      .map(branch => ({ title: branch, value: branch }));
    // Ask user which branch to target for PR
    // Default to the repository's default branch
    console.log('\n🌿 Select target branch for PR:');
    const targetBranch = await search({
      message: '🎯 Target branch for PR:',
      default: defaultBranch,
      source: (input = '') => { return remoteBranches.filter(branch => branch.title.includes(input)); },
    });

    console.log(`📌 Creating PR targeting branch: ${targetBranch}`);

    const fullTitle = ticketNumber ? `[${ticketNumber}] ${prTitle}` : prTitle;
    const result = await createPR(fullTitle, renderedTemplate, targetBranch);

    if (result.success) {
      console.log(`\n✅ Pull Request created successfully: ${result.url}`);
    } else {
      console.error(`\n❌ Failed to create Pull Request: ${result.error}`);

      if (needsToPush) {
        console.log('\n💡 Note: Your branch was pushed to remote, but PR creation failed. You can create a PR manually.');
      }
    }
  } else {
    console.log('\n❌ PR creation cancelled');
  }
}

// If this file is being run directly, call the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}
