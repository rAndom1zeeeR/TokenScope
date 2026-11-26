import { createSolanaRpc } from '@solana/kit'
import type { H3Event } from 'h3'

let cached: { url: string; rpc: ReturnType<typeof createSolanaRpc> } | undefined

/**
 * Один RPC-клиент на процесс; пересоздаётся, только если сменился `solanaRpcUrl`.
 * `event` необязателен: в кэшируемых функциях Nitro его нет, тогда берётся глобальный конфиг.
 */
export const useSolanaRpc = (event?: H3Event) => {
	const url = useRuntimeConfig(event).solanaRpcUrl
	if (!cached || cached.url !== url) cached = { url, rpc: createSolanaRpc(url) }
	return cached.rpc
}
