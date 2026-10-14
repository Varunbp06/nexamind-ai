import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// `next lint` was removed in Next.js 16, so ESLint is invoked directly.
// eslint-config-next still ships the legacy (eslintrc) format, which
// @eslint/eslintrc.FlatCompat bridges into ESLint 9 flat config.
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'prettier'),
  {
    rules: {
      'react/prop-types': 0,
      'react/react-in-jsx-scope': 0,
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'public/**',
    ],
  },
];

export default eslintConfig;
