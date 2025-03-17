"use client"

import { useEffect, useState } from "react"
import "./RequestForm.css"

const RequestForm = () => {
  const [formData, setFormData] = useState({
    purpose: "",
    startDate: "",
    endDate: "",
    leeway: "1", // Default to 1 day
  })

  const [minDate, setMinDate] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  // Set minimum date to today when component mounts
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

    // Clear any existing errors for this field
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

    if (!formData.startDate) {
      tempErrors.startDate = "Start date is required"
    }

    if (!formData.endDate) {
      tempErrors.endDate = "End date is required"
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      tempErrors.endDate = "End date cannot be before start date"
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      console.log("Form submitted:", formData)
      // Here you would typically send the data to your backend

      // Show success message
      setShowSuccess(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setFormData({
          purpose: "",
          startDate: "",
          endDate: "",
          leeway: formData.leeway, // Keep the leeway selection
        })
      }, 3000)
    }
  }

  return (
    <div className="request-form-container">
      <div className="request-form-card">
        <h2>REQUEST FORM</h2>

        {showSuccess && <div className="success-message">Your request has been submitted successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="purpose">Purpose:</label>
            <input
              type="text"
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Enter the purpose of your travel"
              className={errors.purpose ? "error" : ""}
            />
            {errors.purpose && <span className="error-message">{errors.purpose}</span>}
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
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="leeway">Leeway Days:</label>
            <select id="leeway" name="leeway" value={formData.leeway} onChange={handleChange}>
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="5">5 Days</option>
            </select>
          </div>

          <button type="submit" className="submit-button">
            SUBMIT
          </button>
        </form>
      </div>
    </div>
  )
}

export default RequestForm

