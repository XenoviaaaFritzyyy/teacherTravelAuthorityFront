"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import "./Asds.css"
import Navbar from "./Navbar"
import RequestForm from "./RequestForm"
import PendingRequestsTable from "./PendingRequestsTable"

const Asds = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useUser()
    const [showWelcome, setShowWelcome] = useState(false)
    const [activeTab, setActiveTab] = useState("request")

    useEffect(() => {
        // Check if user exists and has required fields
        if (user && (!user.school_id || !user.school_name || !user.district || !user.position)) {
            navigate('/profile', {
                state: { message: "Please complete your profile information." }
            })
            return
        }

        // Check if user just completed their profile
        const justCompletedProfile = sessionStorage.getItem("profileJustCompleted")
        if (justCompletedProfile) {
            setShowWelcome(true)
            sessionStorage.removeItem("profileJustCompleted")
        }
    }, [user, navigate])

    if (!user) {
        return null // or a loading spinner
    }

    return (
        <div className="dashboard">
            <Navbar />
            <main className="dashboard-main">
                <div className="dashboard-container">
                    {showWelcome && (
                        <div className="welcome-message">
                            <h3>Welcome, {user.first_name}!</h3>
                            <p>Your profile is complete. You can now submit travel requests.</p>
                        </div>
                    )}
                    
                    <div className="dashboard-tabs">
                        <button 
                            className={`tab-button ${activeTab === "request" ? "active" : ""}`}
                            onClick={() => setActiveTab("request")}
                        >
                            Submit Request
                        </button>
                        <button 
                            className={`tab-button ${activeTab === "validate" ? "active" : ""}`}
                            onClick={() => setActiveTab("validate")}
                        >
                            Validate Requests
                        </button>
                    </div>
                    
                    {activeTab === "request" ? (
                        <RequestForm />
                    ) : (
                        <PendingRequestsTable />
                    )}
                </div>
            </main>
        </div>
    )
}

export default Asds
