<template>
	<div
		class="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between"
		role="status"
		aria-live="polite"
		aria-busy="true"
	>
		<span class="sr-only">Loading token…</span>

		<div class="flex min-w-0 items-center gap-5">
			<USkeleton class="size-16 rounded-full" />
			<div class="space-y-2">
				<USkeleton class="h-8 w-48" />
				<USkeleton class="h-4 w-72 max-w-full" />
			</div>
		</div>

		<div class="space-y-2 sm:text-right">
			<USkeleton class="h-10 w-36 sm:ml-auto" />
			<USkeleton class="h-4 w-24 sm:ml-auto" />
		</div>
	</div>
</template>
