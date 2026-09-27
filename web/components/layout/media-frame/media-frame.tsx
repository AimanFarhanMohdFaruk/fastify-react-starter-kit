import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { ReactElement } from 'react'

import { cn } from '@/lib/utils'

export type MediaFrameRootProps = useRender.ComponentProps<'figure'>
export type MediaFrameContentProps = useRender.ComponentProps<'div'>
export type MediaFrameOverlayProps = useRender.ComponentProps<'div'>
export type MediaFrameCaptionProps = useRender.ComponentProps<'figcaption'>

export function MediaFrameRoot({ className, render, ...props }: MediaFrameRootProps): ReactElement {
	const defaultProps = {
		className: cn('relative', className),
		'data-slot': 'media-frame',
	}

	return useRender({
		defaultTagName: 'figure',
		props: mergeProps<'figure'>(defaultProps, props),
		render,
	})
}

export function MediaFrameContent({
	className,
	render,
	...props
}: MediaFrameContentProps): ReactElement {
	const defaultProps = {
		className: cn('relative', className),
		'data-slot': 'media-frame-content',
	}

	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(defaultProps, props),
		render,
	})
}

export function MediaFrameOverlay({
	className,
	render,
	...props
}: MediaFrameOverlayProps): ReactElement {
	const defaultProps = {
		className: cn('pointer-events-none absolute inset-0', className),
		'data-slot': 'media-frame-overlay',
	}

	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(defaultProps, props),
		render,
	})
}

export function MediaFrameCaption({
	className,
	render,
	...props
}: MediaFrameCaptionProps): ReactElement {
	const defaultProps = {
		className: cn('mt-3 text-muted-foreground text-sm', className),
		'data-slot': 'media-frame-caption',
	}

	return useRender({
		defaultTagName: 'figcaption',
		props: mergeProps<'figcaption'>(defaultProps, props),
		render,
	})
}
