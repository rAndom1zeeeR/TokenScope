import { address, type Address } from '@solana/kit'

export default defineEventHandler(async (event) => {
	enforceRateLimit(event, { key: 'tokens', limit: 60, windowMs: 60_000 })

	const raw = getRouterParam(event, 'address')
	if (!raw) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Missing address',
			data: { code: TOKEN_ERROR.invalidAddress },
		})
	}

	let mint: Address
	try {
		mint = address(raw)
	} catch {
		throw createError({
			statusCode: 400,
			statusMessage: 'Invalid mint address',
			data: { code: TOKEN_ERROR.invalidAddress },
		})
	}

	return await getToken(mint)
})
