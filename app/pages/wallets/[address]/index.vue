<script setup lang="ts">
const route = useRoute()
const address = route.params.address as string
</script>

<template>
	<section>
		<p>This page will be displayed at the /wallets/{{ address }} route.</p>
	</section>
</template>
