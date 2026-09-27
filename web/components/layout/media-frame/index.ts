import {
	MediaFrameCaption,
	MediaFrameContent,
	MediaFrameOverlay,
	MediaFrameRoot,
} from './media-frame'

export const MediaFrame = Object.assign(MediaFrameRoot, {
	Caption: MediaFrameCaption,
	Content: MediaFrameContent,
	Overlay: MediaFrameOverlay,
})

export {
	MediaFrameCaption,
	type MediaFrameCaptionProps,
	MediaFrameContent,
	type MediaFrameContentProps,
	MediaFrameOverlay,
	type MediaFrameOverlayProps,
	MediaFrameRoot,
	type MediaFrameRootProps,
} from './media-frame'
