# Contributing to Girton Feast

Thank you for contributing to the Girton Feast website! This guide will help you set up the development environment and understand our code quality checks.

## Getting Started

### Prerequisites

- **Git** - Version control
- **Node.js** - For running linters (v14 or higher recommended)
- **Python** - For pre-commit framework (v3.7 or higher)
- **pip** - Python package manager

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd girton-feast
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install pre-commit framework**
   ```bash
   pip install pre-commit
   ```

4. **Install pre-commit hooks**
   ```bash
   pre-commit install
   ```

That's it! The hooks will now run automatically on every commit.

## Code Quality Checks

Our pre-commit hooks automatically check for:

### HTML Linting (HTMLHint)
- Valid HTML structure
- Proper use of semantic tags
- Alt attributes on images
- No duplicate IDs

### CSS Linting (Stylelint)
- Valid CSS syntax
- Consistent formatting
- No duplicate selectors
- Proper use of CSS custom properties

### JavaScript Linting (ESLint)
- Valid JavaScript syntax
- No undefined variables
- Consistent code style
- Alpine.js and Bootstrap globals recognized

### Link Checking
- All internal links point to existing files
- Image sources exist
- Component references are valid

### General File Checks
- No trailing whitespace
- Files end with a newline
- Valid JSON syntax
- No large files (>500KB)

## Running Linters Manually

You can run linters manually without committing:

```bash
# Run all linters
npm run lint

# Run specific linters
npm run lint:html    # HTML only
npm run lint:css     # CSS only
npm run lint:js      # JavaScript only

# Auto-fix issues where possible
npm run lint:fix

# Check links
npm run check-links
```

## Testing Pre-commit Hooks

To test the hooks on all files (not just staged ones):

```bash
pre-commit run --all-files
```

To test a specific hook:

```bash
pre-commit run htmlhint --all-files
pre-commit run stylelint --all-files
pre-commit run eslint --all-files
pre-commit run check-links --all-files
```

## Bypassing Hooks (Emergency Only)

If you need to commit without running the hooks (emergency fixes only):

```bash
git commit --no-verify -m "Emergency fix"
```

**Note:** Use this sparingly! The hooks are there to catch problems before they reach the repository.

## Common Issues and Solutions

### Issue: Pre-commit hooks are slow

**Solution:** The hooks only run on changed files. If they seem slow:
- Make smaller, focused commits
- Run linters manually during development
- The link checker only validates internal links to keep it fast

### Issue: HTMLHint complains about inline styles

**Solution:** Our configuration allows inline styles and scripts (needed for Alpine.js and Analytics). If you see this error, the `.htmlhintrc` config might not be loaded properly.

### Issue: ESLint reports "Alpine is not defined"

**Solution:** Alpine.js and other globals are configured in `.eslintrc.json`. Make sure the file exists and is properly formatted.

### Issue: Stylelint errors on vendor prefixes

**Solution:** Our configuration allows vendor prefixes. Check that `.stylelintrc.json` exists.

### Issue: Link checker reports false positives

**Solution:** The link checker only validates local files. If it's reporting an error:
1. Check the file path is correct (case-sensitive on Linux)
2. Ensure the file actually exists
3. Check for typos in the path

## Updating Dependencies

To update linter versions:

```bash
npm update
pre-commit autoupdate
```

## File Structure

```
girton-feast/
├── .pre-commit-config.yaml   # Pre-commit hooks configuration
├── package.json               # Node.js dependencies and scripts
├── .htmlhintrc               # HTML linting rules
├── .stylelintrc.json         # CSS linting rules
├── .eslintrc.json            # JavaScript linting rules
├── scripts/
│   └── check-links.js        # Custom link checker
├── css/
├── js/
├── pages/
├── components/
└── images/
```

## Questions or Problems?

If you encounter any issues with the development setup or have questions about the linting rules, please open an issue or contact the maintainers.

Happy coding! 🎉
