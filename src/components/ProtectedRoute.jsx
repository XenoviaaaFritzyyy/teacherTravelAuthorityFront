import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useUser } from "../context/UserContext"

const ProtectedRoute = ({ children }) => {
  const { user, updateUser } = useUser()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch current user data
        const response = await fetch('http://localhost:3000/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          updateUser(userData)
          setIsAuthenticated(true)
        } else {
          // If token is invalid, clear it
          localStorage.removeItem('accessToken')
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        localStorage.removeItem('accessToken')
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [updateUser])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!localStorage.getItem('accessToken') || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!user) {
    return <div>Loading user data...</div>
  }

  // Define allowed routes for each role
  const roleRoutes = {
    'Admin': ['/superadmin'],
    'AO Admin': ['/admin'],
    'Teacher': ['/dashboard', '/profile', '/notifications']
  }

  // Get allowed routes for current user's role
  const allowedRoutes = roleRoutes[user.role] || []

  // If current path is not in allowed routes, redirect to appropriate dashboard
  if (!allowedRoutes.includes(location.pathname)) {
    switch (user.role) {
      case 'Admin':
        return <Navigate to="/superadmin" replace />
      case 'AO Admin':
        return <Navigate to="/admin" replace />
      default:
        // For teachers, maintain the existing profile completion check
        const isProfileComplete = user.role === 'Teacher' ? (
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