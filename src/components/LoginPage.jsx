"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import ChangePasswordModal from "./ChangePasswordModal"
import "./LoginPage.css"

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useUser()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [tempUserData, setTempUserData] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = () => {
    const tempErrors = {}

    if (!formData.email) {
      tempErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      tempErrors.password = "Password is required"
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handlePasswordChange = async (newPassword) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('http://localhost:3000/users/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'password123',
          newPassword: newPassword,
        }),
      })

      if (response.ok) {
        setShowPasswordModal(false)
        login(tempUserData)
        handleRoleBasedRedirect(tempUserData)
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.message || 'Failed to change password' })
      }
    } catch (error) {
      console.error('Password change error:', error)
      setErrors({ submit: 'Failed to change password' })
    }
  }

  const handleRoleBasedRedirect = (userData) => {
    switch (userData.role) {
      case 'Admin':
        navigate('/superadmin')
        break
      case 'AO Admin':
        navigate('/admin')
        break
      default:
        const isProfileComplete = userData.school_id && 
                                userData.school_name && 
                                userData.district && 
                                userData.position
        if (!isProfileComplete) {
          navigate("/profile", {
            state: { message: "Please complete your profile information." },
          })
        } else {
          navigate("/dashboard")
        }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      setIsLoading(true)
      try {
        const response = await fetch('http://localhost:3000/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          })
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('accessToken', data.accessToken)
          
          try {
            const userResponse = await fetch('http://localhost:3000/users/me', {
              headers: {
                'Authorization': `Bearer ${data.accessToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              
              if (userData.requirePasswordChange) {
                setTempUserData(userData)
                setShowPasswordModal(true)
                return
              }

              login(userData)
              handleRoleBasedRedirect(userData)
              
            } else {
              const errorData = await userResponse.json()
              setErrors({ submit: errorData.message || 'Failed to fetch user data' })
            }
          } catch (userError) {
            console.error('User fetch error:', userError)
            setErrors({ submit: 'Failed to fetch user profile' })
          }
        } else if (response.status === 404) {
          setErrors({ submit: <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'red' }}>Create an account first.</span> })
        } else if (response.status === 401) {
          setErrors({ submit: <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'red' }}>Incorrect email or password.</span> })
        } else {
          const errorData = await response.json()
          setErrors({ submit: errorData.message || 'Invalid email or password' })
        }
      } catch (error) {
        console.error('Login error:', error)
        setErrors({ submit: 'Network error occurred' })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-section">
          <img
            src="/depedlogo.png?height=200&width=200"
            alt="Department of Education Division of Cebu Province"
            className="doe-logo"
          />
        </div>

        <div className="login-form-section">
          <h1 className="login-title">LOGIN</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          <div className="create-account-link">
            Don't have account yet? <Link to="/signup">Create account</Link>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          onSubmit={handlePasswordChange}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  )
}

export default LoginPage
