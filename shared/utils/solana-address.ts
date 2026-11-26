// Адрес Solana: base58 (без 0, O, I, l), 32–44 символа
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

/** Машинные коды ошибок `GET /api/tokens/:address` (поле `data.code` в теле ответа). */
export const TOKEN_ERROR = {
	invalidAddress: 'INVALID_ADDRESS',
	notAMint: 'NOT_A_MINT',
} as const

/** Быстрая проверка формата адреса (длину в 32 байта точно проверяет сервер). */
export const isSolanaAddress = (value: string): boolean => SOLANA_ADDRESS_RE.test(value)
