import { cva } from 'class-variance-authority'

export const containerVariants = cva('mx-auto w-full', {
	defaultVariants: {
		gutter: 'default',
		size: 'default',
	},
	variants: {
		gutter: {
			default: 'px-4 md:px-8',
			none: '',
		},
		size: {
			default: 'max-w-7xl',
			full: 'max-w-none',
			narrow: 'max-w-3xl',
			wide: 'max-w-[120rem]',
		},
	},
})
