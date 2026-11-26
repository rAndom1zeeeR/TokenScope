<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const isHome = useIsHome()
const { query, submit } = useAddressSearch()

const headerUi = computed(() =>
	isHome.value ? undefined : { center: 'flex min-w-0 flex-1 items-center justify-center' },
)

const items = computed<NavigationMenuItem[]>(() => [
	{
		label: 'Tokens',
		to: '/tokens',
		icon: 'i-lucide-coins',
		active: route.path.startsWith('/tokens'),
	},
	{
		label: 'Wallets',
		icon: 'i-lucide-wallet',
		to: '/wallets',
		active: route.path.startsWith('/wallets'),
	},
])
</script>

<template>
	<UHeader :ui="headerUi">
		<template #title>
			<AppLogo />
		</template>

		<UInput
			v-if="!isHome"
			v-model="query"
			type="search"
			icon="i-lucide-search"
			placeholder="Token or wallet address"
			color="neutral"
			variant="outline"
			size="xl"
			class="w-full"
			aria-label="Token or wallet address"
			autocomplete="off"
			:ui="{ base: 'font-mono rounded-lg text-sm py-3', leadingIcon: 'size-4', leading: 'ps-4' }"
			@keydown.enter="submit()"
		/>

		<template #right>
			<UNavigationMenu :items="items" class="hidden lg:flex" />
		</template>

		<template #body>
			<UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
		</template>
	</UHeader>
</template>
