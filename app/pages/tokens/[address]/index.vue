<script setup lang="ts">
const route = useRoute()
const address = computed(() => String(route.params.address))

// Геттер-URL реактивен сам: при смене адреса useFetch перезапросит данные
const {
	data: token,
	error,
	status,
	refresh,
} = await useFetch<TokenResponse>(() => `/api/tokens/${address.value}`)

const isNotFound = computed(() => error.value?.statusCode === 404)

useBreadcrumbLabel(() => token.value?.symbol)

useSeoMeta({
	title: () => (token.value ? `${token.value.symbol} · TokenScope` : 'Token · TokenScope'),
	description: () =>
		token.value
			? `${token.value.name} (${token.value.symbol}) price and trader analytics on TokenScope.`
			: 'Token price and trader analytics on TokenScope.',
})
</script>

<template>
	<p v-if="status === 'pending'">Loading…</p>

	<section v-else-if="isNotFound" class="py-8">
		<h1 class="text-xl font-semibold">Token not found</h1>
		<p class="mt-1 text-sm text-muted">
			We couldn't find a token with this address. Check that it is a valid mint address.
		</p>
	</section>

	<section v-else-if="error || !token" class="py-8">
		<h1 class="text-xl font-semibold">Something went wrong</h1>
		<p class="mt-1 text-sm text-muted">Failed to load the token. Please try again.</p>
		<UButton class="mt-4" color="neutral" variant="outline" @click="() => refresh()">Retry</UButton>
	</section>

	<TokensHeader v-else :token="token" />
</template>
