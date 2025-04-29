"use client"

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUpPage.css";
import apiConfig from '../config/api';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [existingEmails, setExistingEmails] = useState([])

  // Check if email already exists when email field changes
  useEffect(() => {
    const checkEmailExists = async () => {
      if (formData.email && formData.email.endsWith('@deped.gov.ph')) {
        setIsCheckingEmail(true);
        try {
          const response = await fetch(`${apiConfig.endpoints.auth.checkEmail}?email=${encodeURIComponent(formData.email)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const data = await response.json();
          
          if (data.exists) {
            // Email already exists, set error without message
            setErrors(prev => ({ ...prev, email: "" }));
            if (!existingEmails.includes(formData.email)) {
              setExistingEmails(prev => [...prev, formData.email]);
            }
          } else if (existingEmails.includes(formData.email)) {
            // Still mark as error if it's in our local list of existing emails
            setErrors(prev => ({ ...prev, email: "" }));
          } else {
            // Clear email error if it was previously set for duplicate
            const newErrors = { ...errors };
            if (newErrors.email === "") {
              delete newErrors.email;
              setErrors(newErrors);
            }
          }
        } catch (error) {
          console.error('Error checking email:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      }
    };
    
    // Debounce the email check to avoid too many requests
    const timeoutId = setTimeout(() => {
      checkEmailExists();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [formData.email, existingEmails, errors]);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Clear specific field error when user starts typing again
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  }

  const validateForm = () => {
    const tempErrors = {}

    if (!formData.firstName) tempErrors.firstName = "First name is required"
    if (!formData.lastName) tempErrors.lastName = "Last name is required"

    if (!formData.email) {
      tempErrors.email = "Email is required"
    } else {
      // Check if email ends with @deped.gov.ph
      const isDepedEmail = formData.email.endsWith('@deped.gov.ph');
      if (!isDepedEmail) {
        // Just mark as invalid without specific message to keep it confidential
        tempErrors.email = ""
      } else if (!/\S+@deped\.gov\.ph$/.test(formData.email)) {
        // Additional validation for proper email format
        tempErrors.email = "Email is invalid"
      } else if (existingEmails.includes(formData.email)) {
        // Check if email is in our list of existing emails
        tempErrors.email = ""
        return false; // Immediately fail validation for duplicate emails
      }
    }

    if (!formData.password) {
      tempErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      tempErrors.password = "Password must be at least 8 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if email exists before form submission
    if (formData.email && formData.email.endsWith('@deped.gov.ph')) {
      try {
        const response = await fetch(`${apiConfig.endpoints.auth.checkEmail}?email=${encodeURIComponent(formData.email)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (data.exists) {
          // Email already exists, mark as error and prevent form submission
          setErrors(prev => ({ ...prev, email: "" }));
          if (!existingEmails.includes(formData.email)) {
            setExistingEmails(prev => [...prev, formData.email]);
          }
          return; // Prevent form submission
        }
      } catch (error) {
        console.error('Error checking email before submission:', error);
      }
    }

    if (validateForm() && !existingEmails.includes(formData.email)) {
        setIsLoading(true);
        try {
            const response = await fetch(apiConfig.endpoints.auth.signup, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: formData.password,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    role: "TEACHER",  // Make sure this matches your UserRole enum
                    // Add default values for optional fields
                    school_id: "",
                    school_name: "",
                    district: "",
                    position: "",
                    contact_no: "",
                    employee_number: ""
                })
            });

            const data = await response.json();
            
            if (response.ok) {
              navigate('/login');
            } else {
                console.error('Server error:', data);
                
                // Handle duplicate email error specifically
                if (data.message && data.message.includes('duplicate')) {
                    // For duplicate email, just mark the field as error without specific message
                    setErrors({ ...errors, email: "" });
                    // Add to existing emails list to prevent future submissions
                    if (!existingEmails.includes(formData.email)) {
                      setExistingEmails(prev => [...prev, formData.email]);
                    }
                } else {
                    setErrors({ submit: data.message || 'Signup failed' });
                }
            }
        } catch (error) {
            console.error('Network error:', error);
            setErrors({ submit: 'Network error occurred' });
        } finally {
            setIsLoading(false);
        }
    }
};

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="logo-background">
        <img
            src="/depedlogo.png?height=200&width=200"
            alt="Department of Education Division of Cebu Province"
            className="doe-logo"
          />
        </div>

        <h1 className="signup-title">SIGN UP</h1>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? "error" : ""}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? "error" : ""}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="DepEd Email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email !== undefined ? "error" : ""}
              />
              {errors.email && errors.email.length > 0 && <span className="error-message">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "error" : ""}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          {errors.submit && <span className="error-message submit-error">{errors.submit}</span>}

          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? "SIGNING UP..." : "SIGN UP"}
          </button>
        </form>

        <div className="department-title">DEPARTMENT OF EDUCATION</div>

        <div className="login-link">
          Already have an account? <Link to="/login">Go to login</Link>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage   