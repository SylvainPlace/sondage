import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
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
      
      // Rules style plus cohérents
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "curly": ["error", "all"],
      "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
      "comma-dangle": ["error", "always-multiline"],
      "semi": ["error", "always"],
      "quotes": ["error", "double", { "avoidEscape": true, "allowTemplateLiterals": true }],
      
      // Rules complexes et bonnes pratiques
      "complexity": ["warn", 25],
      "max-depth": ["warn", 4],
      
      // Rules variables (plus strictes)
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
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
