import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'

type ProtectedRouteProps = {
  allowGuests?: boolean
}

export const ProtectedRoute = ({ allowGuests = false }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.accessToken)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!allowGuests && !user) {
    return null
  }

  return <Outlet />
}

