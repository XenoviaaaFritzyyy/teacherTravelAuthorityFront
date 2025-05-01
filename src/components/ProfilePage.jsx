"use client"

import { useState, useEffect, useCallback } from "react"  // Added useCallback
import { useNavigate, useLocation } from "react-router-dom"
import { useUser } from "../context/UserContext"
import Navbar from "./Navbar"
import AdminNote from "./AdminNote"
import "./ProfilePage.css"
import apiConfig from '../config/api'

const districtOptions = [
  "Division",
  "Alcantara",
  "Alcoy",
  "Alegria",
  "Aloguinsan",
  "Argao I",
  "Argao II",
  "Asturias I",
  "Asturias II",
  "Badian",
  "Balamban I",
  "Balamban II",
  "Bantayan I",
  "Bantayan II",
  "Barili I",
  "Barili II",
  "Boljoon",
  "Borbon",
  "Carmen",
  "Catmon",
  "Compostela",
  "Consolacion I",
  "Consolacion II",
  "Cordova",
  "Dalaguete I",
  "Dalaguete II",
  "Daanbantayan I",
  "Daanbantayan II",
  "Dumanjug I",
  "Dumanjug II",
  "Ginatilan",
  "Liloan",
  "Madridejos",
  "Malabuyoc",
  "Medellin",
  "Minglanilla I",
  "Minglanilla II",
  "Moalboal",
  "Oslob",
  "Pilar",
  "Pinamungajan I",
  "Pinamungajan II",
  "Poro",
  "Ronda",
  "Samboan",
  "San Fernando I",
  "San Fernando II",
  "San Francisco",
  "San Remigio I",
  "San Remigio II",
  "Santa Fe",
  "Santander",
  "Sibonga",
  "Sogod",
  "Tabogon",
  "Tabuelan",
  "Tuburan I",
  "Tuburan II",
  "Tudela"
];

const ProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, updateUser, isProfileComplete } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(!isProfileComplete)
  const [message, setMessage] = useState("")
  const [redirecting, setRedirecting] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)  // Added this state

  const [personalInfo, setPersonalInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_no: "",
  })

  const [professionalInfo, setProfessionalInfo] = useState({
    employee_number: "",
    school_id: "",
    school_name: "",
    district: "",
    position: "",
  })

  const [errors, setErrors] = useState({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Check for message in location state
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
    }
  }, [location])

  // Load user data on component mount only once
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }

        const response = await fetch(apiConfig.endpoints.users.me, {
          headers: {
            'Authorization': `Bearer ${token}`,  // Fixed template literal
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setPersonalInfo({
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            email: userData.email || "",

            contact_no: userData.contact_no || "",
          })
          setProfessionalInfo({
            employee_number: userData.employee_number || "",
            school_id: userData.school_id || "",
            school_name: userData.school_name || "",
            district: userData.district || "",
            position: userData.position || "",
          })
          updateUser(userData)
          setInitialDataLoaded(true)  // Mark initial data as loaded
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (error) {
        setMessage("Error loading user data. Please try again.")
        console.error('Error:', error)
      }
    }

    if (!initialDataLoaded) {  // Only fetch if initial data hasn't been loaded
      fetchUserData()
    }
  }, [navigate, updateUser, initialDataLoaded])  // Added initialDataLoaded to dependencies

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfessionalInfoChange = (e) => {
    // Only allow changes to professional info if profile is not complete yet
    if (!isProfileComplete) {
      const { name, value } = e.target
      setProfessionalInfo((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const validateForm = () => {
    const tempErrors = {}

    // Validate personal info
    if (!personalInfo.first_name) tempErrors.first_name = "First name is required"
    if (!personalInfo.last_name) tempErrors.last_name = "Last name is required"
    if (!personalInfo.email) tempErrors.email = "Email is required"

    if (!personalInfo.contact_no) tempErrors.contact_no = "Mobile number is required"

    // Only validate professional info if profile is not complete yet
    if (!isProfileComplete) {
      if (!professionalInfo.employee_number) tempErrors.employee_number = "Employee number is required"
      if (!professionalInfo.school_id) tempErrors.school_id = "School ID is required"
      if (!professionalInfo.school_name) tempErrors.school_name = "School name is required"
      if (!professionalInfo.district) tempErrors.district = "District is required"
      if (!professionalInfo.position) tempErrors.position = "Position is required"
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleConfirm = async () => {
    if (validateForm()) {
        // For new accounts, show a confirmation dialog to double check details
        if (!isProfileComplete) {
            setShowConfirmDialog(true)
            return
        }
        
        // If already confirmed or profile is complete, proceed with update
        await updateProfile()
    }
  }

  const confirmProfileUpdate = () => {
    setShowConfirmDialog(false)
    updateProfile()
  }

  const cancelProfileUpdate = () => {
    setShowConfirmDialog(false)
  }

  const updateProfile = async () => {
    setIsLoading(true)
    try {
            const token = localStorage.getItem('accessToken')
            
            // If profile is complete, only update personal info
            // If profile is not complete yet, update both personal and professional info
            const updatedUserData = isProfileComplete ? {
                ...personalInfo
            } : {
                ...personalInfo,
                ...professionalInfo,
            }

            const response = await fetch(`${apiConfig.endpoints.users.base}/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedUserData)
            })

            if (response.ok) {
                const updatedUser = await response.json()
                updateUser(updatedUser)
                setIsEditing(false)
                setMessage("Profile updated successfully! Redirecting to dashboard...")
                setRedirecting(true)
                sessionStorage.setItem("profileJustCompleted", "true")
                
                // Force a small delay before redirect
                await new Promise(resolve => setTimeout(resolve, 1500))
                navigate("/dashboard", { replace: true }) // Use replace to prevent going back to profile
            } else {
                const errorData = await response.json()
                setMessage(errorData.message || "Failed to update profile")
            }
        } catch (error) {
            setMessage("Error updating profile. Please try again.")
            console.error('Error:', error)
        } finally {
            setIsLoading(false)
        }
    }

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <div className="confirmation-header">
                <h3>Confirm Your Details</h3>
              </div>
              <div className="confirmation-content">
                <p className="confirmation-warning">
                  Please verify that all information is correct. Professional information CANNOT BE changed after confirmation.
                </p>
                
                <div className="confirmation-section">
                  <h4>Personal Information</h4>
                  <div className="confirmation-details">
                    <p><strong>Name:</strong> {personalInfo.first_name} {personalInfo.last_name}</p>
                    <p><strong>Email:</strong> {personalInfo.email}</p>
                    <p><strong>Contact:</strong> {personalInfo.contact_no}</p>
                  </div>
                </div>
                
                <div className="confirmation-section">
                  <h4>Professional Information</h4>
                  <div className="confirmation-details">
                    <p><strong>Employee Number:</strong> {professionalInfo.employee_number}</p>
                    <p><strong>School ID:</strong> {professionalInfo.school_id}</p>
                    <p><strong>School Name:</strong> {professionalInfo.school_name}</p>
                    <p><strong>District:</strong> {professionalInfo.district}</p>
                    <p><strong>Position:</strong> {professionalInfo.position}</p>
                  </div>
                </div>
              </div>
              <div className="confirmation-actions">
                <button className="cancel-button" onClick={cancelProfileUpdate}>Cancel</button>
                <button className="confirm-button" onClick={confirmProfileUpdate}>Confirm</button>
              </div>
            </div>
          </div>
        )}
        {message && (
          <div className={`message ${message.includes("successfully") ? "success" : "warning"}`}>
            {message}
          </div>
        )}

        <div className="profile-section">
          <h2>PERSONNEL INFORMATION</h2>

          {/* Personal Information */}
          <div className="info-card">
            <div className="form-group">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={personalInfo.first_name}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.first_name ? "error" : ""}
              />
              {errors.first_name && <span className="error-message">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={personalInfo.last_name}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.last_name ? "error" : ""}
              />
              {errors.last_name && <span className="error-message">{errors.last_name}</span>}
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={personalInfo.email}
                onChange={handlePersonalInfoChange}
                disabled={true} /* Email is always uneditable */
                className={`uneditable ${errors.email ? "error" : ""}`}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="form-group">
              <input
                type="tel"
                name="contact_no"
                placeholder="Mobile Number"
                value={personalInfo.contact_no}
                onChange={handlePersonalInfoChange}
                disabled={!isEditing || redirecting}
                className={errors.contact_no ? "error" : ""}
              />
              {errors.contact_no && <span className="error-message">{errors.contact_no}</span>}
            </div>
          </div>

          {/* Professional Information */}
          <div className="info-card">
            <AdminNote message="Note: To update professional information, please contact the administrator." />
            <div className="form-group">
              <input
                type="text"
                name="employee_number"
                placeholder="Employee Number"
                value={professionalInfo.employee_number}
                onChange={handleProfessionalInfoChange}
                disabled={isProfileComplete || !isEditing || redirecting}
                className={`${isProfileComplete ? "uneditable" : ""} ${errors.employee_number ? "error" : ""}`}
              />
              {errors.employee_number && <span className="error-message">{errors.employee_number}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="school_id"
                placeholder="School ID"
                value={professionalInfo.school_id}
                onChange={handleProfessionalInfoChange}
                disabled={isProfileComplete || !isEditing || redirecting}
                className={`${isProfileComplete ? "uneditable" : ""} ${errors.school_id ? "error" : ""}`}
              />
              {errors.school_id && <span className="error-message">{errors.school_id}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="school_name"
                placeholder="School Name"
                value={professionalInfo.school_name}
                onChange={handleProfessionalInfoChange}
                disabled={isProfileComplete || !isEditing || redirecting}
                className={`${isProfileComplete ? "uneditable" : ""} ${errors.school_name ? "error" : ""}`}
              />
              {errors.school_name && <span className="error-message">{errors.school_name}</span>}
            </div>
            <div className="form-group">
              <select
                name="district"
                value={professionalInfo.district}
                onChange={handleProfessionalInfoChange}
                disabled={isProfileComplete || !isEditing || redirecting}
                className={`${isProfileComplete ? "uneditable" : ""} ${errors.district ? "error" : ""}`}
              >
                <option value="">Select District</option>
                {districtOptions.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && <span className="error-message">{errors.district}</span>}
            </div>
            <div className="form-group">
              <input
                type="text"
                name="position"
                placeholder="Plantilla Position"
                value={professionalInfo.position}
                onChange={handleProfessionalInfoChange}
                disabled={isProfileComplete || !isEditing || redirecting}
                className={`${isProfileComplete ? "uneditable" : ""} ${errors.position ? "error" : ""}`}
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
              <button 
                className="confirm-button" 
                onClick={handleConfirm} 
                disabled={redirecting || isLoading}
              >
                {isLoading ? "Saving..." : "Confirm Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage;