import type { SVGProps } from 'react'

/** Midday-adjacent sunburst mark for the starter wordmark. */
export const StarterMark = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
		{...props}
	>
		<path d="M12 2.5 13.1 8.4 18.5 5.5 15.6 10.9 21.5 12 15.6 13.1 18.5 18.5 13.1 15.6 12 21.5 10.9 15.6 5.5 18.5 8.4 13.1 2.5 12 8.4 10.9 5.5 5.5 10.9 8.4 12 2.5Z" />
	</svg>
)

export const AcmeLogoIcon = StarterMark
