<script setup lang="ts">
const route = useRoute()
const address = computed(() => String(route.params.address))
</script>

<template>
	<section>
		<p>This page will be displayed at the /wallets/{{ address }} route.</p>
	</section>
</template>
