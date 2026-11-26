<script setup lang="ts">
useHead({
	htmlAttrs: { lang: 'en' },
	titleTemplate: (title) => (title ? `${title} · TokenScope` : 'TokenScope'),
})

useSeoMeta({
	description: 'Open-source token and trader analytics: who made money on any token.',
	ogSiteName: 'TokenScope',
})
</script>

<template>
	<UApp>
		<NuxtLayout>
			<NuxtRouteAnnouncer />
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>
