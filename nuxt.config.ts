// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	typescript: {
		// Nuxt ставит `module: preserve` (TS >= 5.4). Редактор на TS 5.3 это значение
		// отбрасывает и запрещает top-level await в `<script setup>`.
		tsConfig: {
			compilerOptions: {
				module: 'ESNext',
			},
		},
	},
	modules: ['@nuxt/ui', '@nuxt/eslint'],
	css: ['~/assets/css/main.css'],
	colorMode: { preference: 'dark' },
	devServer: {
		port: 3013,
	},
	runtimeConfig: {
		solanaRpcUrl: 'https://api.mainnet.solana.com',
		jupiterApiKey: '',
	},
})
