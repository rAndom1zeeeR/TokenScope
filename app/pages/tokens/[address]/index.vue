<script setup lang="ts">
import type { Token } from '~/types/token'

interface TokenMeta {
	address: string
	name: string
	ticker: string
	image: string | null
}

const route = useRoute()
const addressParam = computed(() => String(route.params.address))

const {
	data: meta,
	error,
	status,
} = useFetch<TokenMeta>(() => `/api/tokens/${addressParam.value}`, { watch: [addressParam] })

const token = computed<Token>(() => ({
	name: meta.value?.name ?? '',
	ticker: meta.value?.ticker ?? '',
	address: addressParam.value,
	image: meta.value?.image ?? null,
	price: 0.00041,
	change24h: 128.4,
	isLive: true,
}))

useBreadcrumbLabel(() => token.value.ticker)
</script>

<template>
	<p v-if="status === 'pending'">Loading…</p>
	<p v-else-if="error">{{ error.statusText }}</p>
	<TokensHeader v-else :token="token" />
</template>
