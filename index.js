#!/usr/bin/env node

import { execSync } from 'child_process';
import { input, confirm, search, checkbox } from '@inquirer/prompts';
import nunjucks from 'nunjucks';
import { existsSync, readFileSync, writeFileSync, unlinkSync, realpathSync } from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));


// Get the three most recent commits
export function getRecentCommits(count = 3) {
  try {
    // Use %x00 (null byte) as commit separator to handle multi-line messages
    const format = '--pretty=format:%h\\|\\|\\|%s%x00';
    const output = execSync(`git log -${count} ${format}`).toString().trim();

    return output.split('\x00').filter(Boolean).map(line => {
      const [hash, subject] = line.split('|||');
      return {
        hash,
        subject
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
    const output = execSync(`git ls-remote --heads origin ${branchName}`).toString().trim();
    // If output is empty, branch doesn't exist on remote
    return output.length > 0;
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

// Get the root directory of the current git repository
export function getRepoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel').toString().trim();
  } catch {
    return null;
  }
}

// Get the path to the state file
function getStatePath() {
  const root = getRepoRoot();
  if (!root) return null;
  return path.join(root, '.pr-in-progress.json');
}

const STATE_VERSION = 2;
const STEP_ORDER = ['ticketNumber', 'prTitle', 'hasTests', 'changes', 'labels', 'reviewers'];

// Check if a step has already been completed relative to the saved step
export function isStepCompleted(currentStep, savedStep) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const savedIndex = STEP_ORDER.indexOf(savedStep);
  if (currentIndex === -1 || savedIndex === -1) return false;
  return currentIndex <= savedIndex;
}

// Load saved state from disk, validated against current branch
export function loadState(currentBranch) {
  const statePath = getStatePath();
  if (!statePath || !existsSync(statePath)) return null;

  try {
    const raw = readFileSync(statePath, 'utf-8');
    const state = JSON.parse(raw);

    if (state.version !== STATE_VERSION) return null;
    if (state.branch !== currentBranch) return null;
    if (!state.step || !STEP_ORDER.includes(state.step)) return null;

    return state;
  } catch {
    return null;
  }
}

// Save state to disk
export function saveState(state) {
  const statePath = getStatePath();
  if (!statePath) return;
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
}

// Delete the state file
export function clearState() {
  const statePath = getStatePath();
  if (!statePath) return;
  try {
    unlinkSync(statePath);
  } catch {
    // File may not exist, that's fine
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

// Get available labels from the repository
export function getRepoLabels() {
  try {
    const output = execSync('gh label list --json name --limit 100').toString().trim();
    const labels = JSON.parse(output);
    return labels.map(l => l.name);
  } catch {
    return [];
  }
}

// Get the current authenticated GitHub user
export function getCurrentGhUser() {
  try {
    return execSync('gh api user --jq .login').toString().trim();
  } catch {
    return null;
  }
}

// Get collaborators from the repository (people who can review PRs)
export function getRepoCollaborators() {
  try {
    const output = execSync('gh api repos/:owner/:repo/collaborators --jq .[].login').toString().trim();
    if (!output) return [];
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
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
- Includes tests
{% else %}
## Tests
- No tests included
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
  const templatePath = path.join(scriptDir, 'templates', 'PULL_REQUEST_TEMPLATE.njk');

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
export async function createPR(title, body, targetBranch = null, labels = [], reviewers = []) {
  try {
    // Build the command with optional target branch
    let command = `gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}"`;

    // Always self-assign the PR
    command += ' --assignee "@me"';

    // Add target branch if specified
    if (targetBranch) {
      command += ` --base "${targetBranch}"`;
    }

    // Add labels if specified
    for (const label of labels) {
      command += ` --label "${label}"`;
    }

    // Add reviewers if specified
    for (const reviewer of reviewers) {
      command += ` --reviewer "${reviewer}"`;
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

  // Get current branch early — needed for state matching
  const currentBranch = getCurrentBranch();

  if (!currentBranch) {
    console.error('\n❌ Failed to determine current branch');
    process.exit(1);
  }

  // Check for saved state and offer to resume
  let state = loadState(currentBranch);
  if (state) {
    const resume = await confirm({
      message: '💾 Resume in-progress PR?',
      default: true
    });
    if (!resume) {
      clearState();
      state = null;
    }
  }

  // Initialize state if starting fresh
  if (!state) {
    state = {
      version: STATE_VERSION,
      branch: currentBranch,
      step: null,
      ticketNumber: null,
      prTitle: null,
      hasTests: null,
      changes: null,
      commitHashes: null,
      labels: null,
      reviewers: null,
    };
  }

  // --- Step: ticketNumber ---
  let ticketNumber;
  if (state.step && isStepCompleted('ticketNumber', state.step)) {
    ticketNumber = state.ticketNumber;
    console.log(`🎫 Ticket number: ${ticketNumber || '(none)'}`);
  } else {
    ticketNumber = await input({
      message: '🎫 Ticket number (e.g., JIRA-123, leave empty if none):',
    });
    state.ticketNumber = ticketNumber;
    state.step = 'ticketNumber';
    saveState(state);
  }

  // --- Step: prTitle ---
  let prTitle;
  if (state.step && isStepCompleted('prTitle', state.step)) {
    prTitle = state.prTitle;
    console.log(`📝 PR title: ${prTitle}`);
  } else {
    prTitle = await input({
      message: '📝 Pull Request title:',
    });
    state.prTitle = prTitle;
    state.step = 'prTitle';
    saveState(state);
  }

  // --- Step: hasTests ---
  let hasTests;
  if (state.step && isStepCompleted('hasTests', state.step)) {
    hasTests = state.hasTests;
    console.log(`✅ Includes tests: ${hasTests ? 'yes' : 'no'}`);
  } else {
    hasTests = await confirm({
      message: '✅ Does this PR include tests?',
      default: false
    });
    state.hasTests = hasTests;
    state.step = 'hasTests';
    saveState(state);
  }

  // --- Step: changes (commit selection) ---
  let changes;
  if (state.step && isStepCompleted('changes', state.step)) {
    changes = state.changes;
    console.log('\n📝 Saved changes:');
    for (const change of changes) {
      console.log(`  - ${change}`);
    }
  } else {
    // Get recent commits
    const commits = getRecentCommits(3);

    if (commits.length === 0) {
      console.error('Error: No commits found');
      process.exit(1);
    }

    console.log('\n📝 Recent commits:');

    changes = [];
    const commitHashes = [];

    for (const commit of commits) {
      console.log(`\n${commit.hash} ${commit.subject}`);

      const includeCommit = await confirm({
        message: '🔄 Include this commit in PR description?'
      });

      if (includeCommit) {
        const message = await input({
          message: '✏️ Edit description for PR:',
          default: commit.subject
        });

        changes.push(message);
        commitHashes.push(commit.hash);
      }
    }

    state.changes = changes;
    state.commitHashes = commitHashes;
    state.step = 'changes';
    saveState(state);
  }

  // --- Step: labels ---
  let labels = [];
  if (state.step && isStepCompleted('labels', state.step)) {
    labels = state.labels || [];
    if (labels.length > 0) {
      console.log(`\n🏷️  Labels: ${labels.join(', ')}`);
    } else {
      console.log('\n🏷️  Labels: (none)');
    }
  } else {
    const availableLabels = getRepoLabels();
    if (availableLabels.length === 0) {
      console.log('\n🏷️  No labels found in this repository, skipping.');
    } else {
      labels = await checkbox({
        message: '🏷️  Select labels for this PR:',
        choices: availableLabels.map(name => ({ name, value: name })),
      });
    }
    state.labels = labels;
    state.step = 'labels';
    saveState(state);
  }

  // --- Step: reviewers ---
  let reviewers = [];
  if (state.step && isStepCompleted('reviewers', state.step)) {
    reviewers = state.reviewers || [];
    if (reviewers.length > 0) {
      console.log(`\n👥 Reviewers: ${reviewers.join(', ')}`);
    } else {
      console.log('\n👥 Reviewers: (none)');
    }
  } else {
    const currentUser = getCurrentGhUser();
    const collaborators = getRepoCollaborators()
      .filter(login => login !== currentUser);
    if (collaborators.length === 0) {
      console.log('\n👥 No reviewers available in this repository, skipping.');
    } else {
      const NO_REVIEWER = '__none__';
      let selecting = true;
      while (selecting) {
        const remaining = collaborators.filter(login => !reviewers.includes(login));
        const choices = [
          { name: 'No reviewer', value: NO_REVIEWER },
          ...remaining.map(login => ({ name: login, value: login })),
        ];
        const selected = await search({
          message: reviewers.length > 0
            ? `👥 Add another reviewer? (selected: ${reviewers.join(', ')})`
            : '👥 Search for a reviewer:',
          source: (input = '') => choices.filter(c => c.name.toLowerCase().includes(input.toLowerCase())),
        });
        if (selected === NO_REVIEWER) {
          selecting = false;
        } else {
          reviewers.push(selected);
          if (remaining.length <= 1) {
            selecting = false;
          }
        }
      }
    }
    state.reviewers = reviewers;
    state.step = 'reviewers';
    saveState(state);
  }

  // Get template and render it
  const template = getTemplatePath();

  const templateData = {
    ticket_number: ticketNumber || '',
    changes,
    has_tests: hasTests,
    has_ticket: !!ticketNumber
  };

  let renderedTemplate;
  if (template.isDefault) {
    renderedTemplate = nunjucks.renderString(template.content, templateData);
  } else {
    const templateContent = readFileSync(template.path, 'utf8');
    renderedTemplate = nunjucks.renderString(templateContent, templateData);
  }

  console.log('\n📋 PR Preview:');
  console.log(`Title: ${ticketNumber ? `[${ticketNumber}] ` : ''}${prTitle}`);
  if (labels.length > 0) {
    console.log(`Labels: ${labels.join(', ')}`);
  }
  if (reviewers.length > 0) {
    console.log(`Reviewers: ${reviewers.join(', ')}`);
  }
  console.log('\nBody:');
  console.log(renderedTemplate);

  // Confirm PR creation
  const confirmCreate = await confirm({
    message: '🚀 Create this Pull Request?',
    default: true
  });

  if (confirmCreate) {
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
    const remoteBranches = getRemoteBranches()
      .sort((branchA, branchB) => {
        return (branchA === defaultBranch) ? -1 : (branchB === defaultBranch) ? 1 : branchA.localeCompare(branchB);
      })
      .map(branch => ({ title: branch, value: branch }));
    console.log('\n🌿 Select target branch for PR:');
    const targetBranch = await search({
      message: '🎯 Target branch for PR:',
      default: defaultBranch,
      source: (input = '') => { return remoteBranches.filter(branch => branch.title.includes(input)); },
    });

    console.log(`📌 Creating PR targeting branch: ${targetBranch}`);

    const fullTitle = ticketNumber ? `[${ticketNumber}] ${prTitle}` : prTitle;
    const result = await createPR(fullTitle, renderedTemplate, targetBranch, labels, reviewers);

    if (result.success) {
      clearState();
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
const isDirectRun = import.meta.url === `file://${process.argv[1]}`
  || import.meta.url === `file://${realpathSync(process.argv[1])}`;
if (isDirectRun) {
  main().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}
