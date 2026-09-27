import { cva } from 'class-variance-authority'

export const sectionVariants = cva('relative', {
	defaultVariants: {
		spacing: 'md',
		variant: 'default',
	},
	variants: {
		spacing: {
			lg: 'py-12 sm:py-16 lg:py-28',
			md: 'py-8 sm:py-12 lg:py-16',
			none: '',
			sm: 'py-6 sm:py-8',
		},
		variant: {
			default: '',
			muted: 'bg-muted/50 text-foreground',
			secondary: 'bg-secondary text-secondary-foreground',
		},
	},
})

export const sectionHeaderVariants = cva('flex flex-col', {
	defaultVariants: {
		align: 'start',
	},
	variants: {
		align: {
			center: 'items-center text-center',
			start: 'items-start text-start',
		},
	},
})
