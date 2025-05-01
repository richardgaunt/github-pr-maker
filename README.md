# 🚀 GitHub PR Maker 

[![Tests](https://github.com/user/github-pr-builder/workflows/test/badge.svg)]

🎯 GitHub PR Maker generates PRs using your commit history and a standardized template.

## 🛠️ How It Works

The app will prompt you for:

1. 🎫 Ticket number (e.g., JIRA-123)
2. 📝 Pull Request title
3. ✅ Whether your changes include tests
4. 🔄 Which recent commits to include (with ability to edit descriptions)

It then:
- 📋 Generates a PR using your template with all provided information

## 🚀 Usage

### Method 1: Local Installation

```bash
# Install dependencies
npm install

# Run the PR maker
npm start
```

### Method 2: Command Line Installation

You can install this tool globally to use it from anywhere:

```bash
# Install globally
npm install -g .

# Run from anywhere
gh-pr
```

### Method 3: Bash Alias

You can also create a bash alias to run the tool:

```bash
# Add to your ~/.bashrc or ~/.zshrc
alias gh-pr="node /path/to/github-pr-builder/index.js"

# Then reload your shell
source ~/.bashrc  # or source ~/.zshrc
```

## 🧪 Development

```bash
# Run tests
npm test

# Check code style
npm run lint
```

## 📝 License

MIT
