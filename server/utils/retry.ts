const TRANSIENT_CODES = new Set([
	'ECONNRESET',
	'ECONNREFUSED',
	'ETIMEDOUT',
	'UND_ERR_SOCKET',
	'UND_ERR_CONNECT_TIMEOUT',
])

// Временные HTTP-ошибки: таймаут запроса, rate limit, сбои на стороне сервера.
// Таймаут нашего клиента (AbortError) сюда не входит — повтор удвоил бы ожидание.
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])

const hasRetryableStatus = (value: object) => {
	// ofetch: statusCode; @solana/kit: context.statusCode
	if ('statusCode' in value && RETRYABLE_STATUSES.has(Number(value.statusCode))) return true
	if ('context' in value && typeof value.context === 'object' && value.context) {
		return 'statusCode' in value.context && RETRYABLE_STATUSES.has(Number(value.context.statusCode))
	}
	return false
}

/** Сетевой сбой или временный HTTP-статус (в самой ошибке или в цепочке `cause`). */
export const isRetryableError = (error: unknown) => {
	let current: unknown = error
	for (let depth = 0; current && depth < 4; depth++) {
		if (typeof current !== 'object') return false
		if ('code' in current && TRANSIENT_CODES.has(String(current.code))) return true
		if (hasRetryableStatus(current)) return true
		current = 'cause' in current ? current.cause : undefined
	}
	return false
}

interface RetryOptions {
	/** Всего попыток, включая первую. */
	attempts?: number
	/** Пауза перед повтором растёт линейно: delayMs, 2·delayMs, … */
	delayMs?: number
}

export const withRetry = async <T>(
	task: () => Promise<T>,
	{ attempts = 3, delayMs = 200 }: RetryOptions = {},
): Promise<T> => {
	for (let attempt = 1; ; attempt++) {
		try {
			return await task()
		} catch (error) {
			if (attempt >= attempts || !isRetryableError(error)) throw error
			await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
		}
	}
}
