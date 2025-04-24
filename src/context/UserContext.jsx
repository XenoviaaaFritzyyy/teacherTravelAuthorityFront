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
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in and fetch profile data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('http://localhost:3000/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setIsProfileComplete(checkProfileCompletion(userData))
        } else {
          // Clear everything on any error
          localStorage.removeItem('accessToken')
          setUser(null)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        localStorage.removeItem('accessToken')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Function to check if all required profile fields are filled
  const checkProfileCompletion = (userData) => {
    if (!userData) return false;
    // Update to include new roles that don't need complete profiles
    if (userData.role !== 'Teacher' && 
        userData.role !== 'Principal') return true;

    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "contact_no",
      "employee_number",
      "school_id",
      "school_name",
      "district",
      "position"
    ];

    return requiredFields.every(field => userData[field] && userData[field].trim() !== "");
  }

  // Function to update user data
  const updateUser = async (userData) => {
    const token = localStorage.getItem('accessToken')
    if (!token || !user?.id) return false

    try {
      const response = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        setIsProfileComplete(checkProfileCompletion(updatedUser))
        return true
      }

      // If update fails, try to fetch current user data
      if (response.status === 500) {
        const userResponse = await fetch('http://localhost:3000/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (userResponse.ok) {
          const currentUser = await userResponse.json()
          setUser(currentUser)
          setIsProfileComplete(checkProfileCompletion(currentUser))
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to update user:', error)
      return false
    }
  }

  // Function to handle login
  const login = (userData) => {
    setUser(userData)
    const isComplete = checkProfileCompletion(userData)
    setIsProfileComplete(isComplete)
    return { success: true, isComplete }
  }

  // Function to handle logout
  const logout = () => {
    setUser(null)
    setIsProfileComplete(false)
    localStorage.removeItem('accessToken')
  }

  const value = {
    user,
    isProfileComplete,
    login,
    logout,
    updateUser,
    checkProfileCompletion,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}