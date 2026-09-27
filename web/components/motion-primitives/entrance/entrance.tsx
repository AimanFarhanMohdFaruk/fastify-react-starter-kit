'use client'

import { useRender } from '@base-ui/react/use-render'
import {
	motion,
	type HTMLMotionProps,
	type Transition,
	type Variant,
	type Variants,
	useReducedMotion,
} from 'motion/react'
import { createContext, type ReactElement, type Ref, useContext } from 'react'

export type EntranceEffect = 'reveal' | 'fade' | 'slide-up' | 'scale' | 'blur'

export interface EntranceProps extends Omit<
	HTMLMotionProps<'div'>,
	'animate' | 'initial' | 'ref' | 'variants' | 'viewport' | 'whileInView'
> {
	/** Selects the entrance treatment. */
	effect?: EntranceEffect
	/** Replaces viewport observation when supplied. */
	isActive?: boolean
	/** Plays the viewport-triggered animation only once. */
	once?: boolean
	/** Forwarded to the rendered element. */
	ref?: Ref<HTMLDivElement>
	/** Replaces the default element while preserving merged props and refs. */
	render?: useRender.RenderProp
	/** Overrides the selected effect's Motion variants. */
	variants?: Variants
	/** Overrides Motion's viewport options. Replay behavior is owned by `once`. */
	viewport?: Omit<NonNullable<HTMLMotionProps<'div'>['viewport']>, 'once'>
}

export type EntranceRevealProps = Omit<EntranceProps, 'effect'>
export type EntranceFadeProps = Omit<EntranceProps, 'effect'>

export interface EntranceStaggerProps extends Omit<EntranceProps, 'children' | 'transition'> {
	children: ReactElement<EntranceStaggerItemProps> | ReactElement<EntranceStaggerItemProps>[]
	/** Delays the first item in seconds. */
	delay?: number
	/** Delays each successive item in seconds. */
	stagger?: number
	/**
	 * Merged into the group's `visible` transition alongside `delay` and `stagger`,
	 * so it configures how children are orchestrated rather than the group itself.
	 */
	transition?: EntranceProps['transition']
}

export interface EntranceStaggerItemProps extends Omit<
	HTMLMotionProps<'div'>,
	'animate' | 'initial' | 'ref' | 'viewport' | 'whileInView'
> {
	/** Overrides the effect inherited from Entrance.Stagger. */
	effect?: EntranceEffect
	/** Forwarded to the rendered element. */
	ref?: Ref<HTMLDivElement>
	/** Replaces the default element while preserving merged props and refs. */
	render?: useRender.RenderProp
}

type EntranceElementProps = useRender.ComponentProps<'div'>

function EntranceElement({ render, ...props }: EntranceElementProps) {
	return useRender({
		defaultTagName: 'div',
		props,
		render,
	})
}

const MotionEntranceElement = motion.create(EntranceElement)

const effectVariants: Record<EntranceEffect, Variants> = {
	reveal: {
		hidden: { filter: 'blur(6px)', opacity: 0, y: 16 },
		visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
	},
	fade: {
		hidden: { opacity: 0 },
		visible: { opacity: 1 },
	},
	'slide-up': {
		hidden: { opacity: 0, y: 24 },
		visible: { opacity: 1, y: 0 },
	},
	scale: {
		hidden: { opacity: 0, scale: 0.96 },
		visible: { opacity: 1, scale: 1 },
	},
	blur: {
		hidden: { filter: 'blur(10px)', opacity: 0 },
		visible: { filter: 'blur(0px)', opacity: 1 },
	},
}

const defaultTransition: NonNullable<EntranceProps['transition']> = {
	duration: 0.6,
	ease: [0.22, 1, 0.36, 1],
}

const defaultViewport = { margin: '0px 0px -20% 0px' } as const

/**
 * Folds orchestration into a variant's own transition instead of replacing the
 * variant, so supplying `variants` to a stagger group cannot silently discard
 * `delay` and `stagger`. Anything the variant states explicitly still wins.
 */
function withOrchestration(variant: Variant | undefined, orchestration: Transition): Variant {
	if (typeof variant === 'function') {
		return (...args: Parameters<typeof variant>) => {
			const resolved = variant(...args)

			if (typeof resolved === 'string') return resolved

			return { ...resolved, transition: { ...orchestration, ...resolved.transition } }
		}
	}

	return { ...variant, transition: { ...orchestration, ...variant?.transition } }
}

interface EntrancePrimitiveProps extends EntranceProps {
	effect: EntranceEffect
	slot: 'entrance-fade' | 'entrance-reveal' | 'entrance'
}

function EntrancePrimitive({
	effect,
	isActive,
	once = true,
	slot,
	transition = defaultTransition,
	variants = effectVariants[effect],
	viewport,
	...props
}: EntrancePrimitiveProps) {
	const shouldReduceMotion = useReducedMotion()
	const isControlled = isActive !== undefined
	const animate = shouldReduceMotion
		? 'visible'
		: isControlled
			? isActive
				? 'visible'
				: 'hidden'
			: undefined

	return (
		<MotionEntranceElement
			{...props}
			animate={animate}
			data-slot={slot}
			initial={shouldReduceMotion ? false : 'hidden'}
			transition={shouldReduceMotion ? { duration: 0 } : transition}
			variants={variants}
			viewport={
				isControlled || shouldReduceMotion ? undefined : { ...defaultViewport, ...viewport, once }
			}
			whileInView={isControlled || shouldReduceMotion ? undefined : 'visible'}
		/>
	)
}

export function EntranceReveal(props: EntranceRevealProps): ReactElement {
	return <EntrancePrimitive {...props} effect="reveal" slot="entrance-reveal" />
}

export function EntranceFade(props: EntranceFadeProps): ReactElement {
	return <EntrancePrimitive {...props} effect="fade" slot="entrance-fade" />
}

interface EntranceStaggerContextValue {
	delay: number
	effect: EntranceEffect
	stagger: number
}

const EntranceStaggerContext = createContext<EntranceStaggerContextValue | null>(null)

export function EntranceStaggerItem({
	effect: effectOverride,
	transition = defaultTransition,
	variants,
	...props
}: EntranceStaggerItemProps): ReactElement {
	const context = useContext(EntranceStaggerContext)
	const shouldReduceMotion = useReducedMotion()

	if (process.env.NODE_ENV !== 'production' && !context) {
		console.error(
			'Entrance.Stagger.Item must be rendered inside Entrance.Stagger. It renders its content unanimated outside a group.',
		)
	}

	const effect = effectOverride ?? context?.effect ?? 'reveal'

	return (
		<MotionEntranceElement
			{...props}
			data-slot="entrance-stagger-item"
			transition={shouldReduceMotion ? { duration: 0 } : transition}
			variants={variants ?? effectVariants[effect]}
		/>
	)
}

export function EntranceStaggerRoot({
	children,
	delay = 0,
	effect = 'reveal',
	isActive,
	once = true,
	stagger = 0.1,
	transition,
	variants,
	viewport,
	...props
}: EntranceStaggerProps): ReactElement {
	const shouldReduceMotion = useReducedMotion()
	const isControlled = isActive !== undefined
	const animate = shouldReduceMotion
		? 'visible'
		: isControlled
			? isActive
				? 'visible'
				: 'hidden'
			: undefined
	const orchestration: Transition = shouldReduceMotion
		? { delayChildren: 0, staggerChildren: 0 }
		: { delayChildren: delay, staggerChildren: stagger, ...transition }
	const baseVariants = variants ?? { hidden: {}, visible: {} }
	const groupVariants: Variants = {
		...baseVariants,
		visible: withOrchestration(baseVariants.visible, orchestration),
	}

	return (
		<EntranceStaggerContext value={{ delay, effect, stagger }}>
			<MotionEntranceElement
				{...props}
				animate={animate}
				data-slot="entrance-stagger"
				initial={shouldReduceMotion ? false : 'hidden'}
				variants={groupVariants}
				viewport={
					isControlled || shouldReduceMotion ? undefined : { ...defaultViewport, ...viewport, once }
				}
				whileInView={isControlled || shouldReduceMotion ? undefined : 'visible'}
			>
				{children}
			</MotionEntranceElement>
		</EntranceStaggerContext>
	)
}

export function EntranceRoot({ effect = 'reveal', ...props }: EntranceProps): ReactElement {
	return (
		<EntrancePrimitive
			{...props}
			effect={effect}
			slot={
				effect === 'fade' ? 'entrance-fade' : effect === 'reveal' ? 'entrance-reveal' : 'entrance'
			}
		/>
	)
}
