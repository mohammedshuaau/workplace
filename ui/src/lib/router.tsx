import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import { ProtectedHome, GuestLogin, GuestRegister } from '../components/guards/auth-wrappers'

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ProtectedHome,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: GuestLogin,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/register',
  component: GuestRegister,
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, registerRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 