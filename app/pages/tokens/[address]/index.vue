<script setup lang="ts">
import type { Token } from '~/types/token'

const route = useRoute()

const token = computed<Token>(() => ({
	name: 'Froge',
	ticker: 'FROGE',
	address: String(route.params.address),
	price: 0.00041,
	change24h: 128.4,
	isLive: true,
}))

useBreadcrumbLabel(() => token.value.ticker)
</script>

<template>
	<TokensHeader :token="token" />
</template>
