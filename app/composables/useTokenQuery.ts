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
	typeof error === 'object' && error && 'statusCode' in error
		? Number(error.statusCode)
		: undefined

export const useTokenQuery = (address: MaybeRefOrGetter<string>) => {
	// На сервере пробрасывает заголовки клиента (в т.ч. X-Forwarded-For для лимита запросов)
	const requestFetch = useRequestFetch()
	const addr = computed(() => toValue(address))

	return useQuery({
		queryKey: ['token', addr],
		queryFn: async (): Promise<TokenLookup> => {
			try {
				const token = await requestFetch<TokenResponse>(`/api/tokens/${addr.value}`)
				return { status: 'ok', token }
			} catch (error) {
				const code = getErrorStatusCode(error)
				if (code === 404) return { status: 'not-found' }
				if (code === 400) return { status: 'not-mint' }
				throw error
			}
		},
		// 429 повторять бессмысленно, остальные сбои — максимум два раза
		retry: (failureCount, error) => failureCount < 2 && getErrorStatusCode(error) !== 429,
	})
}
