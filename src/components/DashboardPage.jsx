"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useUser } from "../context/UserContext"
import Navbar from "./Navbar"
import RequestForm from "./RequestForm"
import "./DashboardPage.css"

const DashboardPage = () => {
  const location = useLocation()
  const { user } = useUser()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Check if user just completed their profile
    const justCompletedProfile = sessionStorage.getItem("profileJustCompleted")
    if (justCompletedProfile) {
      setShowWelcome(true)
      // Remove the flag so it doesn't show again on refresh
      sessionStorage.removeItem("profileJustCompleted")
    }
  }, [])

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-container">
          {showWelcome && (
            <div className="welcome-message">
              <h3>Welcome, {user?.firstName}!</h3>
              <p>Your profile is complete. You can now submit travel requests.</p>
            </div>
          )}
          <RequestForm />
        </div>
      </main>
    </div>
  )
}

export default DashboardPage

