module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'react/react-in-jsx-scope': 'off', // Vite에서는 React 자동 import됨
    '@typescript-eslint/no-unused-vars': ['warn'],
    'no-console': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
