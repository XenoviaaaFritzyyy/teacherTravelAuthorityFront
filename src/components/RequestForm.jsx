"use client"

import { useEffect, useState } from "react"
import "./RequestForm.css"

const RequestForm = () => {
  const [formData, setFormData] = useState({
    purpose: "",
    department: "", // Add department to initial state
    startDate: "",
    endDate: "",
  })

  const [minDate, setMinDate] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    setMinDate(`${year}-${month}-${day}`)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  const validateForm = () => {
    const tempErrors = {}

    if (!formData.purpose.trim()) {
      tempErrors.purpose = "Purpose is required"
    }

    if (!formData.department.trim()) {
      tempErrors.department = "Department is required"
    }

    if (!formData.startDate) {
      tempErrors.startDate = "Start date is required"
    }

    if (!formData.endDate) {
      tempErrors.endDate = "End date is required"
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      tempErrors.endDate = "End date cannot be before start date"
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const requestData = {
          purpose: formData.purpose.trim(),
          department: formData.department.trim(), // Add department to request data
          startDate: new Date(formData.startDate).toISOString().split('T')[0],
          endDate: new Date(formData.endDate).toISOString().split('T')[0],
        }

        const response = await fetch('http://localhost:3000/travel-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized access
            throw new Error('Please login again')
          }
          throw new Error('Failed to submit request')
        }

        const data = await response.json()
        setShowSuccess(true)
        setFormData({
          purpose: "",
          department: "", // Reset department field
          startDate: "",
          endDate: "",
        })
        
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      } catch (error) {
        console.error('Error:', error)
        setErrors({ 
          submit: error.message || 'Failed to submit request. Please try again.' 
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="request-form-container">
      <div className="request-form-card">
        <h2>REQUEST FORM</h2>

        {showSuccess && (
          <div className="success-message">
            Your travel request has been submitted successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="purpose">Purpose:</label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder=" Enter the detailed purpose of your travel"
              className={errors.purpose ? "error" : ""}
              disabled={isSubmitting}
              rows={3}
            />
            {errors.purpose && <span className="error-message">{errors.purpose}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="department">Department:</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Select at least two Department"
              className={errors.department ? "error" : ""}
              disabled={isSubmitting}
            />
            {errors.department && <span className="error-message">{errors.department}</span>}
          </div>

          <div className="date-container">
            <div className="form-group">
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={minDate}
                className={errors.startDate ? "error" : ""}
                disabled={isSubmitting}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || minDate}
                className={errors.endDate ? "error" : ""}
                disabled={isSubmitting}
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RequestForm