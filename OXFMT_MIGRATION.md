# Migration from Prettier to Oxfmt

This document describes the migration from Prettier to Oxfmt for code formatting in the sondage-next project.

## 📋 Overview

Oxfmt is a modern, blazingly fast code formatter built in Rust that is fully compatible with Prettier's formatting style while providing significantly better performance. It is part of the OXC (Oxidation Compiler) project.

## ✨ Benefits of Oxfmt

### Performance
- **10-20x faster** than Prettier for large codebases
- Near-instantaneous formatting for small to medium projects
- Better CI/CD pipeline performance
- Improved developer experience with faster pre-commit hooks

### Compatibility
- Maintains Prettier-compatible output (minimal code changes)
- Supports the same file types: JavaScript, TypeScript, JSX, TSX, JSON, Markdown
- Easy migration path from Prettier

### Modern Architecture
- Built with Rust for optimal performance
- Active development and growing ecosystem
- Part of the comprehensive OXC toolchain (linter, minifier, bundler)

## 🔄 What Changed

### Dependencies
**Removed:**
- `prettier` (^3.8.1)
- `eslint-config-prettier` (^10.1.8)
- `eslint-plugin-prettier` (^5.5.5)

**Added:**
- `oxfmt` (^0.10.0)

### Scripts
**Before (Prettier):**
```json
"format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\""
```

**After (Oxfmt):**
```json
"format": "oxfmt --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
"format:check": "oxfmt --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
"format:fix": "oxfmt --write \"src/**/*.{ts,tsx,js,jsx,json,md}\""
```

### Configuration Files
**Removed:**
- `.prettierrc` (was not present)
- `.prettierignore` (replaced)

**Added:**
- `oxfmtrc.jsonc` - Main configuration file
- `.oxfmtignore` - Files to exclude from formatting

### ESLint Configuration
Removed Prettier integration from ESLint:
- Removed `eslint-config-prettier` extends
- Removed `eslint-plugin-prettier` plugin

Oxfmt runs independently and doesn't need ESLint integration.

## 📖 Usage

### Format all files
```bash
npm run format
# or
npm run format:fix
```

### Check formatting without making changes
```bash
npm run format:check
```

### Run all quality checks (including formatting)
```bash
npm run check
```

### Fix all auto-fixable issues (lint + format)
```bash
npm run check:fix
```

## ⚙️ Configuration

The Oxfmt configuration is in `oxfmtrc.jsonc` with the following key settings:

```jsonc
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 100,
  "semicolons": true,
  "quoteStyle": "single",
  "jsxQuoteStyle": "double",
  "trailingCommas": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

These settings match the previous Prettier configuration to minimize code changes.

## 🔧 IDE Integration

### VS Code

1. Install the Oxc extension:
   - Search for "oxc" in VS Code extensions
   - Install "oxc" by "oxc"

2. Configure format-on-save in `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  }
}
```

### Other IDEs

For other IDEs, configure them to run `oxfmt` as the formatter or use format-on-save with the `npm run format` script.

## 🚀 CI/CD Integration

The existing CI/CD checks will continue to work with Oxfmt:

```bash
# In your CI pipeline
npm run check  # Includes format:check
```

The Husky pre-commit hook will automatically use Oxfmt since it runs `npm run check`.

## 📝 Migration Steps for Team Members

1. **Pull the latest changes** from the `feat/oxfmt-migration` branch
2. **Install dependencies**: `npm install`
3. **Format existing code**: `npm run format` (this will reformat all code with Oxfmt)
4. **Update your IDE** with the Oxc extension (see IDE Integration above)
5. **Commit the changes**: The pre-commit hook will now use Oxfmt

## ❓ FAQ

### Will my code look different?
Minimal differences. Oxfmt aims for Prettier compatibility. You may see minor spacing or line-break differences, but the overall style remains the same.

### Do I need to change my workflow?
No! The npm scripts remain the same (`format`, `format:check`, `check`, `check:fix`). Just use them as before.

### What about existing PRs?
Existing PRs created before the migration may need to be reformatted with Oxfmt after merging this change. Simply run `npm run format` and commit the changes.

### Can I still use Prettier?
Technically yes, but it's recommended to use Oxfmt for consistency across the team. Prettier has been removed from the dependencies.

## 🔗 Resources

- [Oxc Official Documentation](https://oxc.rs/)
- [Oxfmt Formatter Guide](https://oxc.rs/docs/guide/usage/formatter.html)
- [Oxfmt Configuration Schema](https://oxc.rs/schemas/oxfmtrc.json)
- [Oxc VS Code Extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)

## 🤝 Support

If you encounter any issues with the migration or have questions, please:
1. Check this documentation
2. Review the Oxfmt documentation
3. Create an issue in the repository
4. Reach out to the team

---

**Migration Date:** February 26, 2026  
**Migrated by:** Theorbot  
**Status:** Ready for Review
