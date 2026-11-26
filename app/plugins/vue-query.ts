import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query'
import { dehydrate, hydrate, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { NuxtApp, Plugin } from '#app'

/**
 * TanStack Query для Nuxt: один QueryClient на запрос (SSR) / на вкладку (клиент).
 * Состояние кэша после серверного рендера попадает в payload и подхватывается в браузере,
 * поэтому данные, загруженные на сервере, повторно не запрашиваются.
 */
const vueQueryPlugin: Plugin = defineNuxtPlugin((nuxtApp: NuxtApp): void => {
	const vueQueryState = useState<DehydratedState | null>('vue-query')

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Данные считаются свежими 30 с — столько же живёт кэш цены на сервере
				staleTime: 30_000,
				gcTime: 5 * 60_000,
			},
		},
	})

	nuxtApp.vueApp.use(VueQueryPlugin, { queryClient } satisfies VueQueryPluginOptions)

	if (import.meta.server) {
		nuxtApp.hooks.hook('app:rendered', () => {
			vueQueryState.value = dehydrate(queryClient)
		})
	}

	if (import.meta.client) {
		nuxtApp.hooks.hook('app:created', () => {
			if (!vueQueryState.value) return
			hydrate(queryClient, vueQueryState.value)
		})
	}
})

export default vueQueryPlugin
