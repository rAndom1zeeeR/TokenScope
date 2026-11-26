import type { H3Event } from 'h3'

interface Bucket {
	count: number
	resetAt: number
}

interface RateLimitOptions {
	/** Имя лимита: у разных эндпоинтов счётчики независимы. */
	key: string
	/** Сколько запросов разрешено за окно. */
	limit: number
	windowMs: number
}

// Счётчики живут в памяти процесса. Для нескольких инстансов нужно общее хранилище (Redis).
const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

const sweep = (now: number) => {
	for (const [id, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(id)
	}
	// защита от разрастания: если и после очистки всё занято, сбрасываем всё
	if (buckets.size > MAX_BUCKETS) buckets.clear()
}

/**
 * Фиксированное окно на IP. При превышении бросает 429 с `Retry-After`.
 * За прокси (Traefik/Dokploy) IP берётся из X-Forwarded-For.
 */
export const enforceRateLimit = (event: H3Event, { key, limit, windowMs }: RateLimitOptions) => {
	const now = Date.now()
	if (buckets.size >= MAX_BUCKETS) sweep(now)

	const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
	const id = `${key}:${ip}`

	let bucket = buckets.get(id)
	if (!bucket || bucket.resetAt <= now) {
		bucket = { count: 0, resetAt: now + windowMs }
		buckets.set(id, bucket)
	}
	bucket.count++

	setResponseHeader(event, 'X-RateLimit-Limit', limit)
	setResponseHeader(event, 'X-RateLimit-Remaining', Math.max(0, limit - bucket.count))

	if (bucket.count > limit) {
		setResponseHeader(event, 'Retry-After', Math.ceil((bucket.resetAt - now) / 1000))
		throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
	}
}
