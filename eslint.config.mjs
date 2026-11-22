import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from 'eslint-config-prettier/flat'

const vueTs = withVueTs(
	pluginVue.configs['flat/essential'],
	vueTsConfigs.recommended,
	skipFormatting,
)

export default vueTs.then((configs) => [
	{
		ignores: [
			'.nuxt/**',
			'.output/**',
			'.data/**',
			'.nitro/**',
			'.cache/**',
			'dist/**',
			'node_modules/**',
		],
	},
	...configs,
])
