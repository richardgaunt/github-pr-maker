# Implementation Plan

1. Main script (index.js) flow:
   - Fetch 3 most recent commits
   - For each commit:
    - Show commit message and details
    - Prompt user to include it (yes/no)
    - If yes, allow editing the message for PR description
      - Collect ticket number and PR title
      - Render template with edited commit messages
      - Create GitHub PR
2. Implementation details:
   - Parse git log with formatted output for readability
   - Use @inquirer/prompts' confirm and input types for review flow
   - Store edited messages in changes array
   - Pass final data to Twig template
   - Execute gh PR command
3. Tests to write:
   - Test commit parsing functionality
   - Test user interaction flow with mock prompts
   - Validate template rendering with sample data
   - Test PR creation with mock gh command

This approach gives users full control to curate the PR description while saving time by starting with actual commit messages.
