// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // `axios.create()` is the documented, idiomatic call on the default
      // export. The rule fires only because axios ALSO ships a named `create`,
      // which makes it a false positive on every correct axios setup.
      'import/no-named-as-default-member': 'off',
    },
  },
]);
