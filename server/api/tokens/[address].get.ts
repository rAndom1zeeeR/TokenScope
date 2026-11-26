import {
	addDecoderSizePrefix,
	address,
	createSolanaRpc,
	fetchEncodedAccounts,
	getAddressDecoder,
	getAddressEncoder,
	getProgramDerivedAddress,
	getStructDecoder,
	getU32Decoder,
	getU8Decoder,
	getUtf8Decoder,
	unwrapOption,
	type Account,
	type Address,
	type MaybeEncodedAccount,
} from '@solana/kit'
import { decodeMint, type Mint } from '@solana-program/token-2022'

const TOKEN_METADATA_PROGRAM = address('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

const borshString = () => addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())

const metaplexHeaderDecoder = getStructDecoder([
	['key', getU8Decoder()],
	['updateAuthority', getAddressDecoder()],
	['mint', getAddressDecoder()],
	['name', borshString()],
	['symbol', borshString()],
	['uri', borshString()],
])

interface OnChainMetadata {
	name: string
	symbol: string
	uri: string
}

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

const normalizeUri = (value: string) => {
	const trimmed = value.trim()
	if (trimmed.startsWith('ipfs://')) {
		const path = trimmed.slice('ipfs://'.length).replace(/^ipfs\//, '')
		return `${IPFS_GATEWAY}${path}`
	}

	try {
		const url = new URL(trimmed)
		const marker = '/ipfs/'
		const index = url.pathname.indexOf(marker)
		if (index === -1) return trimmed
		return `${IPFS_GATEWAY}${url.pathname.slice(index + marker.length)}${url.search}`
	} catch {
		return trimmed
	}
}

const TRANSIENT_CODES = new Set([
	'ECONNRESET',
	'ECONNREFUSED',
	'ETIMEDOUT',
	'UND_ERR_SOCKET',
	'UND_ERR_CONNECT_TIMEOUT',
])

const isTransientNetworkError = (error: unknown) => {
	let current: unknown = error
	for (let depth = 0; current && depth < 4; depth++) {
		if (typeof current !== 'object') return false
		if ('code' in current && TRANSIENT_CODES.has(String(current.code))) return true
		current = 'cause' in current ? current.cause : undefined
	}
	return false
}

const withRetry = async <T>(task: () => Promise<T>) => {
	let lastError: unknown
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			return await task()
		} catch (error) {
			lastError = error
			if (!isTransientNetworkError(error) || attempt === 2) throw error
			await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)))
		}
	}
	throw lastError
}

const findMetadataPda = async (mint: Address) => {
	const enc = getAddressEncoder()
	const [pda] = await getProgramDerivedAddress({
		programAddress: TOKEN_METADATA_PROGRAM,
		seeds: ['metadata', enc.encode(TOKEN_METADATA_PROGRAM), enc.encode(mint)],
	})
	return pda
}

const readToken2022Metadata = (mintAccount: Account<Mint>): OnChainMetadata | null => {
	const extensions = unwrapOption(mintAccount.data.extensions)
	const tokenMetadata = extensions?.find((extension) => extension.__kind === 'TokenMetadata')
	if (tokenMetadata?.__kind !== 'TokenMetadata') return null
	return {
		name: tokenMetadata.name.trim(),
		symbol: tokenMetadata.symbol.trim(),
		uri: tokenMetadata.uri.trim(),
	}
}

const readMetaplexMetadata = (account: MaybeEncodedAccount): OnChainMetadata | null => {
	if (!account.exists || account.programAddress !== TOKEN_METADATA_PROGRAM) return null

	const decoded = metaplexHeaderDecoder.decode(account.data)
	return {
		name: decoded.name.trim(),
		symbol: decoded.symbol.trim(),
		uri: decoded.uri.trim(),
	} satisfies OnChainMetadata
}

const readImage = async (uri: string) => {
	if (!uri) return null

	try {
		const json = await $fetch<{ image?: string }>(normalizeUri(uri), { timeout: 8000 })
		return json.image ? normalizeUri(json.image) : null
	} catch {
		return null
	}
}

interface JupiterPrice {
	usdPrice: number
	priceChange24h: number | null
}
const readPrice = async (mint: Address) => {
	const key = useRuntimeConfig().jupiterApiKey
	try {
		const json = await $fetch<Record<string, JupiterPrice>>(
			`https://api.jup.ag/price/v3?ids=${mint}`,
			{ timeout: 8000, headers: key ? { 'x-api-key': key } : undefined },
		)
		return json[mint] ?? null
	} catch {
		return null
	}
}

export default defineEventHandler(async (event) => {
	const raw = getRouterParam(event, 'address')
	if (!raw) {
		throw createError({ statusCode: 400, statusMessage: 'Missing address' })
	}

	let mint: Address
	try {
		mint = address(raw)
	} catch {
		throw createError({ statusCode: 400, statusMessage: 'Invalid mint address' })
	}

	// Цена не зависит от метаданных — запускаем сразу и не ждём,
	// пока отработает цепочка RPC → декодирование → картинка.
	// readPrice сам глотает ошибки, поэтому unhandled rejection не будет,
	// даже если RPC ниже бросит 404.
	const pricePromise = readPrice(mint)

	const rpc = createSolanaRpc(useRuntimeConfig().solanaRpcUrl)
	const pda = await findMetadataPda(mint)
	const [mintEncoded, metadataEncoded] = await withRetry(() =>
		fetchEncodedAccounts<[string, string]>(rpc, [mint, pda]),
	)

	const mintAccount = decodeMint(mintEncoded)
	if (!mintAccount.exists) {
		throw createError({ statusCode: 404, statusMessage: 'Mint not found' })
	}

	const metadata = readToken2022Metadata(mintAccount) ?? readMetaplexMetadata(metadataEncoded)
	if (!metadata) {
		throw createError({ statusCode: 404, statusMessage: 'Token metadata not found' })
	}

	// Картинка (IPFS) и цена (Jupiter) ждутся параллельно
	const [image, quote] = await Promise.all([readImage(metadata.uri), pricePromise])

	return {
		address: mint,
		name: metadata.name,
		symbol: metadata.symbol,
		image,
		decimals: mintAccount.data.decimals,
		supply: mintAccount.data.supply.toString(),
		price: quote?.usdPrice ?? null,
		change24h: quote?.priceChange24h ?? null,
	}
})
