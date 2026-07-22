import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

// 纯 JS 文件：用 espree（flat config 默认）解析
const jsRules = {
  'no-console': ['warn', { allow: ['warn', 'error', 'assert'] }],
  'no-unused-vars': [
    'error',
    { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrors: 'none' },
  ],
  'prefer-const': 'error',
  'no-var': 'error',
  'eqeqeq': ['error', 'always', { null: 'ignore' }],
};

// Vue SFC：用 vue-eslint-parser 解析，<script> 块交给 espree
const vueRules = {
  'vue/component-name-in-template-casing': ['error', 'PascalCase'],
  'vue/no-unused-refs': 'warn',
  'vue/no-use-v-if-with-v-for': 'error',
  'vue/require-v-for-key': 'error',
  'vue/no-mutating-props': 'error',
};

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: { ...jsRules },
  },
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: vueParser,
      parserOptions: {
        parser: 'espree',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      vue: pluginVue,
    },
    rules: { ...vueRules, ...jsRules },
  },
];
