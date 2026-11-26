import { useQuery } from '@tanstack/vue-query'

/**
 * Результат запроса токена. «Не найден» и «это не mint» — ожидаемые исходы, поэтому они
 * приходят как данные, а не как ошибка: так они попадают в SSR-кэш и не вызывают повторов.
 */
export type TokenLookup =
	| { status: 'ok'; token: TokenResponse }
	| { status: 'not-found' }
	| { status: 'not-mint' }

export const getErrorStatusCode = (error: unknown): number | undefined =>
	typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : undefined

/**
 * IP клиента для серверного лимита запросов. При SSR запрос к `/api` идёт внутри процесса
 * и сокета не имеет, поэтому без явного IP все посетители попали бы в одну корзину.
 * За прокси заголовок X-Forwarded-For уже есть и пробрасывается `useRequestFetch`;
 * без прокси берём адрес сокета входящего запроса.
 */
const useClientIpHeaders = (): Record<string, string> => {
	if (!import.meta.server) return {}

	const req = useRequestEvent()?.node.req
	if (!req || req.headers['x-forwarded-for']) return {}

	const ip = req.socket?.remoteAddress
	return ip ? { 'x-forwarded-for': ip } : {}
}

/** Код ошибки из тела ответа API: `{ data: { code } }` (в ofetch это `error.data.data.code`). */
const getErrorCode = (error: unknown): string | undefined => {
	if (typeof error !== 'object' || !error || !('data' in error)) return undefined
	const body = error.data
	if (typeof body !== 'object' || !body || !('data' in body)) return undefined
	const details = body.data
	return typeof details === 'object' && details && 'code' in details
		? String(details.code)
		: undefined
}

export const useTokenQuery = (address: MaybeRefOrGetter<string>) => {
	// На сервере пробрасывает заголовки клиента (в т.ч. X-Forwarded-For для лимита запросов)
	const requestFetch = useRequestFetch()
	const clientIpHeaders = useClientIpHeaders()
	const addr = computed(() => toValue(address))

	return useQuery({
		queryKey: ['token', addr],
		queryFn: async (): Promise<TokenLookup> => {
			try {
				const token = await requestFetch<TokenResponse>(`/api/tokens/${addr.value}`, {
					headers: clientIpHeaders,
				})
				return { status: 'ok', token }
			} catch (error) {
				const code = getErrorStatusCode(error)
				if (code === 404) return { status: 'not-found' }
				if (code === 400 && getErrorCode(error) === TOKEN_ERROR.notAMint) {
					return { status: 'not-mint' }
				}
				throw error
			}
		},
		// 429 повторять бессмысленно, остальные сбои — максимум два раза
		retry: (failureCount, error) => failureCount < 2 && getErrorStatusCode(error) !== 429,
	})
}
