import type { ReactNode } from 'react'

import { ThemeProvider } from '@/components/shell/theme-provider'
import { ToastProvider } from '@/components/ui/toast'

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
			<ToastProvider>{children}</ToastProvider>
		</ThemeProvider>
	)
}
