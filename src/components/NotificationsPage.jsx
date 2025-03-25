"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { jsPDF } from 'jspdf'
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

  const generatePDF = async (notification) => {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add background logo
      const logoImg = new Image();
      logoImg.src = '/depedlogo.png';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            // Calculate center position
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const imgWidth = 150;  // Width of the logo
            const imgHeight = 150;  // Height of the logo
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            // Add the logo as a faded background
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.1 }));  // Set opacity to 10%
            doc.addImage(logoImg, 'PNG', x, y, imgWidth, imgHeight);
            doc.restoreGraphicsState();
            resolve();
          } catch (error) {
            console.error('Error adding background logo:', error);
            resolve(); // Continue without the logo
          }
        };
        logoImg.onerror = () => {
          console.error('Failed to load logo');
          resolve(); // Continue without the logo
        };
      });
      
      // Set initial position
      let y = 20;
      
      // Add header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TRAVEL AUTHORITY', doc.internal.pageSize.width / 2, y, { align: 'center' });
      
      // Add date
      y += 30;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const formattedDate = formatDate(notification.createdAt);
      doc.text(`Date: ${formattedDate}`, doc.internal.pageSize.width - 20, y, { align: 'right' });
      
      // Add teacher information
      y += 30;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Teacher Information:', 20, y);
      doc.setLineWidth(0.5);
      doc.line(20, y + 2, 120, y + 2);
      
      y += 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${notification.user?.first_name || 'N/A'} ${notification.user?.last_name || ''}`, 20, y);
      y += 10;
      doc.text(`Position: ${notification.user?.position || 'N/A'}`, 20, y);
      y += 10;
      doc.text(`School: ${notification.user?.school_name || 'N/A'}`, 20, y);
      y += 10;
      doc.text(`District: ${notification.user?.district || 'N/A'}`, 20, y);
      
      // Add travel request details
      y += 30;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Travel Request Details:', 20, y);
      doc.setLineWidth(0.5);
      doc.line(20, y + 2, 140, y + 2);
      
      y += 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(notification.message, 20, y, {
        maxWidth: doc.internal.pageSize.width - 40,
      });
      
      // Add footer
      y = doc.internal.pageSize.height - 40;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('This is an official document of the Department of Education', doc.internal.pageSize.width / 2, y, { align: 'center' });
      y += 10;
      doc.text('Unauthorized modifications are prohibited', doc.internal.pageSize.width / 2, y, { align: 'center' });
      
      // Save PDF
      doc.save(`travel-authority-${notification.id}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadPDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    generatePDF(notification);
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
