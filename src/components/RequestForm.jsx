"use client"

import { useState, useEffect } from "react"
import "./RequestForm.css"

const RequestForm = () => {
  const [formData, setFormData] = useState({
    purpose: "",
    date: "",
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
  }

  const validateForm = () => {
    const tempErrors = {}

    if (!formData.purpose.trim()) {
      tempErrors.purpose = "Purpose is required"
    }

    if (!formData.date) {
      tempErrors.date = "Date is required"
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
          date: "",
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
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Purpose"
              className={errors.purpose ? "error" : ""}
            />
            {errors.purpose && <span className="error-message">{errors.purpose}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">Travel Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={minDate}
              className={errors.date ? "error" : ""}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
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

