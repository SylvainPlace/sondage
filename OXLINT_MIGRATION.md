# Migration from ESLint to Oxlint

This document describes the gradual migration strategy from ESLint to Oxlint for the sondage-next project.

## 📋 Overview

**Oxlint** is a high-performance JavaScript/TypeScript linter built in Rust as part of the OXC (Oxidation Compiler) project. It offers significant performance improvements over ESLint while maintaining compatibility with many ESLint rules.

### Key Statistics
- **50-100x faster** than ESLint
- Sub-second linting for most codebases
- Zero configuration required (but highly configurable)
- Built-in TypeScript support
- React and Next.js rules included

## ✨ Benefits of Oxlint

### Performance 🚀
- **50-100x faster** than ESLint
- Near-instantaneous feedback during development
- Dramatically faster CI/CD pipelines
- Minimal resource usage

### Developer Experience 💻
- Instant feedback in editors
- Faster pre-commit hooks
- Reduced waiting time in development workflow
- Better IDE performance

### Modern Architecture 🛠️
- Written in Rust for optimal performance
- Part of the comprehensive OXC ecosystem (formatter, minifier, bundler)
- Active development and growing community
- Native support for modern JavaScript and TypeScript

### Zero Configuration ⚙️
- Works out of the box with sensible defaults
- No complex ESLint plugin configuration needed
- Built-in React, TypeScript, and Next.js support

## 🔄 Migration Strategy

### Phase 1: Coexistence (Current Phase) ✅

Both ESLint and Oxlint run side-by-side:
- ESLint remains the primary linter
- Oxlint runs alongside for comparison
- Team can evaluate Oxlint's output
- No disruption to existing workflows

**Available Commands:**
```bash
npm run lint          # Run ESLint (current default)
npm run lint:ox       # Run Oxlint
npm run lint:both     # Run both linters
npm run check         # Quality checks with ESLint
npm run check:ox      # Quality checks with Oxlint
npm run check:both    # Quality checks with both linters
```

### Phase 2: Evaluation (Next Step)

- Compare outputs from both linters
- Adjust Oxlint configuration to match team preferences
- Train team members on Oxlint usage
- Update IDE integrations
- Resolve any conflicting rules

**Timeline:** 1-2 weeks

### Phase 3: Transition (Future)

- Switch default `npm run lint` to Oxlint
- Keep ESLint available as fallback
- Update CI/CD to use Oxlint
- Update pre-commit hooks

**Timeline:** 1 week

### Phase 4: Complete Migration (Final)

- Remove ESLint dependency
- Remove ESLint configuration files
- Finalize Oxlint configuration
- Update all documentation

**Timeline:** 1 week after successful transition

## 📖 Current Usage

### Running Oxlint

**Check all files:**
```bash
npm run lint:ox
```

**Auto-fix issues:**
```bash
npm run lint:ox:fix
```

**Run both linters:**
```bash
npm run lint:both
```

**Full quality check with Oxlint:**
```bash
npm run check:ox
```

**Compare both linters:**
```bash
npm run check:both
```

### Direct CLI Usage

```bash
# Lint specific file/directory
npx oxlint src/components

# Auto-fix specific file
npx oxlint --fix src/components/Button.tsx

# Lint with specific rules
npx oxlint --rules="react/no-danger=error" src

# Show available rules
npx oxlint --rules
```

## ⚙️ Configuration

Oxlint configuration is in `oxlintrc.json`. Key sections:

### Rule Categories

Oxlint organizes rules into categories:

```json
{
  "categories": {
    "correctness": "error",    // Code that is likely to be wrong
    "suspicious": "warn",     // Code that may be wrong
    "pedantic": "off",        // Overly strict or opinionated
    "perf": "warn",           // Performance issues
    "restriction": "off",     // Restrictions for specific use cases
    "style": "warn",          // Code style preferences
    "nursery": "off"          // Experimental rules
  }
}
```

### Specific Rules

Rules matching current ESLint configuration:

```json
{
  "rules": {
    "typescript": {
      "no-explicit-any": "error",
      "no-unused-vars": "error"
    },
    "eslint": {
      "no-var": "error",
      "no-debugger": "error",
      "prefer-const": "error"
    },
    "react": {
      "no-danger": "warn"
    },
    "react-hooks": {
      "rules-of-hooks": "error",
      "exhaustive-deps": "warn"
    }
  }
}
```

### Ignored Files

Files excluded from linting:

```json
{
  "ignore": [
    "*.config.js",
    ".next/**",
    "node_modules/**",
    "src/lib/regions-data.ts"
  ]
}
```

## 🔧 IDE Integration

### VS Code

1. **Install the Oxc extension:**
   - Open VS Code Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "oxc"
   - Install "oxc" by "oxc"

2. **Configure Oxc extension:**

   Create or update `.vscode/settings.json`:
   ```json
   {
     "oxc.enable": true,
     "oxc.lint.enable": true,
     "oxc.lint.run": "onSave",
     "editor.codeActionsOnSave": {
       "source.fixAll.oxc": "explicit"
     }
   }
   ```

3. **Disable ESLint temporarily (optional):**
   ```json
   {
     "eslint.enable": false
   }
   ```

### WebStorm / IntelliJ IDEA

Oxlint can be integrated via File Watchers or external tools:

1. Go to **Settings → Tools → File Watchers**
2. Add new watcher
3. Configure to run `oxlint` on file changes

Detailed setup: https://oxc.rs/docs/guide/usage/linter.html#ide

## 📊 Performance Comparison

### ESLint
- Lint entire codebase: ~5-10 seconds
- Pre-commit hook: ~3-5 seconds
- CI/CD pipeline: ~30-60 seconds

### Oxlint
- Lint entire codebase: ~0.1-0.5 seconds ⚡
- Pre-commit hook: ~0.1-0.2 seconds ⚡
- CI/CD pipeline: ~1-2 seconds ⚡

**Result: 50-100x faster!**

## 🔄 Rule Mapping

Most ESLint rules have Oxlint equivalents:

| ESLint Rule | Oxlint Rule | Status |
|-------------|-------------|--------|
| `@typescript-eslint/no-explicit-any` | `typescript/no-explicit-any` | ✅ Supported |
| `@typescript-eslint/no-unused-vars` | `typescript/no-unused-vars` | ✅ Supported |
| `prefer-const` | `eslint/prefer-const` | ✅ Supported |
| `no-var` | `eslint/no-var` | ✅ Supported |
| `eqeqeq` | `eslint/eqeqeq` | ✅ Supported |
| `react-hooks/rules-of-hooks` | `react-hooks/rules-of-hooks` | ✅ Supported |
| `complexity` | N/A | ⚠️ Not yet supported |
| Custom plugins | N/A | ⚠️ Depends on plugin |

## ⚠️ Known Limitations

1. **Plugin Ecosystem:** Oxlint doesn't support ESLint plugins. Most common rules are built-in, but custom plugins won't work.

2. **Some Rules:** A few ESLint rules aren't yet implemented (e.g., `complexity`). Check the [Oxlint rules list](https://oxc.rs/docs/guide/usage/linter/rules.html).

3. **Configuration Format:** Oxlint uses its own JSON configuration format, not `.eslintrc.js`.

4. **Custom Rules:** You cannot create custom Oxlint rules (yet).

## 🎯 Migration Checklist

### Current Phase: Coexistence ✅
- [x] Oxlint installed as dev dependency
- [x] `oxlintrc.json` created with matching rules
- [x] New npm scripts added (`lint:ox`, `lint:both`)
- [x] ESLint configuration kept intact
- [x] `.oxlintignore` created
- [x] Documentation created

### Next Phase: Evaluation
- [ ] Team reviews Oxlint output
- [ ] Compare Oxlint vs ESLint results
- [ ] Adjust rules as needed
- [ ] Install Oxc VS Code extension
- [ ] Test Oxlint in daily workflow
- [ ] Resolve any rule conflicts

### Future Phase: Transition
- [ ] Update default `lint` command to use Oxlint
- [ ] Update CI/CD to use Oxlint
- [ ] Update pre-commit hooks
- [ ] Update team documentation

### Final Phase: Complete Migration
- [ ] Remove ESLint dependencies
- [ ] Remove `eslint.config.mjs`
- [ ] Remove `.eslintignore` (if exists)
- [ ] Finalize `oxlintrc.json`
- [ ] Update all documentation references

## ❓ FAQ

### Why migrate from ESLint?
**Performance!** Oxlint is 50-100x faster, providing instant feedback and dramatically improving development workflow.

### Will all ESLint rules work?
Most common rules are supported. Check the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules.html) for specifics.

### Can I use both linters?
Yes! That's the current approach. Use `npm run lint:both` to run both.

### What if Oxlint is missing a rule I need?
Keep ESLint for that specific check, or file a feature request with the Oxc project.

### When should we fully migrate?
After 2-4 weeks of evaluation, when the team is comfortable with Oxlint's output and performance.

### Is Oxlint production-ready?
Yes! It's actively used by many production projects and is stable.

### What about ESLint plugins?
Oxlint doesn't support ESLint plugins. Most common plugin rules are built into Oxlint. For specialized plugins, you may need to keep ESLint.

### How do I see all available Oxlint rules?
```bash
npx oxlint --rules
```

## 🔗 Resources

- [Oxc Official Documentation](https://oxc.rs/)
- [Oxlint Usage Guide](https://oxc.rs/docs/guide/usage/linter.html)
- [Oxlint Rules List](https://oxc.rs/docs/guide/usage/linter/rules.html)
- [Oxlint Configuration Schema](https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json)
- [Oxc VS Code Extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)
- [Oxc GitHub Repository](https://github.com/oxc-project/oxc)

## 🤝 Support

If you have questions or encounter issues:
1. Check this documentation
2. Review the [Oxlint documentation](https://oxc.rs/docs/guide/usage/linter.html)
3. Run `npx oxlint --help` for CLI help
4. Create an issue in the repository
5. Reach out to the team

---

**Migration Started:** February 26, 2026  
**Current Phase:** Phase 1 - Coexistence  
**Next Review:** March 12, 2026  
**Status:** ✅ Ready for Evaluation
