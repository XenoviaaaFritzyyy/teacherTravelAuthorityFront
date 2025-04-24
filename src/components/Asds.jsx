"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import axios from "axios"
import "./Asds.css"
import Navbar from "./Navbar"
import RequestForm from "./RequestForm"
import PendingRequestsTable from "./PendingRequestsTable"
import RequestSummary from "./RequestSummary"
import AllRequestsTable from "./AllRequestsTable"

const Asds = () => {
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
                    "http://localhost:3000/travel-requests/pending",
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
                    
                    <div className="dashboard-header">
                        <h2>ASDS Dashboard</h2>
                        <p>Manage travel requests and oversee system activity</p>
                    </div>
                    
                    {/* Request Summary Stats */}
                    <RequestSummary />
                    
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
                        <button 
                            className={`tab-button ${activeTab === "all" ? "active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All Requests
                        </button>
                    </div>
                    
                    {activeTab === "request" ? (
                        <RequestForm />
                    ) : activeTab === "validate" ? (
                        <PendingRequestsTable onUnviewedCountChange={setUnviewedCount} />
                    ) : (
                        <AllRequestsTable />
                    )}
                </div>
            </main>
        </div>
    )
}

export default Asds
