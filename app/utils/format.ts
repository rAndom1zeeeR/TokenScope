const EMPTY = '—'

const usd = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumSignificantDigits: 3,
})

/** Цена в долларах: `$0.00041`, `$1.84`; `—`, если цены нет */
export const formatUsd = (value: number | null | undefined): string =>
	value == null ? EMPTY : usd.format(value)

/** Изменение за период со стрелкой: `▲ +12.3%` / `▼ -4.5%`; `—`, если данных нет */
export const formatChange = (value: number | null | undefined): string => {
	if (value == null) return EMPTY
	return value >= 0 ? `▲ +${value.toFixed(1)}%` : `▼ ${value.toFixed(1)}%`
}
