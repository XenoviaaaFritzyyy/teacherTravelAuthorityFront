"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "./Navbar"
import "./NotificationsPage.css"

const NotificationItem = ({ notification, isExpanded, onClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `http://localhost:3000/notifications/${notification.id}/pdf`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `travel-authority-${notification.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className={`notification-item ${isExpanded ? "expanded" : ""} ${!notification.isRead ? "unread" : ""}`} onClick={onClick}>
      <div className="notification-header">
        <span className="notification-type">{notification.type.replace(/_/g, ' ')}</span>
        <span className="date">{formatDate(notification.createdAt)}</span>
      </div>
      {isExpanded && (
        <div className="notification-details">
          <div className="message">
            <p>{notification.message}</p>
          </div>
          {notification.type === 'TRAVEL_REQUEST_APPROVED' && (
            <button className="download-pdf-button" onClick={handleDownloadPDF}>
              Download Travel Authority PDF
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const NotificationsPage = () => {
  const [expandedId, setExpandedId] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('http://localhost:3000/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationClick = async (id) => {
    setExpandedId(expandedId === id ? null : id);
    
    // Mark notification as read when clicked
    if (expandedId !== id) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.patch(`http://localhost:3000/notifications/${id}/read`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <Navbar />
        <div className="notifications-container">
          <div className="notifications-card">
            <h2>Loading notifications...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <Navbar />
      <div className="notifications-container">
        <div className="notifications-card">
          <h2>NOTIFICATIONS</h2>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications to display</p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isExpanded={expandedId === notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage

