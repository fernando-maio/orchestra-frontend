import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  {
    name: 'orchestra/ignores',
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'orchestra/regras',
    rules: {
      // A UI e em pt-BR e os componentes tem nome de uma palavra so
      // (CategoryIcon, StatsCard). Exigir multi-word aqui so geraria ruido.
      'vue/multi-word-component-names': 'off',

      // Pega o erro que mais nos custou tempo: variavel/import que sobrou apos
      // um refactor. Prefixo _ libera, para parametro que precisa existir na
      // assinatura mas nao e usado.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // console.error e legitimo no catch; o resto costuma ser sobra de debug.
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // Regras de pura formatacao de template ficam desligadas de proposito.
      // Elas geravam ~1500 avisos que nao dizem nada sobre qualidade, e
      // afogariam os erros que importam. Formatacao e assunto de formatador,
      // nao de linter.
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
    },
  },
)
