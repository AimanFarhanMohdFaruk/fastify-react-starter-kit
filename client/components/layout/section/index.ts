import {
	SectionContent,
	SectionDescription,
	SectionEyebrow,
	SectionHeader,
	SectionIcon,
	SectionMedia,
	SectionRoot,
	SectionTitle,
} from './section'

export const Section = Object.assign(SectionRoot, {
	Content: SectionContent,
	Description: SectionDescription,
	Eyebrow: SectionEyebrow,
	Header: SectionHeader,
	Icon: SectionIcon,
	Media: SectionMedia,
	Title: SectionTitle,
})

export {
	SectionContent,
	type SectionContentProps,
	SectionDescription,
	type SectionDescriptionProps,
	SectionEyebrow,
	type SectionEyebrowProps,
	SectionHeader,
	type SectionHeaderProps,
	SectionIcon,
	type SectionIconProps,
	SectionMedia,
	type SectionMediaProps,
	SectionRoot,
	type SectionRootProps,
	SectionTitle,
	type SectionTitleProps,
} from './section'
export { sectionVariants } from './section.styles'
