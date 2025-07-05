import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "coverage/**", "*.log"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        process: "readonly"
      }
    },
    plugins: {
      js
    },
    rules: {
      ...js.configs.recommended.rules,
      "indent": ["error", 2],
      "linebreak-style": ["error", "windows"],
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      "no-console": "warn",
      "no-unused-vars": "warn",
      "require-await": "error"
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
]);