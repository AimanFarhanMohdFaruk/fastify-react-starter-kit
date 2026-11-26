'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { useTheme } from 'next-themes'

const modes = [
	{ icon: Sun, name: 'light' },
	{ icon: Monitor, name: 'system' },
	{ icon: Moon, name: 'dark' },
] as const

/** Client-only flag without setState-in-effect (SSR-safe for next-themes). */
function useIsClient() {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	)
}

export function ThemeSelector() {
	const { setTheme, theme } = useTheme()
	const isMounted = useIsClient()

	return (
		<ToggleGroup
			aria-label="Theme"
			disabled={!isMounted}
			onValueChange={(value) => {
				const nextTheme = value[0]
				if (nextTheme) setTheme(nextTheme)
			}}
			size="sm"
			value={isMounted && theme ? [theme] : []}
			variant="outline"
		>
			{modes.map(({ name, icon: Icon }) => (
				<ToggleGroupItem aria-label={`Use ${name} theme`} key={name} value={name}>
					<Icon aria-hidden="true" />
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	)
}
