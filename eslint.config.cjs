module.exports = [
  {
    languageOptions: {
      globals: {
        browser: true,
        es2021: true,
        node: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
      },
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      react: require('eslint-plugin-react'),
      prettier: require('eslint-plugin-prettier'),
    },
    settings: {
      react: {
        version: '19.0',
      },
    },
    ...require('eslint-config-prettier'),
    ...require('eslint-plugin-react/configs/recommended'),
        rules: {
      'react/react-in-jsx-scope': 'off',
      
    },
  },
];
