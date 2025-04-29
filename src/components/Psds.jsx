"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import Navbar from "./Navbar"
import "./Psds.css"
import RequestForm from "./RequestForm"
import PendingRequestsTable from "./PendingRequestsTable"
import axios from "axios"
import apiConfig from '../config/api'

const Psds = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useUser()
    const [showWelcome, setShowWelcome] = useState(false)
    const [activeTab, setActiveTab] = useState("request")
    const [unviewedCount, setUnviewedCount] = useState(0)

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

    // Fetch unviewed count
    useEffect(() => {
        const fetchUnviewedCount = async () => {
            if (!user) return;
            
            try {
                const token = localStorage.getItem("accessToken");
                const response = await axios.get(
                    apiConfig.endpoints.travelRequests.pending,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                
                const unviewed = (response.data || []).filter(req => !req.viewed).length;
                setUnviewedCount(unviewed);
            } catch (error) {
                console.error("Error fetching unviewed count:", error);
            }
        };

        fetchUnviewedCount();
        
        // Set up interval to check for new requests
        const interval = setInterval(fetchUnviewedCount, 30000); // Check every 30 seconds
        
        return () => clearInterval(interval);
    }, [user]);

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
                            Validate Requests {unviewedCount > 0 && <span className="unviewed-badge">{unviewedCount}</span>}
                        </button>
                    </div>
                    
                    {activeTab === "request" ? (
                        <RequestForm />
                    ) : (
                        <PendingRequestsTable onUnviewedCountChange={setUnviewedCount} />
                    )}
                </div>
            </main>
        </div>
    )
}

export default Psds
