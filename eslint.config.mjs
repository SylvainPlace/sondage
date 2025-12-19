import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier integration
      "prettier/prettier": "error",

      // Rules TypeScript plus strictes (sans parserOptions complexes)
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Rules qualité code plus strictes
      "prefer-const": "error",
      "no-var": "error",
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",

      // Rules complexes et bonnes pratiques
      eqeqeq: ["error", "always", { null: "ignore" }],
      complexity: ["warn", 25],
      "react-hooks/set-state-in-effect": "off", //TODO put this on and correct errors later

      // Rules variables (plus strictes)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Huge static dataset; keep it out of linting to avoid slowdowns.
    "src/lib/regions-data.ts",

    // Open-Next build files (generated)
    ".open-next/**",
  ]),
]);

export default eslintConfig;
