'use client'

import { useRender } from '@base-ui/react/use-render'
import {
	AnimatePresence,
	motion,
	type HTMLMotionProps,
	type TargetAndTransition,
	type Transition,
	type Variant,
	type Variants,
	useReducedMotion,
} from 'motion/react'
import React, { type ReactElement, type Ref } from 'react'

import { cn } from '@/lib/utils'

export type TextEffectPreset = 'blur' | 'fade-in-blur' | 'scale' | 'fade' | 'slide'
export type TextEffectPer = 'word' | 'char' | 'line'

export interface TextEffectProps extends Omit<
	HTMLMotionProps<'p'>,
	'animate' | 'children' | 'exit' | 'initial' | 'ref' | 'variants'
> {
	children: string
	containerTransition?: Transition
	delay?: number
	isActive?: boolean
	per?: TextEffectPer
	preset?: TextEffectPreset
	/** Forwarded to the rendered element. */
	ref?: Ref<HTMLParagraphElement>
	render?: useRender.RenderProp
	segmentTransition?: Transition
	segmentWrapperClassName?: string
	speedReveal?: number
	speedSegment?: number
	variants?: {
		container?: Variants
		item?: Variants
	}
}

const defaultStaggerTimes: Record<TextEffectPer, number> = {
	char: 0.03,
	word: 0.05,
	line: 0.1,
}

const defaultContainerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
}

const defaultItemVariants: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
}

const presetVariants: Record<TextEffectPreset, { container: Variants; item: Variants }> = {
	blur: {
		container: defaultContainerVariants,
		item: {
			hidden: { filter: 'blur(12px)', opacity: 0 },
			visible: { filter: 'blur(0px)', opacity: 1 },
			exit: { filter: 'blur(12px)', opacity: 0 },
		},
	},
	'fade-in-blur': {
		container: defaultContainerVariants,
		item: {
			hidden: { filter: 'blur(12px)', opacity: 0, y: 20 },
			visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
			exit: { filter: 'blur(12px)', opacity: 0, y: 20 },
		},
	},
	scale: {
		container: defaultContainerVariants,
		item: {
			hidden: { opacity: 0, scale: 0 },
			visible: { opacity: 1, scale: 1 },
			exit: { opacity: 0, scale: 0 },
		},
	},
	fade: {
		container: defaultContainerVariants,
		item: defaultItemVariants,
	},
	slide: {
		container: defaultContainerVariants,
		item: {
			hidden: { opacity: 0, y: 20 },
			visible: { opacity: 1, y: 0 },
			exit: { opacity: 0, y: 20 },
		},
	},
}

interface AnimatedSegmentProps {
	per: TextEffectPer
	segment: string
	segmentWrapperClassName?: string
	variants: Variants
}

const AnimatedSegment = React.memo(function AnimatedSegment({
	per,
	segment,
	segmentWrapperClassName,
	variants,
}: AnimatedSegmentProps): ReactElement {
	const content =
		per === 'char' ? (
			<motion.span aria-hidden="true" className="inline-block whitespace-pre">
				{segment.split('').map((character, index) => (
					<motion.span
						key={`${character}-${index}`}
						className="inline-block whitespace-pre"
						variants={variants}
					>
						{character}
					</motion.span>
				))}
			</motion.span>
		) : (
			<motion.span
				aria-hidden="true"
				className={per === 'line' ? 'block' : 'inline-block whitespace-pre'}
				variants={variants}
			>
				{segment}
			</motion.span>
		)

	if (!segmentWrapperClassName) return content

	return (
		<span className={cn(per === 'line' ? 'block' : 'inline-block', segmentWrapperClassName)}>
			{content}
		</span>
	)
})

function splitText(text: string, per: TextEffectPer): string[] {
	if (per === 'line') return text.split('\n')
	return text.split(/(\s+)/)
}

function hasTransition(
	variant?: Variant,
): variant is TargetAndTransition & { transition?: Transition } {
	return typeof variant === 'object' && variant !== null && 'transition' in variant
}

function withTransition(
	baseVariants: Variants,
	transition?: Transition & { exit?: Transition },
): Variants {
	if (!transition) return baseVariants

	const { exit, ...mainTransition } = transition

	return {
		...baseVariants,
		visible: {
			...baseVariants.visible,
			transition: {
				...(hasTransition(baseVariants.visible) ? baseVariants.visible.transition : {}),
				...mainTransition,
			},
		},
		exit: {
			...baseVariants.exit,
			transition: {
				...(hasTransition(baseVariants.exit) ? baseVariants.exit.transition : {}),
				...mainTransition,
				...exit,
			},
		},
	}
}

type TextEffectElementProps = useRender.ComponentProps<'p'>

function TextEffectElement({ render, ...props }: TextEffectElementProps) {
	return useRender({ defaultTagName: 'p', props, render })
}

const MotionTextEffectElement = motion.create(TextEffectElement)

export function TextEffect({
	children,
	containerTransition,
	delay = 0,
	isActive = true,
	per = 'word',
	preset = 'fade',
	segmentTransition,
	segmentWrapperClassName,
	speedReveal = 1,
	speedSegment = 1,
	variants,
	...props
}: TextEffectProps): ReactElement {
	const shouldReduceMotion = useReducedMotion()
	const segments = splitText(children, per)
	const baseVariants = presetVariants[preset]
	const customStagger = hasTransition(variants?.container?.visible)
		? variants.container.visible.transition?.staggerChildren
		: undefined
	const customDelay = hasTransition(variants?.container?.visible)
		? variants.container.visible.transition?.delayChildren
		: undefined
	const stagger = shouldReduceMotion ? 0 : defaultStaggerTimes[per] / speedReveal
	const duration = shouldReduceMotion ? 0 : 0.3 / speedSegment
	const computedVariants = {
		container: withTransition(variants?.container ?? baseVariants.container, {
			staggerChildren: customStagger ?? stagger,
			delayChildren: shouldReduceMotion ? 0 : (customDelay ?? delay),
			...containerTransition,
			...(shouldReduceMotion ? { delayChildren: 0, duration: 0, staggerChildren: 0 } : undefined),
			exit: {
				duration: shouldReduceMotion ? 0 : undefined,
				staggerChildren: customStagger ?? stagger,
				staggerDirection: -1,
			},
		}),
		item: withTransition(variants?.item ?? baseVariants.item, {
			...segmentTransition,
			duration,
		}),
	}

	return (
		<AnimatePresence initial={!shouldReduceMotion} mode="popLayout">
			{isActive ? (
				<MotionTextEffectElement
					{...props}
					animate="visible"
					data-slot="text-effect"
					exit="exit"
					initial={shouldReduceMotion ? false : 'hidden'}
					variants={computedVariants.container}
				>
					<span className="sr-only">{children}</span>
					{segments.map((segment, index) => (
						<AnimatedSegment
							key={`${per}-${index}-${segment}`}
							per={per}
							segment={segment}
							segmentWrapperClassName={segmentWrapperClassName}
							variants={computedVariants.item}
						/>
					))}
				</MotionTextEffectElement>
			) : null}
		</AnimatePresence>
	)
}
