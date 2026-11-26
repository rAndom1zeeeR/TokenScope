<script setup lang="ts">
import type { Token } from '~/types/token'

const route = useRoute()
const addressParam = computed(() => String(route.params.address))

const {
	data: meta,
	error,
	status,
} = useFetch<Token>(() => `/api/tokens/${addressParam.value}`, { watch: [addressParam] })

const token = computed<Token>(() => ({
	name: meta.value?.name ?? '',
	symbol: meta.value?.symbol ?? '',
	address: addressParam.value,
	image: meta.value?.image ?? null,
	price: meta.value?.price ?? 0,
	change24h: meta.value?.change24h ?? 0,
	isLive: true,
}))

useBreadcrumbLabel(() => token.value.symbol)
</script>

<template>
	<p v-if="status === 'pending'">Loading…</p>
	<p v-else-if="error">{{ error.statusText }}</p>
	<TokensHeader v-else :token="token" />
</template>
