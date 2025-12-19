# AGENTS.md - Guidelines for Coding Agents

## Essential Commands

- `npm run test` - Run all tests
- `npm run test:watch` - Watch mode for development
- `npm run test path/to/test.test.ts` - Run single test file
- `npm run check` - Full validation (lint + typecheck + test + format)
- `npm run check:fix` - Auto-fix linting and formatting
- `npm run lint` - ESLint only
- `npm run typecheck` - TypeScript validation only

## Code Style Guidelines

### Import Organization

```typescript
// 1. External libraries (React, Next.js, third-party)
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 2. Internal imports with @/ alias
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

// 3. Type imports (use import type when possible)
import type { SurveyResponse } from "@/types";

// 4. CSS modules
import styles from "./Component.module.css";
```

### Component Structure

- Functional components with TypeScript interfaces
- Props interfaces extend HTML attributes when appropriate
- Default exports for main components
- Use "use client" directive for client-side components

### Naming Conventions

- PascalCase for components (LoginModal, SalaryChart)
- camelCase for variables and functions
- Descriptive names indicating purpose
- File names match component names

### Error Handling

```typescript
try {
  const data = await fetch("/api/endpoint");
  if (!res.ok) throw new Error(data.error);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  setError(message);
} finally {
  setLoading(false);
}
```

### Styling Requirements

- CSS Modules mandatory (import styles from "./Component.module.css")
- Use CSS custom properties for theming (var(--primary))
- Mobile-first responsive design
- Class composition: `${styles.base} ${styles[variant]}`

### TypeScript Rules

- Strict mode enabled
- No explicit any (error level)
- Unused vars with \_ prefix ignored
- Interface definitions for all component props

### Testing Patterns

- Vitest with Testing Library
- Test files: \*.test.ts
- Structure: describe/it/expect
- Comprehensive coverage for utility functions

### Architecture Patterns

- React Context for global state (AuthContext, DashboardContext)
- Dynamic imports for client-side components (Map, charts)
- Feature-based organization in src/features/
- Shared components in src/components/ui/

### Key ESLint Rules

- @typescript-eslint/no-explicit-any: error
- prefer-const: error
- eqeqeq: ["error", "always", { null: "ignore" }]
- Variables with \_ prefix are ignored

### File Structure

```md
src/
├── app/          # Next.js App Router
├── components/   # Reusable components
├── context/      # React contexts
├── features/     # Feature-specific components
├── lib/          # Utility functions
└── types/        # TypeScript definitions
```

## Development Workflow

1. Run `npm run check:fix` before commits
2. Use `npm run test:watch` during development
3. Follow existing component patterns
4. Maintain CSS Modules architecture
5. Test utility functions thoroughly
