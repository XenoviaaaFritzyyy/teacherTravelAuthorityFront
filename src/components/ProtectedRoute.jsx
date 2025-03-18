import { Navigate, useLocation } from "react-router-dom"
import { useUser } from "../context/UserContext"
import { useEffect, useState } from "react"

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
    return <div>Loading...</div> // Or your loading component
  }

  // If no token or invalid token, redirect to login
  if (!localStorage.getItem('accessToken') || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user data is not loaded yet, show loading
  if (!user) {
    return <div>Loading user data...</div>
  }

  // Check if profile is complete for teacher role
  const isProfileComplete = user.role === 'Teacher' ? (
    user.school_id &&
    user.school_name &&
    user.district &&
    user.position &&
    user.contact_no &&
    user.employee_number
  ) : true // For non-teachers, consider profile always complete

  // If this is dashboard and profile is not complete for teachers, redirect to profile
  if (
    location.pathname === "/dashboard" && 
    user.role === 'Teacher' && 
    !isProfileComplete
  ) {
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

  // For the profile page, check if it's being accessed after login
  if (location.pathname === "/profile") {
    // Allow access to profile page
    return children
  }

  // For admin routes, check role
  if (location.pathname === "/admin" && user.role !== 'AO_ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  // For superadmin routes, check role
  if (location.pathname === "/superadmin" && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute