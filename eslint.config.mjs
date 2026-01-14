import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Prettier - deve vir depois das outras configs para desabilitar regras conflitantes
  prettier,

  // Configuração de ordenação de imports
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // React e Next primeiro
            ['^react', '^next'],
            // Pacotes externos (node_modules)
            ['^@?\\w'],
            // Imports internos com alias (@/)
            ['^@/'],
            // Imports relativos (../ e ./)
            ['^\\.\\./'],
            ['^\\./'],
            // Imports de estilos
            ['^.+\\.css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },

  // Regras customizadas TypeScript
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Ignores globais
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
]);

export default eslintConfig;
