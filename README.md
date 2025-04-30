# 🚀 GitHub PR Maker [![Tests Status](https://github.com/user/github-pr-builder/workflows/Tests/badge.svg)](https://github.com/user/github-pr-builder/actions)

🎯 GitHub PR Maker automatically generates polished PRs using your commit history and a standardized template!

## ✨ Features

- 🔍 Scans your recent commits and lets you pick which ones to include
- ✏️ Edit commit messages for clearer PR descriptions
- 🧩 Uses your PR template to generate a consistent PR format
- 🤖 Creates the PR directly via GitHub CLI

## 🛠️ How It Works

The app will prompt you for:

1. 🎫 Ticket number (e.g., JIRA-123)
2. 📝 Pull Request title
3. ✅ Whether your changes include tests
4. 🔄 Which recent commits to include (with ability to edit descriptions)

It then:
- 📋 Generates a PR using your template with all provided information
- 🔗 Creates the PR with title in format: `[TICKET-123] Your PR Title`
- 📊 Shows you a preview before submitting

## 🚀 Usage

```bash
# Install dependencies
npm install

# Run the PR maker
npm start
```

## 🧰 Tech Stack

- 💬 [`@inquirer/prompts`](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI prompts
- 🧪 [`jest`](https://jestjs.io/) - Testing framework
- 🧹 [`eslint`](https://eslint.org/) - Code quality
- 📝 [`twig`](https://github.com/twigjs/twig.js) - Templating engine

## 🧪 Testing

```bash
# Run tests
npm test

# Check code style
npm run lint
```

## 📝 License

MIT
