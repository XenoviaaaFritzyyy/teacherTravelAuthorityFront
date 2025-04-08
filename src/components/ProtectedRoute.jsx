import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useUser } from "../context/UserContext"

const ProtectedRoute = ({ children }) => {
  const { user, updateUser } = useUser()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          setIsLoading(false)
          setIsAuthenticated(false)
          setAuthCheckComplete(true)
          return
        }

        const response = await fetch('http://localhost:3000/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          await updateUser(userData)
          setIsAuthenticated(true)
        } else if (response.status === 401) {
          localStorage.removeItem('accessToken')
          setIsAuthenticated(false)
        } else {
          // For other errors, maintain current auth state
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        // Don't remove token on network errors
        setIsAuthenticated(!!localStorage.getItem('accessToken'))
      } finally {
        setIsLoading(false)
        setAuthCheckComplete(true)
      }
    }

    verifyAuth()
  }, [updateUser])

  // Show loading state only during initial auth check
  if (!authCheckComplete) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  // Redirect to login only if explicitly not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Show loading state while waiting for user data
  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading user data...</div>
      </div>
    )
  }

  // Define allowed routes for each role
  const roleRoutes = {
    'Admin': ['/superadmin'],
    'AO Admin': ['/admin', '/notifications'],
    'AO Admin Officer': ['/aoadminofficer', '/profile', '/notifications'],
    'Teacher': ['/dashboard', '/profile', '/notifications'],
    'Principal': ['/principal', '/profile', '/notifications'],
    'PSDS': ['/psds', '/profile', '/notifications'],
    'ASDS': ['/asds', '/profile', '/notifications']
  }

  // Get allowed routes for current user's role
  const allowedRoutes = roleRoutes[user?.role] || []

  // If current path is not in allowed routes, redirect to appropriate dashboard
  if (!allowedRoutes.includes(location.pathname)) {
    switch (user?.role) {
      case 'Admin':
        return <Navigate to="/superadmin" replace />
      case 'AO Admin':
        return <Navigate to="/admin" replace />
      case 'AO Admin Officer':
        return <Navigate to="/aoadminofficer" replace />
      case 'Principal':
        return <Navigate to="/principal" replace />
      case 'PSDS':
        return <Navigate to="/psds" replace />
      case 'ASDS':
        return <Navigate to="/asds" replace />
      default:
        // For teachers, maintain the existing profile completion check
        const isProfileComplete = user?.role === 'Teacher' ? (
          user.school_id &&
          user.school_name &&
          user.district &&
          user.position &&
          user.contact_no &&
          user.employee_number
        ) : true

        if (!isProfileComplete) {
          return (
            <Navigate
              to="/profile"
              state={{
                from: location,
                message: "Please complete your profile before accessing the dashboard.",
              }}
              replace
            />
          )
        }
        return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute