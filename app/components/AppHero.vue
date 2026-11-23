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
					variant="none"
					size="xl"
					icon="i-lucide-search"
					placeholder="Token address or ticker"
					class="flex-1"
					:ui="{ base: 'font-mono ps-14' }"
				/>
				<UButton size="xl" class="rounded-xl px-6">Analyze</UButton>
			</div>

			<div class="flex flex-wrap items-center justify-center gap-2">
				<span class="text-sm text-muted">Try</span>
				<UButton
					v-for="ticker in ['$FROGE', '$MOONCAT', '$BLOKK']"
					:key="ticker"
					color="neutral"
					variant="outline"
					size="lg"
					class="rounded-full font-mono"
				>
					{{ ticker }}
				</UButton>
			</div>
		</div>
	</UPageHero>
</template>
