<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
	<UApp>
		<AppHeader />
		<UMain>
			<UContainer>
				<UError :error="error" />
			</UContainer>
		</UMain>
		<AppFooter />
	</UApp>
</template>
