export interface Token {
	name: string
	symbol: string
	address: string
	price: number
	change24h: number
	isLive: boolean
	image: string | null
}

/** Ответ `GET /api/tokens/:address` — общий контракт сервера и клиента. */
export interface TokenResponse {
	address: string
	name: string
	symbol: string
	image: string | null
	decimals: number
	/** Supply в минимальных единицах, строкой (bigint не сериализуется в JSON). */
	supply: string
	/** `null`, если у Jupiter нет цены для токена. */
	price: number | null
	change24h: number | null
}
