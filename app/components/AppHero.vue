<script setup lang="ts">
const { query, submit } = useAddressSearch()

// Реальные токены Solana: по клику открывается страница с живыми данными
const examples = [
	{ symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
	{ symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
	{ symbol: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
] satisfies Array<{ symbol: string; address: string }>
</script>

<template>
	<UPageHero
		title="See who actually made money on any token."
		description="Paste a token address. TokenScope indexes every trader, ranks them by PnL and volume, and maps the wallets passing tokens to each other."
	>
		<template #headline>
			<UBadge color="neutral" variant="outline" size="lg" class="rounded-full px-4 py-2">
				<span class="size-1.5 rounded-full bg-primary" />
				Open source · Solana first · EVM next
			</UBadge>
		</template>

		<div class="mx-auto flex max-w-2xl w-full flex-col items-center gap-4">
			<div class="flex w-full items-center gap-2 rounded-2xl border border-default bg-elevated p-3">
				<UInput
					v-model="query"
					variant="none"
					size="xl"
					icon="i-lucide-search"
					placeholder="Token address"
					aria-label="Token address"
					autocomplete="off"
					class="flex-1"
					:ui="{ base: 'font-mono ps-14' }"
					@keydown.enter="submit()"
				/>
				<UButton size="xl" class="rounded-xl px-6" @click="submit()">Analyze</UButton>
			</div>

			<div class="flex flex-wrap items-center justify-center gap-2">
				<span class="text-sm text-muted">Try</span>
				<UButton
					v-for="example in examples"
					:key="example.address"
					color="neutral"
					variant="outline"
					size="lg"
					class="rounded-full font-mono"
					@click="submit(example.address)"
				>
					{{ example.symbol }}
				</UButton>
			</div>
		</div>
	</UPageHero>
</template>
