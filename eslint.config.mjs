export default {
  extends: ["next/core-web-vitals"],
  ignores: [
    ".next/**",
    "out/**", 
    "build/**",
    "dist/**",
    "node_modules/**",
    ".open-next/**",
    "next-env.d.ts",
    "src/lib/regions-data.ts",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
    }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
  }
};
