"use client"

import { createContext, useState, useContext, useEffect } from "react"

// Create context
const UserContext = createContext()

// Custom hook to use the context
export const useUser = () => useContext(UserContext)

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  // Check if user is logged in and if profile is complete
  useEffect(() => {
    // In a real app, you would fetch this from your backend or localStorage
    const checkUserStatus = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)

        // Check if profile is complete
        const isComplete = checkProfileCompletion(parsedUser)
        setIsProfileComplete(isComplete)

        // Check if this is first login
        setIsFirstLogin(parsedUser.firstLogin || false)
      }
    }

    checkUserStatus()
  }, [])

  // Function to check if all required profile fields are filled
  const checkProfileCompletion = (userData) => {
    if (!userData) return false

    const requiredPersonalFields = ["firstName", "lastName", "email", "username", "mobileNumber"]
    const requiredProfessionalFields = ["employeeNumber", "schoolId", "schoolName", "district", "position"]

    // Check if all required personal fields are filled
    const personalComplete = requiredPersonalFields.every((field) => userData[field] && userData[field].trim() !== "")

    // Check if all required professional fields are filled
    const professionalComplete = requiredProfessionalFields.every(
      (field) => userData[field] && userData[field].trim() !== "",
    )

    return personalComplete && professionalComplete
  }

  // Function to update user data
  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))

    // Check if profile is now complete
    const isComplete = checkProfileCompletion(userData)
    setIsProfileComplete(isComplete)

    // If this was first login, update that status
    if (isFirstLogin && isComplete) {
      const updatedUser = { ...userData, firstLogin: false }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setIsFirstLogin(false)
    }
  }

  // Function to handle login
  const login = (userData) => {
    // In a real app, you would validate credentials with your backend
    // For demo purposes, we'll just set the user and check if it's their first login
    const isComplete = checkProfileCompletion(userData)

    // If this is a new user or profile is incomplete, mark as first login
    const firstLogin = !isComplete

    const user = {
      ...userData,
      firstLogin,
    }

    setUser(user)
    setIsProfileComplete(isComplete)
    setIsFirstLogin(firstLogin)

    localStorage.setItem("user", JSON.stringify(user))

    return { isComplete, firstLogin }
  }

  // Function to handle logout
  const logout = () => {
    setUser(null)
    setIsProfileComplete(false)
    setIsFirstLogin(false)
    localStorage.removeItem("user")
  }

  const value = {
    user,
    isProfileComplete,
    isFirstLogin,
    login,
    logout,
    updateUser,
    checkProfileCompletion,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

