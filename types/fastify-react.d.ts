declare module '@fastify/react/client' {
  import type { Context, LazyExoticComponent, ComponentType } from 'react'

  export const RouteContext: Context<RouteContextValue>
  export const isServer: boolean

  export interface RouteContextValue {
    data?: unknown
    head?: unknown
    state?: unknown
    snapshot?: unknown
    actionData?: Record<string, unknown>
    req?: unknown
    reply?: unknown
    server?: unknown
    [key: string]: unknown
  }

  export function useRouteContext(): RouteContextValue

  export function hydrateRoutes(
    fromInput:
      | Record<string, () => Promise<unknown>>
      | Array<{ path: string; id?: string; [key: string]: unknown }>,
  ): Promise<
    Array<{
      path: string
      id: string
      loader: () => Promise<unknown>
      component: LazyExoticComponent<ComponentType<unknown>>
      [key: string]: unknown
    }>
  >
}

declare module '@fastify/react/server' {
  export function createRoutes(
    from: Promise<Record<string, () => Promise<unknown>>> | Record<string, () => Promise<unknown>>,
  ): unknown

  export function prepareServer(server: unknown): void
}

declare module '@fastify/react/plugin' {
  import type { Plugin } from 'vite'
  const fastifyReact: () => Plugin
  export default fastifyReact
}
