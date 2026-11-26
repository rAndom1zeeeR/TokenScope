import dns from 'node:dns'
import https from 'node:https'
import { isIP } from 'node:net'

/**
 * Загрузка JSON по адресу, который нам дали «снаружи» (например, `uri` из метаданных токена).
 * Защита от SSRF: только https, без логина в URL, редиректы (до 3) проверяются заново, адрес должен резолвиться
 * в публичный IP (проверка делается в момент подключения, поэтому DNS rebinding не проходит),
 * ответ ограничен по размеру и по времени.
 */

const ipv4ToNumber = (ip: string) =>
	ip.split('.').reduce((acc, part) => acc * 256 + Number(part), 0)

// [начало, конец] непубличных IPv4-диапазонов
const PRIVATE_V4_RANGES: ReadonlyArray<readonly [string, string]> = [
	['0.0.0.0', '0.255.255.255'], // «этот» хост
	['10.0.0.0', '10.255.255.255'], // частная сеть
	['100.64.0.0', '100.127.255.255'], // CGNAT
	['127.0.0.0', '127.255.255.255'], // loopback
	['169.254.0.0', '169.254.255.255'], // link-local, в т.ч. метаданные облака 169.254.169.254
	['172.16.0.0', '172.31.255.255'], // частная сеть
	['192.0.0.0', '192.0.0.255'], // IETF
	['192.168.0.0', '192.168.255.255'], // частная сеть
	['198.18.0.0', '198.19.255.255'], // бенчмарки
	['224.0.0.0', '255.255.255.255'], // multicast и зарезервированные
]

const isPublicIpv4 = (ip: string) => {
	const value = ipv4ToNumber(ip)
	return !PRIVATE_V4_RANGES.some(
		([from, to]) => value >= ipv4ToNumber(from) && value <= ipv4ToNumber(to),
	)
}

export const isPublicIp = (ip: string): boolean => {
	const version = isIP(ip)
	if (version === 4) return isPublicIpv4(ip)
	if (version !== 6) return false

	const lower = ip.toLowerCase()
	// IPv4, «завёрнутый» в IPv6: ::ffff:127.0.0.1
	const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
	if (mapped) return isPublicIpv4(mapped[1]!)
	if (lower === '::' || lower === '::1') return false
	// fc00::/7 (unique local), fe80::/10 (link-local), ff00::/8 (multicast)
	if (/^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || lower.startsWith('ff')) return false
	return true
}

// Проверяем IP, в который реально резолвится имя, прямо при подключении.
const safeLookup = ((hostname, options, callback) => {
	dns.lookup(hostname, options, (error, address, family) => {
		if (error) return callback(error, address, family)

		const addresses = Array.isArray(address) ? address.map((entry) => entry.address) : [address]
		if (!addresses.length || !addresses.every((entry) => isPublicIp(entry))) {
			return callback(new Error('Blocked non-public address'), address, family)
		}
		callback(null, address, family)
	})
}) as NonNullable<https.RequestOptions['lookup']>

interface SafeFetchOptions {
	timeout?: number
	maxBytes?: number
	maxRedirects?: number
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

const requestJson = <T>(
	rawUrl: string,
	maxBytes: number,
	redirectsLeft: number,
	signal: AbortSignal,
): Promise<T> =>
	new Promise<T>((resolve, reject) => {
		let url: URL
		try {
			url = new URL(rawUrl)
		} catch {
			return reject(new Error('Invalid URL'))
		}

		if (url.protocol !== 'https:' || url.username || url.password) {
			return reject(new Error('Only plain https URLs are allowed'))
		}

		// IP-адрес прямо в URL обходит DNS-lookup, поэтому проверяем его сразу
		const host = url.hostname.replace(/^\[|\]$/g, '')
		if (isIP(host) && !isPublicIp(host)) {
			return reject(new Error('Blocked non-public address'))
		}

		const request = https.request(
			url,
			{
				method: 'GET',
				lookup: safeLookup,
				headers: { accept: 'application/json' },
				signal,
			},
			(response) => {
				const status = response.statusCode ?? 0

				if (REDIRECT_STATUSES.has(status)) {
					response.resume()
					if (redirectsLeft <= 0) return reject(new Error('Too many redirects'))

					const location = response.headers.location
					if (typeof location !== 'string' || !location) {
						return reject(new Error('Redirect without location'))
					}

					let nextUrl: string
					try {
						nextUrl = new URL(location, url).href
					} catch {
						return reject(new Error('Invalid redirect URL'))
					}

					// Каждый хоп заново проходит те же проверки: https, без логина, публичный IP
					requestJson<T>(nextUrl, maxBytes, redirectsLeft - 1, signal).then(resolve, reject)
					return
				}

				if (status !== 200) {
					response.resume()
					return reject(
						Object.assign(new Error(`Unexpected status ${status}`), {
							statusCode: status,
						}),
					)
				}

				const chunks: Buffer[] = []
				let size = 0
				response.on('data', (chunk: Buffer) => {
					size += chunk.length
					if (size > maxBytes) {
						request.destroy(new Error('Response too large'))
						return
					}
					chunks.push(chunk)
				})
				response.on('end', () => {
					try {
						resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as T)
					} catch (error) {
						reject(error)
					}
				})
				response.on('error', reject)
			},
		)

		request.on('error', reject)
		request.end()
	})

export const fetchJsonSafe = <T>(
	rawUrl: string,
	{ timeout = 8000, maxBytes = 256 * 1024, maxRedirects = 3 }: SafeFetchOptions = {},
): Promise<T> => requestJson<T>(rawUrl, maxBytes, maxRedirects, AbortSignal.timeout(timeout))
