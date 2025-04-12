"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import axios from "axios"
import "./Sds.css"
import Navbar from "./Navbar"
import PendingRequestsTable from "./PendingRequestsTable"

const Sds = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useUser()
    const [showWelcome, setShowWelcome] = useState(false)
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
                            <p>Your profile is complete. You can now validate ASDS travel requests.</p>
                        </div>
                    )}
                    
                    <div className="dashboard-header">
                        <h2>SDS Dashboard</h2>
                        <p>Review and validate travel requests from ASDS</p>
                    </div>
                    
                    <div className="validate-section">
                        <h3>Pending Requests {unviewedCount > 0 && <span className="unviewed-badge">{unviewedCount}</span>}</h3>
                        <PendingRequestsTable onUnviewedCountChange={setUnviewedCount} />
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Sds
