<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
	{
		label: 'Tokens',
		to: '/token',
		icon: 'i-lucide-coins',
		active: route.path.startsWith('/token'),
	},
	{
		label: 'Wallets',
		icon: 'i-lucide-wallet',
		to: '/wallet',
		active: route.path.startsWith('/wallet'),
	},
])
</script>

<template>
	<UHeader>
		<template #title>
			<AppLogo />
		</template>

		<template #right>
			<UNavigationMenu :items="items" class="hidden lg:flex" />
		</template>

		<template #body>
			<UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
		</template>
	</UHeader>
</template>
