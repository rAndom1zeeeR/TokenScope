<script setup lang="ts">
const isHome = useIsHome()
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
