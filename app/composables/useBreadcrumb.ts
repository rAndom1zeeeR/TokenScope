import type { BreadcrumbItem } from '@nuxt/ui'

interface BreadcrumbLabels {
	[path: string]: string
}

const SEGMENT_LABELS: Record<string, string> = {
	token: 'Tokens',
	wallet: 'Wallets',
}

const formatSegment = (segment: string): string => {
	const known = SEGMENT_LABELS[segment]
	if (known) return known

	const decoded = decodeURIComponent(segment)
	if (decoded.length > 16) return `${decoded.slice(0, 6)}…${decoded.slice(-4)}`

	return decoded.charAt(0).toUpperCase() + decoded.slice(1)
}

export const useBreadcrumbLabels = () => useState<BreadcrumbLabels>('breadcrumb-labels', () => ({}))

export const useBreadcrumbItems = () => {
	const route = useRoute()
	const labels = useBreadcrumbLabels()

	const items = computed<BreadcrumbItem[]>(() => {
		const segments = route.path.split('/').filter(Boolean)
		const crumbs: BreadcrumbItem[] = [{ label: 'Home', icon: 'i-lucide-house', to: '/' }]

		segments.forEach((segment, index) => {
			const to = `/${segments.slice(0, index + 1).join('/')}`
			const isLast = index === segments.length - 1

			crumbs.push({
				label: labels.value[to] ?? formatSegment(segment),
				...(isLast ? {} : { to }),
			})
		})

		return crumbs
	})

	return { items }
}

export const useBreadcrumbLabel = (label: MaybeRefOrGetter<string | null | undefined>) => {
	const route = useRoute()
	const labels = useBreadcrumbLabels()

	watch(
		() => [route.path, toValue(label)] as const,
		([path, value], _, onCleanup) => {
			if (!value) return

			labels.value = { ...labels.value, [path]: value }

			onCleanup(() => {
				if (labels.value[path] !== value) return

				labels.value = Object.fromEntries(
					Object.entries(labels.value).filter(([key]) => key !== path),
				)
			})
		},
		{ immediate: true },
	)
}
