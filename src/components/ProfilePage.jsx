"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useUser } from "../context/UserContext"
import Navbar from "./Navbar"
import "./ProfilePage.css"

const ProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, updateUser, isProfileComplete, isFirstLogin } = useUser()

  const [isEditing, setIsEditing] = useState(isFirstLogin || !isProfileComplete)
  const [message, setMessage] = useState("")
  const [redirecting, setRedirecting] = useState(false)

  const [personalInfo, setPersonalInfo] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    username: user?.username || "",
    mobileNumber: user?.mobileNumber || "",
  })

  const [professionalInfo, setProfessionalInfo] = useState({
    employeeNumber: user?.employeeNumber || "",
    schoolId: user?.schoolId || "",
    schoolName: user?.schoolName || "",
    district: user?.district || "",
    position: user?.position || "",
  })

  const [errors, setErrors] = useState({})

  // Check for message in location state
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
    }
  }, [location])

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfessionalInfoChange = (e) => {
    const { name, value } = e.target
    setProfessionalInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const tempErrors = {}

    // Validate personal info
    if (!personalInfo.firstName) tempErrors.firstName = "First name is required"
    if (!personalInfo.lastName) tempErrors.lastName = "Last name is required"
    if (!personalInfo.email) tempErrors.email = "Email is required"
    if (!personalInfo.username) tempErrors.username = "Username is required"
    if (!personalInfo.mobileNumber) tempErrors.mobileNumber = "Mobile number is required"

    // Validate professional info
    if (!professionalInfo.employeeNumber) tempErrors.employeeNumber = "Employee number is required"
    if (!professionalInfo.schoolId) tempErrors.schoolId = "School ID is required"
    if (!professionalInfo.schoolName) tempErrors.schoolName = "School name is required"
    if (!professionalInfo.district) tempErrors.district = "District is required"
    if (!professionalInfo.position) tempErrors.position = "Position is required"

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleConfirm = () => {
    if (validateForm()) {
      // Combine all user data
      const updatedUserData = {
        ...user,
        ...personalInfo,
        ...professionalInfo,
      }

      // Update user data in context
      updateUser(updatedUserData)

      setIsEditing(false)
      setMessage("Profile updated successfully! Redirecting to dashboard...")
      setRedirecting(true)

      // Set a flag in sessionStorage to show welcome message on dashboard
      sessionStorage.setItem("profileJustCompleted", "true")

      // Redirect to dashboard after a short delay to show the success message
      setTimeout(() => {
        navigate("/dashboard")
      }, 1500)
    }
  }

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        {message && (
          <div className={`message ${message.includes("successfully") ? "success" : "warning"}`}>{message}</div>
        )}

        <div className="profile-section">
          <h2>TEACHER INFORMATION</h2>

          {/* Personal Information */}
          <div className="info-card">
            <div className="form-group">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={personalInfo.firstName}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.firstName ? "error" : ""}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={personalInfo.lastName}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.lastName ? "error" : ""}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={personalInfo.email}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={personalInfo.username}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.username ? "error" : ""}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>
            <div className="form-group">
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Mobile Number"
                value={personalInfo.mobileNumber}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.mobileNumber ? "error" : ""}
              />
              {errors.mobileNumber && <span className="error-message">{errors.mobileNumber}</span>}
            </div>
          </div>

          {/* Professional Information */}
          <div className="info-card">
            <div className="form-group">
              <input
                type="text"
                name="employeeNumber"
                placeholder="Employee Number"
                value={professionalInfo.employeeNumber}
                onChange={handleProfessionalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.employeeNumber ? "error" : ""}
              />
              {errors.employeeNumber && <span className="error-message">{errors.employeeNumber}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="schoolId"
                placeholder="School ID"
                value={professionalInfo.schoolId}
                onChange={handleProfessionalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.schoolId ? "error" : ""}
              />
              {errors.schoolId && <span className="error-message">{errors.schoolId}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="schoolName"
                placeholder="School Name"
                value={professionalInfo.schoolName}
                onChange={handleProfessionalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.schoolName ? "error" : ""}
              />
              {errors.schoolName && <span className="error-message">{errors.schoolName}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="district"
                placeholder="District"
                value={professionalInfo.district}
                onChange={handleProfessionalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.district ? "error" : ""}
              />
              {errors.district && <span className="error-message">{errors.district}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="position"
                placeholder="Position"
                value={professionalInfo.position}
                onChange={handleProfessionalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.position ? "error" : ""}
              />
              {errors.position && <span className="error-message">{errors.position}</span>}
            </div>
          </div>

          <div className="button-group">
            {!isEditing ? (
              <button className="edit-button" onClick={handleEdit} disabled={redirecting}>
                Edit
              </button>
            ) : (
              <button className="confirm-button" onClick={handleConfirm} disabled={redirecting}>
                Confirm Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

