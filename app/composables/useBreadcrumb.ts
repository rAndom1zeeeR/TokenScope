import type { BreadcrumbItem } from '@nuxt/ui'

interface BreadcrumbLabels {
	[path: string]: string
}

const SEGMENT_LABELS: Record<string, string> = {
	tokens: 'Tokens',
	wallets: 'Wallets',
}

// В адресной строке может оказаться битая последовательность вроде `%E0` — тогда
// decodeURIComponent бросает URIError и роняет страницу.
const safeDecode = (segment: string) => {
	try {
		return decodeURIComponent(segment)
	} catch {
		return segment
	}
}

const formatSegment = (segment: string): string => {
	const known = SEGMENT_LABELS[segment]
	if (known) return known

	const decoded = safeDecode(segment)
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

	const write = (path: string, value: string | null | undefined) => {
		if (!value || labels.value[path] === value) return

		labels.value = { ...labels.value, [path]: value }
	}

	// immediate: метка записывается сразу при установке (в т.ч. на сервере) и при каждом изменении
	watch(
		() => [route.path, toValue(label)] as const,
		([path, value], _, onCleanup) => {
			write(path, value)

			// При уходе со страницы убираем метку, чтобы в крошках не оставалось старого символа.
			// На сервере не чистим: состояние должно попасть в payload.
			onCleanup(() => {
				if (!import.meta.client || !value || labels.value[path] !== value) return

				labels.value = Object.fromEntries(
					Object.entries(labels.value).filter(([key]) => key !== path),
				)
			})
		},
		{ immediate: true },
	)
}
