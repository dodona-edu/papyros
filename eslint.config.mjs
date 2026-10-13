import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import eslintPluginLit from 'eslint-plugin-lit';
import eslintPluginWc from 'eslint-plugin-wc';
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig(
    {
        ignores: [
            "**/dist",
        ],
    },
    eslint.configs.recommended,
    {
        rules: {
            "no-invalid-this": "warn",
            "no-param-reassign": ["error", { props: false }],
        },
    },
    tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": "error",
            "@typescript-eslint/await-thenable": "error",
        },
    },
    eslintPluginLit.configs["flat/recommended"],
    eslintPluginWc.configs["flat/recommended"],
    eslintPluginPrettierRecommended,
);
