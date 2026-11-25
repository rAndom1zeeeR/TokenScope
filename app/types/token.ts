export interface Token {
	name: string
	ticker: string
	address: string
	price: number
	change24h: number
	isLive: boolean
	image: string | null
}
