/**
 * Поиск по адресу: проверяет ввод и открывает страницу токена.
 * Если адрес окажется не mint'ом, страница токена предложит открыть его как кошелёк.
 */
export const useAddressSearch = () => {
	const toast = useToast()
	const query = ref('')

	const submit = async (value: string = query.value) => {
		const address = value.trim()

		if (!isSolanaAddress(address)) {
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
