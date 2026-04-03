const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**']
    },
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module'
        },
        rules: {
            'no-undef': 'error',
            'no-unused-vars': 'warn'
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true }
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            'no-undef': 'off',
            ...tsPlugin.configs.recommended.rules
        }
    },
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        rules: {
            ...prettierConfig.rules
        }
    }
]
