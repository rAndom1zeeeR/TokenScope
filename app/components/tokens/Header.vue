<script setup lang="ts">
interface Props {
	token: TokenResponse
}

const props = defineProps<Props>()

const toast = useToast()

const isUp = computed(() => props.token.change24h != null && props.token.change24h >= 0)
const isDown = computed(() => props.token.change24h != null && props.token.change24h < 0)
const priceLabel = computed(() => formatUsd(props.token.price))
const changeLabel = computed(() => formatChange(props.token.change24h))

const handleCopy = async () => {
	try {
		await navigator.clipboard.writeText(props.token.address)
		toast.add({ title: 'Address copied', color: 'neutral' })
	} catch {
		toast.add({ title: 'Could not copy address', color: 'error' })
	}
}
</script>

<template>
	<div class="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex min-w-0 items-center gap-5">
			<UAvatar
				:src="token.image || undefined"
				:alt="token.name"
				:text="(token.name || token.symbol).slice(0, 1)"
				size="3xl"
				color="neutral"
				:ui="{ root: 'rounded-full size-16' }"
			/>

			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-3">
					<h1 class="text-3xl font-semibold">{{ token.name }}</h1>
					<span class="text-sm text-muted font-mono">{{ token.symbol }}</span>
				</div>

				<div class="mt-1 flex min-w-0 items-center gap-1">
					<p class="truncate font-mono text-sm text-dimmed">{{ token.address }}</p>
					<UButton
						icon="i-lucide-copy"
						color="neutral"
						variant="ghost"
						size="xs"
						aria-label="Copy address"
						class="text-dimmed"
						@click="handleCopy"
					/>
				</div>
			</div>
		</div>

		<div class="shrink-0 text-right">
			<p class="text-4xl font-semibold tabular-nums font-mono">{{ priceLabel }}</p>
			<p class="mt-1 text-sm">
				<span class="tabular-nums" :class="{ 'text-success': isUp, 'text-error': isDown }">
					{{ changeLabel }}
				</span>
				<span class="text-muted"> 24h</span>
			</p>
		</div>
	</div>
</template>
