"use client"

import { useEffect, useState } from "react"
import Select from "react-select"         // <-- Import from react-select
import "./RequestForm.css"

const RequestForm = () => {
  // Department stored as an array of selected values (strings).
  const [formData, setFormData] = useState({
    purpose: "",
    department: [], 
    startDate: "",
    endDate: "",
  })

  const [minDate, setMinDate] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Department options for react-select: label, value
  const departmentOptions = [
    { label: "Accounting", value: "Accounting" },
    { label: "Administrative", value: "Administrative" },
    { label: "Administrator", value: "Administrator" },
    { label: "Assessment and Evaluation", value: "Assessment and Evaluation" },
    { label: "Assistant Schools Division Superintendent (Cluster A)", value: "Assistant Schools Division Superintendent (Cluster A)" },
    { label: "Assistant Schools Division Superintendent (Cluster B)", value: "Assistant Schools Division Superintendent (Cluster B)" },
    { label: "Assistant Schools Division Superintendent (Cluster C)", value: "Assistant Schools Division Superintendent (Cluster C)" },
    { label: "Authorized Center", value: "Authorized Center" },
    { label: "Authorized Officer", value: "Authorized Officer" },
    { label: "Authorized Official", value: "Authorized Official" },
    { label: "Budget", value: "Budget" },
    { label: "Cashier", value: "Cashier" },
    { label: "CID", value: "CID" },
    { label: "Client", value: "Client" },
    { label: "Curriculum Management", value: "Curriculum Management" },
    { label: "Dental", value: "Dental" },
    { label: "Disbursing", value: "Disbursing" },
    { label: "Educational Support Staff and Development", value: "Educational Support Staff and Development" },
    { label: "Educational Facilities", value: "Educational Facilities" },
    { label: "General Services", value: "General Services" },
    { label: "HRTD", value: "HRTD" },
    { label: "Human Resource Management", value: "Human Resource Management" },
    { label: "ICT", value: "ICT" },
    { label: "Instructional Supervision", value: "Instructional Supervision" },
    { label: "Learning and Development", value: "Learning and Development" },
    { label: "Legal", value: "Legal" },
    { label: "LRMDS", value: "LRMDS" },
    { label: "M and E", value: "M and E" },
    { label: "Medical", value: "Medical" },
    { label: "Office of the Schools Division Superintendent", value: "Office of the Schools Division Superintendent" },
    { label: "Physical Facilities", value: "Physical Facilities" },
    { label: "Planning", value: "Planning" },
    { label: "Records", value: "Records" },
    { label: "Remittance", value: "Remittance" },
    { label: "School Governance", value: "School Governance" },
    { label: "SGOD", value: "SGOD" },
    { label: "Soc. Mob", value: "Soc. Mob" },
    { label: "Super User", value: "Super User" },
    { label: "Supply", value: "Supply" },
    { label: "Unassigned User", value: "Unassigned User" },
  ]

  // On initial mount, calculate today's date for the minDate
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    setMinDate(`${year}-${month}-${day}`)
  }, [])

  // Handle text/textarea/date changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Handle department changes from react-select
  const handleDepartmentChange = (selectedOptions) => {
    // selectedOptions is an array of objects like: [{ value: 'Accounting', label: 'Accounting' }, ...]
    // We only store the array of values (strings) in state.
    const departmentsArray = selectedOptions ? selectedOptions.map((opt) => opt.value) : []
    setFormData((prev) => ({ ...prev, department: departmentsArray }))

    if (errors.department) {
      setErrors((prev) => ({ ...prev, department: null }))
    }
  }

  // Validate the form
  const validateForm = () => {
    const tempErrors = {}

    if (!formData.purpose.trim()) {
      tempErrors.purpose = "Purpose is required"
    }

    // Must select at least 2 departments
    if (!formData.department || formData.department.length < 2) {
      tempErrors.department = "Please select at least two departments"
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
        const token = localStorage.getItem("accessToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const requestData = {
          purpose: formData.purpose.trim(),
          // The array of department strings
          department: formData.department, 
          startDate: new Date(formData.startDate).toISOString().split("T")[0],
          endDate: new Date(formData.endDate).toISOString().split("T")[0],
        }

        const response = await fetch("http://localhost:3000/travel-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized access
            throw new Error("Please login again")
          }
          throw new Error("Failed to submit request")
        }

        await response.json()

        // If successful
        setShowSuccess(true)
        setFormData({
          purpose: "",
          department: [],
          startDate: "",
          endDate: "",
        })

        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      } catch (error) {
        console.error("Error:", error)
        setErrors({
          submit: error.message || "Failed to submit request. Please try again.",
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
            {errors.purpose && (
              <span className="error-message">{errors.purpose}</span>
            )}
          </div>

          {/* React-Select for multi-department */}
          <div className="form-group">
            <label htmlFor="department">Department (Select at least 2):</label>

            <Select
              isMulti
              name="department"
              options={departmentOptions}
              // Determine which options are currently selected:
              value={departmentOptions.filter((option) =>
                formData.department.includes(option.value)
              )}
              onChange={handleDepartmentChange}
              isDisabled={isSubmitting}
              className={errors.department ? "error" : ""}
            />

            {errors.department && (
              <span className="error-message">{errors.department}</span>
            )}
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
              {errors.startDate && (
                <span className="error-message">{errors.startDate}</span>
              )}
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
              {errors.endDate && (
                <span className="error-message">{errors.endDate}</span>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <button
              type="submit"
              className="submit-button"
              disabled={
                isSubmitting ||
                formData.department.length < 1  // Disable if there are no departments selected
              }
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
            </button>

        </form>
      </div>
    </div>
  )
}

export default RequestForm
