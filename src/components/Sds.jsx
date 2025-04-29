"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import axios from "axios"
import "./Sds.css"
import Navbar from "./Navbar"
import PendingRequestsTable from "./PendingRequestsTable"
import RequestSummary from "./RequestSummary"
import AllRequestsTable from "./AllRequestsTable"
import apiConfig from '../config/api'

const Sds = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useUser()
    const [showWelcome, setShowWelcome] = useState(false)
    const [unviewedCount, setUnviewedCount] = useState(0)
    const [activeTab, setActiveTab] = useState("pending")

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
                            <p>Your profile is complete. You can now validate ASDS travel requests.</p>
                        </div>
                    )}
                    
                    <div className="dashboard-header">
                        <h2>SDS Dashboard</h2>
                        <p>Review travel requests and monitor system activity</p>
                    </div>
                    
                    {/* Request Summary Stats */}
                    <RequestSummary />
                    
                    <div className="dashboard-tabs">
                        <button 
                            className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
                            onClick={() => setActiveTab("pending")}
                        >
                            Pending Requests {unviewedCount > 0 && <span className="unviewed-badge">{unviewedCount}</span>}
                        </button>
                        <button 
                            className={`tab-button ${activeTab === "all" ? "active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All Requests
                        </button>
                    </div>
                    
                    {activeTab === "pending" ? (
                        <div className="validate-section">
                            <PendingRequestsTable onUnviewedCountChange={setUnviewedCount} />
                        </div>
                    ) : (
                        <AllRequestsTable />
                    )}
                </div>
            </main>
        </div>
    )
}

export default Sds
