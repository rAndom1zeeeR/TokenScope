<script setup lang="ts">
import type { Token } from '~/types/token'

interface Props {
	token: Token
}

const props = defineProps<Props>()

const toast = useToast()
const isWatching = ref(false)

const usd = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumSignificantDigits: 3,
})

const isUp = computed(() => props.token.change24h >= 0)
const priceLabel = computed(() => usd.format(props.token.price))
const changeLabel = computed(() => {
	const value = props.token.change24h
	return isUp.value ? `▲ +${value.toFixed(1)}%` : `▼ ${value.toFixed(1)}%`
})

const handleCopy = async () => {
	try {
		await navigator.clipboard.writeText(props.token.address)
		toast.add({ title: 'Address copied', color: 'neutral' })
	} catch {
		toast.add({ title: 'Could not copy address', color: 'error' })
	}
}

const handleWatch = () => {
	isWatching.value = !isWatching.value
}
</script>

<template>
	<div class="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex min-w-0 items-center gap-5">
			<UAvatar
				:src="token.image || undefined"
				:alt="token.name"
				:text="token.name.slice(0, 1)"
				size="3xl"
				color="neutral"
				:ui="{ root: 'rounded-full size-16' }"
			/>

			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-3">
					<h1 class="text-3xl font-semibold">{{ token.name }}</h1>
					<span class="text-sm text-muted font-mono">{{ token.ticker }}</span>
					<UBadge
						v-if="token.isLive"
						color="neutral"
						variant="outline"
						size="md"
						:ui="{ base: 'rounded-full' }"
					>
						<span class="size-1.5 rounded-full bg-success" />
						Live
					</UBadge>
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

		<div class="flex shrink-0 items-center gap-4">
			<div class="text-right">
				<p class="text-4xl font-semibold tabular-nums font-mono">{{ priceLabel }}</p>
				<p class="text-sm mt-1">
					<span class="tabular-nums" :class="{ 'text-success': isUp, 'text-error': !isUp }">
						{{ changeLabel }}
					</span>
					<span class="text-muted"> 24h</span>
				</p>
			</div>

			<UButton
				color="neutral"
				size="lg"
				variant="outline"
				:aria-pressed="isWatching"
				@click="handleWatch"
			>
				{{ isWatching ? 'Watching' : 'Watch' }}
			</UButton>
		</div>
	</div>
</template>
