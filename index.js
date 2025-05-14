#!/usr/bin/env node

import { execSync } from 'child_process';
import { input, confirm } from '@inquirer/prompts';
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

// Get the template path
export function getTemplatePath() {
  const templatePath = path.join(__dirname, 'templates', 'PULL_REQUEST_TEMPLATE.twig');

  if (!existsSync(templatePath)) {
    throw new Error('PR template not found: ' + templatePath);
  }

  return templatePath;
}

// Create PR using GitHub CLI
export async function createPR(title, body) {
  try {
    const command = `gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}"`;
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

  // Render template
  const templatePath = getTemplatePath();

  const renderedTemplate = await renderFileAsync(templatePath, {
    ticket_number: ticketNumber || '',
    changes,
    has_tests: hasTests,
    has_ticket: !!ticketNumber
  });

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
      console.log(`\n🔄 Branch '${currentBranch}' not found on remote. Pushing now...`);
      needsToPush = true;

      const pushSucceeded = pushBranchToRemote(currentBranch);
      if (!pushSucceeded) {
        console.error('\n❌ Failed to push branch to remote. Cannot create PR.');
        process.exit(1);
      }
      console.log(`✅ Branch '${currentBranch}' successfully pushed to remote.`);
    }

    // Create PR
    const fullTitle = ticketNumber ? `[${ticketNumber}] ${prTitle}` : prTitle;
    const result = await createPR(fullTitle, renderedTemplate);

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
