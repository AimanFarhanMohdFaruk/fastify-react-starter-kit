import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { VariantProps } from 'class-variance-authority'
import type React from 'react'

import { cn } from '@/lib/utils'

import { containerVariants } from './container.styles'

export interface ContainerProps extends useRender.ComponentProps<'div'> {
	gutter?: VariantProps<typeof containerVariants>['gutter']
	size?: VariantProps<typeof containerVariants>['size']
}

export function Container({
	className,
	gutter,
	render,
	size,
	...props
}: ContainerProps): React.ReactElement {
	const defaultProps = {
		className: cn(containerVariants({ className, gutter, size })),
		'data-slot': 'container',
	}

	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(defaultProps, props),
		render,
	})
}
