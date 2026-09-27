import {
	EntranceFade,
	EntranceReveal,
	EntranceRoot,
	EntranceStaggerItem,
	EntranceStaggerRoot,
} from './entrance'

export const EntranceStagger = Object.assign(EntranceStaggerRoot, {
	Item: EntranceStaggerItem,
})

export const Entrance = Object.assign(EntranceRoot, {
	Fade: EntranceFade,
	Reveal: EntranceReveal,
	Stagger: EntranceStagger,
})

export {
	EntranceFade,
	EntranceReveal,
	EntranceStaggerItem,
	type EntranceEffect,
	type EntranceFadeProps,
	type EntranceProps,
	type EntranceRevealProps,
	type EntranceStaggerItemProps,
	type EntranceStaggerProps,
} from './entrance'
