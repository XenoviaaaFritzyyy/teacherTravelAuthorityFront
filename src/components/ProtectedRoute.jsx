import { Navigate, useLocation } from "react-router-dom"
import { useUser } from "../context/UserContext"

const ProtectedRoute = ({ children }) => {
  const { user, isProfileComplete, isFirstLogin } = useUser()
  const location = useLocation()

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If this is dashboard and profile is not complete, redirect to profile
  if (location.pathname === "/dashboard" && (!isProfileComplete || isFirstLogin)) {
    return (
      <Navigate
        to="/profile"
        state={{
          from: location,
          message: "Please complete your profile before accessing the request form.",
        }}
        replace
      />
    )
  }

  // Otherwise, render the children
  return children
}

export default ProtectedRoute

