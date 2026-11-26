/** `true` на главной странице: там нет поиска в шапке и хлебных крошек. */
export const useIsHome = () => {
	const route = useRoute()
	return computed(() => route.path === '/')
}
