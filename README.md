# GitHub PR Maker

GitHub PR Maker generates a PR using a standard PR template and your input.

The questions for the application are:
1/ Ticket number (eg. JIRA-123)
2/ Pull Request title
4/ Whether there are tests
3/ Changes - multi-value, can many values which get saved to an array

It then enters uses the PR template in the templates directory and generates a PR summary.

Then using the `gh` tool it creates a PR on the git repository.
The title of the PR is `[{{ticket_number}}] {{ title}}`
The body of the PR is the generated template.



This application uses the following:

- `@inquirer/prompts` for the question and input
- `jest` for tests
- `eslint` for JS linting
- `twig` for the templating

Eslint and package.json are setup with the required versions and packages.

Install new packages as required and ensure all code passes tests before
saying complete. ALL TESTS.
