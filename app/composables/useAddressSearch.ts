// Адрес Solana: base58 (без 0, O, I, l), 32–44 символа
const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

/**
 * Поиск по адресу: проверяет ввод и открывает страницу токена.
 * Если адрес окажется не mint'ом, страница токена предложит открыть его как кошелёк.
 */
export const useAddressSearch = () => {
	const toast = useToast()
	const query = ref('')

	const submit = async (value: string = query.value) => {
		const address = value.trim()

		if (!ADDRESS_RE.test(address)) {
			toast.add({
				title: 'Enter a valid Solana address',
				description: 'Paste a token or wallet address (32–44 characters).',
				color: 'error',
			})
			return
		}

		await navigateTo(`/tokens/${address}`)
	}

	return { query, submit }
}
