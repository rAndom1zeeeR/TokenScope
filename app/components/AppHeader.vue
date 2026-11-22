<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

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
	<UHeader title="TokenScope" :ui="{ title: 'items-center' }">
		<template #title>
			<LogoHeader />
		</template>

		<template #right>
			<UNavigationMenu :items="items" class="hidden lg:flex" />
		</template>

		<template #body>
			<UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
		</template>
	</UHeader>
</template>
