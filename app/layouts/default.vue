<script setup lang="ts">
const route = useRoute()
const isHome = computed(() => route.path === '/')
</script>

<template>
	<div>
		<AppHeader />
		<UMain>
			<UContainer>
				<div v-if="!isHome" class="pt-6 pb-4">
					<AppBreadcrumb />
				</div>
				<slot />
			</UContainer>
		</UMain>
		<AppFooter />
	</div>
</template>
