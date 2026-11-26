<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

type IndexState = 'live' | 'indexing' | 'ready'

interface RecentTokenIndex {
	state: IndexState
	progress?: number
}

interface RecentToken {
	name: string
	symbol: string
	address: string
	price: number
	change24h: number
	traders: number
	inProfit: number
	index: RecentTokenIndex
}

const data: RecentToken[] = [
	{
		name: 'Froge',
		symbol: 'FROGE',
		address: 'H4pM…r8Vd',
		price: 0.00041,
		change24h: 128.4,
		traders: 4812,
		inProfit: 31,
		index: { state: 'live' },
	},
	{
		name: 'Moon Cat',
		symbol: 'MOONCAT',
		address: '3dFh…q9Zt',
		price: 0.0192,
		change24h: -12.7,
		traders: 9286,
		inProfit: 24,
		index: { state: 'live' },
	},
	{
		name: 'Blokk',
		symbol: 'BLOKK',
		address: '9sRw…Lk4e',
		price: 0.00087,
		change24h: 3.1,
		traders: 1540,
		inProfit: 44,
		index: { state: 'indexing', progress: 64 },
	},
	{
		name: 'Nimbus',
		symbol: 'NMBS',
		address: 'Ek2V…b7Hn',
		price: 1.84,
		change24h: -0.9,
		traders: 27330,
		inProfit: 38,
		index: { state: 'ready' },
	},
	{
		name: 'Pixelpaw',
		symbol: 'PXLP',
		address: 'Ac8T…u1Dy',
		price: 0.0033,
		change24h: 41.0,
		traders: 3078,
		inProfit: 29,
		index: { state: 'ready' },
	},
]

const right = { class: { th: 'text-right', td: 'text-right' } }

const UButton = resolveComponent('UButton')

// Начальная сортировка: по числу трейдеров, по убыванию
const sorting = ref([{ id: 'traders', desc: true }])

// Шапка колонки в виде кнопки с иконкой направления
function sortable(label: string): TableColumn<RecentToken>['header'] {
	return ({ column }) => {
		const sorted = column.getIsSorted()
		return h(UButton, {
			label,
			color: 'neutral',
			variant: 'ghost',
			size: 'xs',
			class: '-mx-2.5 uppercase font-normal text-muted',
			icon: sorted
				? sorted === 'asc'
					? 'i-lucide-arrow-up-narrow-wide'
					: 'i-lucide-arrow-down-wide-narrow'
				: 'i-lucide-arrow-up-down',
			onClick: () => column.toggleSorting(sorted === 'asc'),
		})
	}
}

const columns: TableColumn<RecentToken>[] = [
	{ accessorKey: 'name', header: sortable('Token') },
	{ accessorKey: 'price', header: sortable('Price'), meta: right },
	{ accessorKey: 'change24h', header: sortable('24h'), meta: right },
	{ accessorKey: 'traders', header: sortable('Traders'), meta: right },
	{ accessorKey: 'inProfit', header: sortable('In profit'), meta: right },
	{ accessorKey: 'index', header: 'Index', enableSorting: false },
]

const int = new Intl.NumberFormat('en-US')

const indexView = {
	live: { color: 'success', label: 'Live' },
	indexing: { color: 'warning', label: 'Indexing' },
	ready: { color: 'neutral', label: 'Ready' },
} as const
</script>

<template>
	<section class="mb-12">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="font-semibold">Recently analyzed</h2>
			<span class="text-xs text-muted">Sample data</span>
		</div>

		<UTable
			v-model:sorting="sorting"
			:data="data"
			:columns="columns"
			class="rounded-xl border border-default"
			:ui="{ th: 'text-xs uppercase font-normal text-muted', td: 'font-mono' }"
		>
			<template #name-cell="{ row }">
				<div class="flex items-center gap-3 font-sans">
					<UAvatar :text="row.original.name[0]" size="md" />
					<div class="leading-tight">
						<p>
							<span class="font-medium">{{ row.original.name }}</span>
							<span class="text-muted"> {{ row.original.symbol }}</span>
						</p>
						<p class="font-mono text-xs text-dimmed">{{ row.original.address }}</p>
					</div>
				</div>
			</template>

			<template #price-cell="{ row }">
				{{ formatUsd(row.original.price) }}
			</template>

			<template #change24h-cell="{ row }">
				<span :class="row.original.change24h >= 0 ? 'text-success' : 'text-error'">
					{{ formatChange(row.original.change24h) }}
				</span>
			</template>

			<template #traders-cell="{ row }">
				{{ int.format(row.original.traders) }}
			</template>

			<template #inProfit-cell="{ row }">{{ row.original.inProfit }}%</template>

			<template #index-cell="{ row }">
				<div class="flex items-center gap-2 font-sans">
					<UChip standalone inset :color="indexView[row.original.index.state].color" />
					<span>
						{{ indexView[row.original.index.state].label }}
						<template v-if="row.original.index.progress">
							{{ row.original.index.progress }}%</template
						>
					</span>
				</div>
			</template>
		</UTable>
	</section>
</template>
