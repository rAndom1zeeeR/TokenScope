<script setup lang="ts">
const route = useRoute()
const address = route.params.address as string
</script>

<template>
	<section>
		<p>This page will be displayed at the /token/{{ address }} route.</p>
	</section>
</template>
