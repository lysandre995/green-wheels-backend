const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
    { files: ["**/*.ts"] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "prefer-const": "error",
            "no-await-in-loop": "error",
            "no-extra-boolean-cast": "error",
            "no-extra-parens": "error",
            "no-extra-semi": "error",
            "no-invalid-regexp": "error",
            "no-irregular-whitespace": "error",
            "no-unreachable": "error",
            semi: ["error", "always"],
            "@typescript-eslint/explicit-module-boundary-types": "error",
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/explicit-member-accessibility": "error"
        }
    },
    {
        ignores: [".config/*"]
    }
];
