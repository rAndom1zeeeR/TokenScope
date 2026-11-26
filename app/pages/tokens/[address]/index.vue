<script setup lang="ts">
import { isSolanaAddress } from '#shared/utils/solana-address'

// Мусорный адрес — сразу 404, без запроса к серверу
definePageMeta({
	validate: (route) => isSolanaAddress(String(route.params.address)),
})

const route = useRoute()
const address = computed(() => String(route.params.address))

// Данные берёт и кэширует TanStack Query: при возврате на страницу они показываются сразу
// и обновляются в фоне, а запрос по смене адреса дедуплицируется.
const { data: lookup, error, isPending, refetch, suspense } = useTokenQuery(address)

const token = computed(() => (lookup.value?.status === 'ok' ? lookup.value.token : null))
const isNotFound = computed(() => lookup.value?.status === 'not-found')
// «not-mint»: адрес валиден, но это не mint (например, кошелёк)
const isNotMint = computed(() => lookup.value?.status === 'not-mint')
const isRateLimited = computed(() => getErrorStatusCode(error.value) === 429)

// SSR: дожидаемся данных до рендера. Для поисковиков «не найдено» должно быть настоящим 404.
const event = useRequestEvent()
onServerPrefetch(async () => {
	await suspense()
	if (event && (isNotFound.value || isNotMint.value)) setResponseStatus(event, 404)
})

useBreadcrumbLabel(() => token.value?.symbol)

useSeoMeta({
	title: () => {
		if (token.value) return token.value.symbol
		return isNotFound.value || isNotMint.value ? 'Token not found' : 'Token'
	},
	description: () =>
		token.value
			? `${token.value.name} (${token.value.symbol}) price and trader analytics on TokenScope.`
			: 'Token price and trader analytics on TokenScope.',
	robots: () => (isNotFound.value || isNotMint.value ? 'noindex' : undefined),
})
</script>

<template>
	<TokensHeaderSkeleton v-if="isPending" />

	<section v-else-if="isNotFound" class="py-8">
		<h1 class="text-xl font-semibold">Token not found</h1>
		<p class="mt-1 text-sm text-muted">
			We couldn't find a token with this address. Check that it is a valid mint address.
		</p>
	</section>

	<section v-else-if="isNotMint" class="py-8">
		<h1 class="text-xl font-semibold">This is not a token address</h1>
		<p class="mt-1 text-sm text-muted">
			The address exists, but it is not a token mint. It may be a wallet.
		</p>
		<UButton class="mt-4" color="neutral" variant="outline" :to="`/wallets/${address}`">
			Open as wallet
		</UButton>
	</section>

	<section v-else-if="isRateLimited" class="py-8">
		<h1 class="text-xl font-semibold">Too many requests</h1>
		<p class="mt-1 text-sm text-muted">Please wait a moment and try again.</p>
		<UButton class="mt-4" color="neutral" variant="outline" @click="() => refetch()">Retry</UButton>
	</section>

	<section v-else-if="error || !token" class="py-8">
		<h1 class="text-xl font-semibold">Something went wrong</h1>
		<p class="mt-1 text-sm text-muted">Failed to load the token. Please try again.</p>
		<UButton class="mt-4" color="neutral" variant="outline" @click="() => refetch()">Retry</UButton>
	</section>

	<TokensHeader v-else :token="token" />
</template>
