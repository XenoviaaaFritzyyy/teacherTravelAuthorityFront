"use client"

import { useEffect, useState } from "react"
import Select from "react-select"         // <-- Import from react-select
import "./RequestForm.css"
import apiConfig from '../config/api'

const RequestForm = () => {
  // Department stored as an array of selected values (strings).
  const [formData, setFormData] = useState({
    purpose: "",
    department: [], 
    startDate: "",
    endDate: "",
    otherDepartment: "", // New field for custom "Others" input
  })

  const [minDate, setMinDate] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOtherInput, setShowOtherInput] = useState(false) // State to control visibility of "Others" input field

  // Department options for react-select: label, value
  const departmentOptions = [
    { label: "Accounting", value: "Accounting" },
    { label: "Administrative Office", value: "Administrative Office" },
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
    { label: "Others", value: "Others" }, // Added "Others" option
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
    // If no options are selected
    if (!selectedOptions || selectedOptions.length === 0) {
      setFormData((prev) => ({ ...prev, department: [] }));
      setShowOtherInput(false);
      return;
    }

    // Check if the new selection includes 'Others'
    const hasOthers = selectedOptions.some(opt => opt.value === "Others");
    const othersOption = departmentOptions.find(opt => opt.value === "Others");
    
    // If the user is selecting 'Others'
    if (hasOthers) {
      // If 'Others' is being added to the selection, keep only 'Others'
      if (selectedOptions.length > 1) {
        selectedOptions = [othersOption];
      }
      setShowOtherInput(true);
    } else {
      // If 'Others' is not selected, hide the input field and clear its value
      setShowOtherInput(false);
      setFormData((prev) => ({ ...prev, otherDepartment: "" }));
    }
  
    // Extract just the values from the selected options
    const departmentsArray = selectedOptions.map((opt) => opt.value);
    setFormData((prev) => ({ ...prev, department: departmentsArray }));

    if (errors.department) {
      setErrors((prev) => ({ ...prev, department: null }));
    }
  }

  // Validate the form
  const validateForm = () => {
    const tempErrors = {}

    if (!formData.purpose.trim()) {
      tempErrors.purpose = "Purpose is required"
    }

    // Check if department is empty
    if (!formData.department || formData.department.length === 0) {
      tempErrors.department = "Please select at least one department"
    } 
    // If "Others" is not selected, require at least 2 departments
    else if (!formData.department.includes("Others") && formData.department.length < 2) {
      tempErrors.department = "Please select at least two departments"
    }

    if (formData.department.includes("Others") && !formData.otherDepartment.trim()) {
      tempErrors.otherDepartment = "Please specify the other department"
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
          department: formData.department.includes("Others") ? [...formData.department.filter(department => department !== "Others"), formData.otherDepartment] : formData.department,
          startDate: new Date(formData.startDate).toISOString().split("T")[0],
          endDate: new Date(formData.endDate).toISOString().split("T")[0],
        }

        const response = await fetch(apiConfig.endpoints.travelRequests.base, {
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
          otherDepartment: "",
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
            <label htmlFor="department">Note: If "Others" Please SPECIFY in the Textbox below.</label>

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
              // Completely prevent dropdown from opening when "Others" is selected
              menuIsOpen={formData.department.includes("Others") ? false : undefined}
              // Add custom styles to indicate dropdown is disabled when Others is selected
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  cursor: formData.department.includes("Others") ? 'not-allowed' : 'default',
                }),
              }}
            />

            {errors.department && (
              <span className="error-message">{errors.department}</span>
            )}
          </div>

          {showOtherInput && (
            <div className="form-group">
              <label htmlFor="otherDepartment">Other Department:</label>
              <input
                type="text"
                id="otherDepartment"
                name="otherDepartment"
                value={formData.otherDepartment}
                onChange={handleChange}
                className={errors.otherDepartment ? "error" : ""}
                disabled={isSubmitting}
              />
              {errors.otherDepartment && (
                <span className="error-message">{errors.otherDepartment}</span>
              )}
            </div>
          )}

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
                (formData.department.includes("Others") 
                  ? formData.department.length < 1 || !formData.otherDepartment.trim()
                  : formData.department.length < 2)  
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
