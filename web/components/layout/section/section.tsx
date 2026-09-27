import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { VariantProps } from 'class-variance-authority'
import type { ReactElement } from 'react'

import { cn } from '@/lib/utils'

import { sectionHeaderVariants, sectionVariants } from './section.styles'

export interface SectionRootProps extends useRender.ComponentProps<'section'> {
	spacing?: VariantProps<typeof sectionVariants>['spacing']
	variant?: VariantProps<typeof sectionVariants>['variant']
}

export interface SectionHeaderProps extends useRender.ComponentProps<'header'> {
	align?: VariantProps<typeof sectionHeaderVariants>['align']
}

export type SectionIconProps = useRender.ComponentProps<'div'>
export type SectionEyebrowProps = useRender.ComponentProps<'div'>
export type SectionTitleProps = useRender.ComponentProps<'h2'>
export type SectionDescriptionProps = useRender.ComponentProps<'p'>
export type SectionContentProps = useRender.ComponentProps<'div'>
export type SectionMediaProps = useRender.ComponentProps<'div'>

export function SectionRoot({
	className,
	render,
	spacing,
	variant,
	...props
}: SectionRootProps): ReactElement {
	const defaultProps = {
		className: cn(sectionVariants({ className, spacing, variant })),
		'data-slot': 'section',
		'data-variant': variant ?? 'default',
	}

	return useRender({
		defaultTagName: 'section',
		props: mergeProps<'section'>(defaultProps, props),
		render,
	})
}

export function SectionHeader({
	align,
	className,
	render,
	...props
}: SectionHeaderProps): ReactElement {
	const defaultProps = {
		className: cn(sectionHeaderVariants({ align, className })),
		'data-align': align ?? 'start',
		'data-slot': 'section-header',
	}

	return useRender({
		defaultTagName: 'header',
		props: mergeProps<'header'>(defaultProps, props),
		render,
	})
}

export function SectionIcon({ className, render, ...props }: SectionIconProps): ReactElement {
	const defaultProps = {
		className: cn('mb-4 text-primary', className),
		'data-slot': 'section-icon',
	}

	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(defaultProps, props),
		render,
	})
}

export function SectionEyebrow({ className, render, ...props }: SectionEyebrowProps): ReactElement {
	const defaultProps = {
		className: cn('mb-4 font-medium text-primary text-sm', className),
		'data-slot': 'section-eyebrow',
	}

	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(defaultProps, props),
		render,
	})
}

export function SectionTitle({ className, render, ...props }: SectionTitleProps): ReactElement {
	const defaultProps = {
		className: cn(
			'scroll-m-20 text-3xl font-bold tracking-tight text-foreground/90 sm:text-4xl',
			className,
		),
		'data-slot': 'section-title',
	}

	return useRender({
		defaultTagName: 'h2',
		props: mergeProps<'h2'>(defaultProps, props),
		render,
	})
}

export function SectionDescription({
	className,
	render,
	...props
}: SectionDescriptionProps): ReactElement {
	const defaultProps = {
		className: cn('mt-4 max-w-2xl text-muted-foreground text-lg/8', className),
		'data-slot': 'section-description',
	}

	return useRender({
		defaultTagName: 'p',
		props: mergeProps<'p'>(defaultProps, props),
		render,
	})
}

export function SectionContent({ className, render, ...props }: SectionContentProps): ReactElement {
	const defaultProps = {
		className,
		'data-slot': 'section-content',
	}

	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(defaultProps, props),
		render,
	})
}

export function SectionMedia({ className, render, ...props }: SectionMediaProps): ReactElement {
	const defaultProps = {
		className,
		'data-slot': 'section-media',
	}

	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(defaultProps, props),
		render,
	})
}
