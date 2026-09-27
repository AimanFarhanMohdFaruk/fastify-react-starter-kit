'use client'

import { useRender } from '@base-ui/react/use-render'
import {
	motion,
	type HTMLMotionProps,
	type TargetAndTransition,
	type Transition,
	useReducedMotion,
} from 'motion/react'
import type { CSSProperties, ReactElement, Ref } from 'react'

import { cn } from '@/lib/utils'

export type GlowEffectMode = 'rotate' | 'pulse' | 'breathe' | 'static'
export type GlowEffectBlur =
	| number
	| 'softest'
	| 'soft'
	| 'medium'
	| 'strong'
	| 'stronger'
	| 'strongest'
	| 'none'

export interface GlowEffectProps extends Omit<
	HTMLMotionProps<'div'>,
	'animate' | 'ref' | 'transition'
> {
	blur?: GlowEffectBlur
	colors?: string[]
	duration?: number
	mode?: GlowEffectMode
	/** Forwarded to the rendered element. */
	ref?: Ref<HTMLDivElement>
	render?: useRender.RenderProp
	scale?: number
	transition?: Transition
}

const blurClasses: Record<Exclude<GlowEffectBlur, number>, string> = {
	softest: 'blur-xs',
	soft: 'blur-sm',
	medium: 'blur-md',
	strong: 'blur-lg',
	stronger: 'blur-xl',
	strongest: 'blur-2xl',
	none: 'blur-none',
}

type GlowEffectElementProps = useRender.ComponentProps<'div'>

function GlowEffectElement({ render, ...props }: GlowEffectElementProps) {
	return useRender({ defaultTagName: 'div', props, render })
}

const MotionGlowEffectElement = motion.create(GlowEffectElement)

export function GlowEffect({
	blur = 'medium',
	className,
	colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'],
	duration = 5,
	mode = 'rotate',
	scale = 1,
	style,
	transition,
	...props
}: GlowEffectProps): ReactElement {
	const shouldReduceMotion = useReducedMotion()
	const staticGradient = `linear-gradient(to right, ${colors.join(', ')})`
	const baseTransition: Transition = {
		duration,
		ease: 'linear',
		repeat: Infinity,
	}
	const animations: Record<GlowEffectMode, TargetAndTransition> = {
		rotate: {
			background: [
				`conic-gradient(from 0deg at 50% 50%, ${colors.join(', ')})`,
				`conic-gradient(from 360deg at 50% 50%, ${colors.join(', ')})`,
			],
			transition: transition ?? baseTransition,
		},
		pulse: {
			background: colors.map(
				(color) => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`,
			),
			opacity: [0.5, 0.8, 0.5],
			scale: [scale, 1.1 * scale, scale],
			transition: transition ?? { ...baseTransition, repeatType: 'mirror' },
		},
		breathe: {
			background: colors.map(
				(color) => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`,
			),
			scale: [scale, 1.05 * scale, scale],
			transition: transition ?? { ...baseTransition, repeatType: 'mirror' },
		},
		static: { background: staticGradient, scale },
	}
	const animation = shouldReduceMotion
		? { background: staticGradient, scale, transition: { duration: 0 } }
		: animations[mode]
	const glowStyle = {
		...(typeof blur === 'number' ? { filter: `blur(${blur}px)` } : {}),
		...style,
		'--glow-scale': scale,
		backfaceVisibility: 'hidden',
		willChange: shouldReduceMotion ? undefined : 'transform',
	} as CSSProperties

	return (
		<MotionGlowEffectElement
			{...props}
			animate={animation}
			className={cn(
				'pointer-events-none absolute inset-0 h-full w-full scale-[var(--glow-scale)] transform-gpu',
				typeof blur === 'number' ? undefined : blurClasses[blur],
				className,
			)}
			data-slot="glow-effect"
			style={glowStyle}
		/>
	)
}
