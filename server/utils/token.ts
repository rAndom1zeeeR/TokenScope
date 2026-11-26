import {
	addDecoderSizePrefix,
	address,
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
import type { TokenResponse } from '#shared/types/token'

const TOKEN_METADATA_PROGRAM = address('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Минты бывают только у SPL Token и Token-2022; аккаунт любой другой программы
// (кошелёк в System Program, token-account и т.д.) mint'ом быть не может.
const MINT_PROGRAMS = new Set<string>([
	'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
	'TokenzQdBNbLqP5VEhdkAMS9jvjjnWx4LfMXrnHEJEn', // Token-2022
])

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const ARWEAVE_GATEWAY = 'https://arweave.net/'
const MAX_IMAGE_URL_LENGTH = 2048

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

interface TokenMeta extends OnChainMetadata {
	decimals: number
	supply: string
}

interface JupiterPrice {
	usdPrice: number
	priceChange24h: number | null
}

// Старые Metaplex-метаданные дополнены \0 до фиксированной длины, а trim() их не убирает
const cleanString = (value: string) => value.replace(/\0/g, '').trim()

const shortAddress = (value: string) => `${value.slice(0, 4)}…${value.slice(-4)}`

const normalizeUri = (value: string) => {
	const trimmed = value.trim()
	if (trimmed.startsWith('ipfs://')) {
		const path = trimmed.slice('ipfs://'.length).replace(/^ipfs\//, '')
		return `${IPFS_GATEWAY}${path}`
	}
	if (trimmed.startsWith('ar://')) {
		return `${ARWEAVE_GATEWAY}${trimmed.slice('ar://'.length)}`
	}

	return trimmed
}

// Ссылку на картинку отдаём клиенту, поэтому пропускаем только обычный https
const toPublicImageUrl = (value: unknown) => {
	if (typeof value !== 'string' || !value || value.length > MAX_IMAGE_URL_LENGTH) return null
	const normalized = normalizeUri(value)
	try {
		const url = new URL(normalized)
		return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
	} catch {
		return null
	}
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
		name: cleanString(tokenMetadata.name),
		symbol: cleanString(tokenMetadata.symbol),
		uri: cleanString(tokenMetadata.uri),
	}
}

// Запасной разбор Token-2022 mint'а, если декодер не знает какое-то расширение
// (pump.fun и другие запускают токены с набором расширений). Читаем базовые поля
// и TLV-расширение TokenMetadata (тип 19) вручную.
const TOKEN_2022_ACCOUNT_TYPE_OFFSET = 165
const TOKEN_METADATA_EXTENSION = 19
const textDecoder = new TextDecoder()

const readMintFallback = (
	data: Uint8Array,
): { decimals: number; supply: string; metadata: OnChainMetadata | null } | null => {
	if (data.length < 82 || data[45] !== 1) return null // не mint или не инициализирован
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
	const result = {
		decimals: data[44]!,
		supply: view.getBigUint64(36, true).toString(),
		metadata: null as OnChainMetadata | null,
	}
	if (data.length <= TOKEN_2022_ACCOUNT_TYPE_OFFSET + 1) return result
	if (data[TOKEN_2022_ACCOUNT_TYPE_OFFSET] !== 1) return null // это token-account

	let offset = TOKEN_2022_ACCOUNT_TYPE_OFFSET + 1
	while (offset + 4 <= data.length) {
		const type = view.getUint16(offset, true)
		const length = view.getUint16(offset + 2, true)
		const start = offset + 4
		if (start + length > data.length) break
		if (type === TOKEN_METADATA_EXTENSION) {
			let cursor = start + 64 // updateAuthority + mint
			const readString = () => {
				const size = view.getUint32(cursor, true)
				const value = textDecoder.decode(data.subarray(cursor + 4, cursor + 4 + size))
				cursor += 4 + size
				return cleanString(value)
			}
			try {
				result.metadata = { name: readString(), symbol: readString(), uri: readString() }
			} catch {
				// битые данные расширения — считаем, что метаданных нет
			}
			break
		}
		offset = start + length
	}
	return result
}

const readMetaplexMetadata = (account: MaybeEncodedAccount): OnChainMetadata | null => {
	if (!account.exists || account.programAddress !== TOKEN_METADATA_PROGRAM) return null

	try {
		const decoded = metaplexHeaderDecoder.decode(account.data)
		return {
			name: cleanString(decoded.name),
			symbol: cleanString(decoded.symbol),
			uri: cleanString(decoded.uri),
		}
	} catch {
		// битые или нестандартные данные — считаем, что метаданных нет
		return null
	}
}

const notAMint = () =>
	createError({
		statusCode: 400,
		statusMessage: 'Address is not a token mint',
		data: { code: TOKEN_ERROR.notAMint },
	})

const loadTokenMeta = async (mint: Address): Promise<TokenMeta> => {
	const rpc = useSolanaRpc()
	const pda = await findMetadataPda(mint)
	const [mintEncoded, metadataEncoded] = await withRetry(() =>
		fetchEncodedAccounts<[string, string]>(rpc, [mint, pda]),
	)

	if (!mintEncoded.exists) {
		throw createError({ statusCode: 404, statusMessage: 'Mint not found' })
	}
	// Владелец не SPL Token / Token-2022 (форки токен-программ, новые программы):
	// принимаем, только если данные в точности выглядят как mint — 82 байта
	// либо расширенный mint с типом аккаунта 1. Кошельки и token-account'ы так не выглядят.
	const isKnownProgram = MINT_PROGRAMS.has(mintEncoded.programAddress)
	if (!isKnownProgram) {
		const { data } = mintEncoded
		const looksLikeMint = data.length === 82 || (data.length > 165 && data[165] === 1)
		if (!looksLikeMint) {
			console.warn(
				`[tokens] ${mint} is not a mint: owner ${mintEncoded.programAddress}, length ${data.length}`,
			)
			throw notAMint()
		}
	}

	// Аккаунт принадлежит Token-программе, но может быть token-account'ом,
	// а не mint'ом — тогда разбор не удастся.
	let decimals: number
	let supply: string
	let tokenMetadata: OnChainMetadata | null
	try {
		const mintAccount = decodeMint(mintEncoded)
		decimals = mintAccount.data.decimals
		supply = mintAccount.data.supply.toString()
		tokenMetadata = readToken2022Metadata(mintAccount)
	} catch {
		const fallback = readMintFallback(mintEncoded.data)
		if (!fallback) {
			const { data } = mintEncoded
			console.warn(
				`[tokens] ${mint} is not a mint: length ${data.length}, initialized ${data[45]}, type ${data[165]}`,
			)
			throw notAMint()
		}
		decimals = fallback.decimals
		supply = fallback.supply
		tokenMetadata = fallback.metadata
	}

	// У токена может не быть метаданных вовсе — это не ошибка, показываем по адресу
	const metadata: OnChainMetadata = tokenMetadata ??
		readMetaplexMetadata(metadataEncoded) ?? {
			name: shortAddress(mint),
			symbol: 'UNKNOWN',
			uri: '',
		}

	return {
		name: metadata.name || shortAddress(mint),
		symbol: metadata.symbol || 'UNKNOWN',
		uri: metadata.uri,
		decimals,
		supply,
	}
}

// Метаданные меняются крайне редко — кэшируем надолго.
// Ошибки (в т.ч. 404 и 400) не кэшируются.
const getTokenMeta = defineCachedFunction(loadTokenMeta, {
	name: 'meta',
	group: 'tokens',
	maxAge: 60 * 60,
	getKey: (mint: Address) => mint,
})

// Бросает при любой неудаче, поэтому неудачная загрузка картинки в кэш не попадает
// и через час будет повторена.
const loadTokenImage = async (uri: string) => {
	if (!uri) return null

	const json = await withRetry(
		() => fetchJsonSafe<{ image?: unknown }>(normalizeUri(uri), { timeout: 8000 }),
		{ attempts: 2 },
	)
	return toPublicImageUrl(json.image)
}

const getTokenImage = defineCachedFunction(loadTokenImage, {
	name: 'image',
	group: 'tokens',
	maxAge: 60 * 60,
	getKey: (uri: string) => uri,
})

const loadTokenPrice = async (mint: Address): Promise<JupiterPrice | null> => {
	const key = useRuntimeConfig().jupiterApiKey
	try {
		const json = await withRetry(
			() =>
				$fetch<Record<string, JupiterPrice>>(`https://api.jup.ag/price/v3?ids=${mint}`, {
					timeout: 8000,
					retry: 0, // повторами управляет withRetry
					headers: key ? { 'x-api-key': key } : undefined,
				}),
			{ attempts: 2 },
		)
		return json[mint] ?? null
	} catch {
		return null
	}
}

// Цена меняется часто — короткий кэш, чтобы не упереться в лимиты Jupiter.
const getTokenPrice = defineCachedFunction(loadTokenPrice, {
	name: 'price',
	group: 'tokens',
	maxAge: 30,
	getKey: (mint: Address) => mint,
})

const getTokenWithImage = async (mint: Address) => {
	const meta = await getTokenMeta(mint)
	const image = await getTokenImage(meta.uri).catch(() => null)
	return { ...meta, image }
}

/** Всё о токене: метаданные и картинка (цепочка) идут параллельно с ценой. */
export const getToken = async (mint: Address): Promise<TokenResponse> => {
	const [token, quote] = await Promise.all([getTokenWithImage(mint), getTokenPrice(mint)])

	return {
		address: mint,
		name: token.name,
		symbol: token.symbol,
		image: token.image,
		decimals: token.decimals,
		supply: token.supply,
		price: quote?.usdPrice ?? null,
		change24h: quote?.priceChange24h ?? null,
	}
}
