import withNuxt from './.nuxt/eslint.config.mjs'

// Форматирование — oxfmt (см. .oxfmtrc.json), ESLint только ищет ошибки.
export default withNuxt(
	{
		ignores: ['.data/**', '.nitro/**', '.cache/**'],
	},
	{
		rules: {
			'vue/html-self-closing': [
				'error',
				{
					html: { void: 'always', normal: 'always', component: 'always' },
					svg: 'always',
					math: 'always',
				},
			],
		},
	},
	{
		files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue'],
		rules: {
			'vue/multi-word-component-names': 'off',
		},
	},
)
