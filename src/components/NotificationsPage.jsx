"use client"

import { useState } from "react"
import Navbar from "./Navbar"
import "./NotificationsPage.css"

// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    teacherName: "Smith, John",
    status: "APPROVED",
    date: "2024-03-15",
    reason: "Travel request approved. All documentation is complete and verified.",
  },
  {
    id: 2,
    teacherName: "Doe, Jane",
    status: "APPROVED",
    date: "2024-03-14",
    reason: "Professional development request approved. Budget allocation confirmed.",
  },
  {
    id: 3,
    teacherName: "Johnson, Robert",
    status: "APPROVED",
    date: "2024-03-13",
    reason: "Conference attendance request approved. Alignment with development goals verified.",
  },
  {
    id: 4,
    teacherName: "Williams, Mary",
    status: "REJECTED",
    date: "2024-03-12",
    reason: "Request rejected due to incomplete documentation. Please resubmit with complete travel itinerary.",
  },
  {
    id: 5,
    teacherName: "Brown, David",
    status: "REJECTED",
    date: "2024-03-11",
    reason: "Request rejected due to budget constraints. Please consult with department head for alternatives.",
  },
]

const NotificationItem = ({ notification, isExpanded, onClick }) => {
  return (
    <div className={`notification-item ${isExpanded ? "expanded" : ""}`} onClick={onClick}>
      <div className="notification-header">
        <span className="teacher-name">{notification.teacherName}</span>
        <span className={`status ${notification.status.toLowerCase()}`}>{notification.status}</span>
        <span className="date">{notification.date}</span>
      </div>
      {isExpanded && (
        <div className="notification-details">
          <div className="reason">
            <p>{notification.reason}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const NotificationsPage = () => {
  const [expandedId, setExpandedId] = useState(null)

  const handleNotificationClick = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="notifications-page">
      <Navbar />
      <div className="notifications-container">
        <div className="notifications-card">
          <h2>NOTIFICATIONS</h2>
          <div className="notifications-list">
            {mockNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isExpanded={expandedId === notification.id}
                onClick={() => handleNotificationClick(notification.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage

