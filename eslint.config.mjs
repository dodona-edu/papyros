import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export default tseslint.config(
    {
        ignores: [
            "**/webpack.config.js",
            "**/tailwind.config.js",
            "**/postcss.config.js",
            "**/jest.config.js",
            "src/Translations.js",
            "scripts/ValidateTranslations.js",
            "**/dist",
        ],
    },
    eslint.configs.recommended,
    {
        rules: {
            "arrow-parens": ["error", "as-needed"],
            "comma-dangle": ["error", {
                arrays: "only-multiline",
                objects: "only-multiline",
                imports: "only-multiline",
                exports: "only-multiline",
                functions: "never",
            }],
            indent: ["error", 4, { SwitchCase: 1 }],
            "no-invalid-this": "warn",
            "no-param-reassign": ["error", { props: false }],
            "object-curly-spacing": ["error", "always"],
            quotes: ["error", "double"],
            "space-before-function-paren": ["error", {
                anonymous: "always",
                named: "never",
                asyncArrow: "always",
            }],
        },
    },
    tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/explicit-member-accessibility": "off",
            "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
            "@typescript-eslint/no-parameter-properties": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    }
);
