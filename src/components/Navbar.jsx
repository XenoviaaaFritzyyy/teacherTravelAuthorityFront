"use client"

import { Bell, Home, User } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import "./Navbar.css"

const Navbar = () => {
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const handleHomeClick = () => {
    navigate("/dashboard")
  }

  const handleNotificationClick = () => {
    navigate("/notifications")
    setShowNotifications(false)
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    setShowProfile(false)
  }

  const toggleProfile = () => {
    setShowProfile(!showProfile)
    setShowNotifications(false)
  }

  const handleProfileClick = () => {
    navigate("/profile")
    setShowProfile(false)
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="logo">
          <img src="/depedLogonav.png?height=40&width=100" alt="DepEd Logo" className="deped-logo" />
        </Link>

        <div className="nav-actions">
          <div className="home-container">
            <button className="icon-button" onClick={handleHomeClick}>
              <Home className="icon" />
            </button>
          </div>

          <div className="notification-container">
            <button className="icon-button" onClick={handleNotificationClick}>
              <Bell className="icon" />
            </button>

            {showNotifications && (
              <div className="dropdown notifications-dropdown">
                <h3>Notifications</h3>
                <div className="notification-list">
                  <div className="notification-item">
                    <p>Your travel request has been approved</p>
                    <span className="notification-time">2 hours ago</span>
                  </div>
                  <div className="notification-item">
                    <p>New travel policy update</p>
                    <span className="notification-time">1 day ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="profile-container">
            <button className="icon-button" onClick={toggleProfile}>
              <User className="icon" />
            </button>

            {showProfile && (
              <div className="dropdown profile-dropdown">
                <div className="profile-info">
                  <h3>
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </h3>
                  <p>{user?.position || "Teacher"}</p>
                </div>
                <div className="profile-menu">
                  <button onClick={handleProfileClick} className="dropdown-button">
                    View Profile
                  </button>
                  <button onClick={handleLogout} className="dropdown-button">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

