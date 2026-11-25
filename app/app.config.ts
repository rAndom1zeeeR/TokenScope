export default defineAppConfig({
	ui: {
		colors: {
			primary: 'brand',
			secondary: 'violet',
			success: 'green',
			info: 'blue',
			warning: 'amber',
			error: 'red',
			neutral: 'ink',
		},
		header: {
			slots: {
				root: 'border-none',
				container: 'border-b border-default',
				title: 'text-lg gap-4',
			},
		},
		navigationMenu: {
			slots: {
				list: 'gap-4',
			},
		},
		footer: {
			slots: {
				container: 'border-t border-default',
			},
		},
		pageHero: {
			slots: {
				container: 'max-w-4xl',
				title: 'text-4xl sm:text-6xl',
				description: 'text-md sm:text-lg',
			},
		},
	},
})
