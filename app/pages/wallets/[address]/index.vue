<script setup lang="ts">
import { isSolanaAddress } from '#shared/utils/solana-address'

definePageMeta({
	validate: (route) => isSolanaAddress(String(route.params.address)),
})

const route = useRoute()
const address = computed(() => String(route.params.address))
</script>

<template>
	<section>
		<p>This page will be displayed at the /wallets/{{ address }} route.</p>
	</section>
</template>
