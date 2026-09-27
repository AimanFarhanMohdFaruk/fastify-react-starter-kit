import type { ComponentPropsWithRef, ReactElement } from 'react'

import { cn } from '@/lib/utils'

export interface VimeoPlayerOptions {
	autopause?: boolean
	autoplay?: boolean
	background?: boolean
	byline?: boolean
	color?: string
	controls?: boolean
	dnt?: boolean
	keyboard?: boolean
	loop?: boolean
	muted?: boolean
	pip?: boolean
	playsinline?: boolean
	portrait?: boolean
	quality?: '240p' | '360p' | '540p' | '720p' | '1080p' | '2k' | '4k' | 'auto'
	/** Shows the video title inside the player chrome. Distinct from the required `title` prop. */
	showTitle?: boolean
	speed?: boolean
	texttrack?: string
}

/** Player options whose public name differs from the Vimeo query parameter. */
const playerOptionParams: Partial<Record<keyof VimeoPlayerOptions, string>> = {
	showTitle: 'title',
}

export interface VimeoSourceProps {
	privacyHash?: string
	videoId: string
}

export interface VimeoEmbedProps
	extends VimeoSourceProps, Omit<ComponentPropsWithRef<'iframe'>, 'src' | 'srcDoc' | 'title'> {
	playerOptions?: VimeoPlayerOptions
	title: string
}

function buildVimeoUrl({
	playerOptions,
	privacyHash,
	videoId,
}: VimeoSourceProps & Pick<VimeoEmbedProps, 'playerOptions'>): string {
	const url = new URL(`https://player.vimeo.com/video/${encodeURIComponent(videoId)}`)

	if (privacyHash) url.searchParams.set('h', privacyHash)

	for (const [option, value] of Object.entries(playerOptions ?? {})) {
		if (value !== undefined) {
			const param = playerOptionParams[option as keyof VimeoPlayerOptions] ?? option
			url.searchParams.set(param, typeof value === 'boolean' ? (value ? '1' : '0') : value)
		}
	}

	return url.toString()
}

export function VimeoEmbed({
	allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share',
	allowFullScreen = true,
	className,
	loading = 'lazy',
	playerOptions,
	privacyHash,
	referrerPolicy = 'strict-origin-when-cross-origin',
	// `allow-popups-to-escape-sandbox` keeps the player's "Watch on Vimeo" link usable,
	// and `allow-forms` keeps its settings controls working. Top-level navigation,
	// downloads, and modals stay blocked.
	sandbox = 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-forms',
	title,
	videoId,
	...props
}: VimeoEmbedProps): ReactElement {
	return (
		<iframe
			{...props}
			allow={allow}
			allowFullScreen={allowFullScreen}
			className={cn('aspect-video w-full border-0', className)}
			data-slot="vimeo-embed"
			loading={loading}
			referrerPolicy={referrerPolicy}
			sandbox={sandbox}
			src={buildVimeoUrl({ playerOptions, privacyHash, videoId })}
			title={title}
		/>
	)
}
