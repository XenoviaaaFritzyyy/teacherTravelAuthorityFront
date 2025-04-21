"use client"

import React, { useState, useEffect } from "react";
import { useSnackbar } from "./SnackbarProvider"; // Use unified snackbar provider
import axios from "axios"
import { jsPDF } from 'jspdf'
import Navbar from "./Navbar"
import "./NotificationsPage.css"
import { generateReceiptPDF, getStatusDisplayText } from "../utils/receiptGenerator"
import { generateTravelAuthorityPDF } from "../utils/travelAuthorityGenerator"
import { generateDownloadReceiptPDF } from "../utils/downloadReceiptGenerator"

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

  // Use the new travel authority generator
  const generatePDF = async (notification) => {
    try {
      // Extract travel request ID or security code from notification
      const securityCodeMatch = notification.message.match(/Security Code: ([A-Z0-9]+)/);
      const securityCode = securityCodeMatch ? securityCodeMatch[1] : null;
      
      // Fetch the complete travel request data
      let travelRequest;
      const token = localStorage.getItem('accessToken');
      
      if (securityCode) {
        // If we have a security code, use it to fetch the travel request
        const response = await axios.get(`http://localhost:3000/travel-requests/by-code/${securityCode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        travelRequest = response.data;
      } else if (notification.travelRequestId) {
        // If we have a travel request ID, use it
        const response = await axios.get(`http://localhost:3000/travel-requests/${notification.travelRequestId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        travelRequest = response.data;
      } else {
        // Fallback to using the notification data
        travelRequest = notification;
      }
      
      // Log the travel request data for debugging
      console.log('Travel request data for PDF:', travelRequest);
      
      const doc = generateTravelAuthorityPDF(travelRequest);
      // Save the PDF with a meaningful filename
      doc.save(`travel-authority-${notification.id || 'document'}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // Check if showSnackbar is defined
      if (typeof showSnackbar === 'function') {
        showSnackbar('Failed to generate PDF. Please try again.', 'error');
      } else {
        console.error('Snackbar function not available');
      }
    }
  };

  const generateReceiptPDFFromNotification = async (notification) => {
    try {
      // Extract security code from the notification message
      const securityCodeMatch = notification.message.match(/Security Code: ([A-Z0-9]+)/);
      const securityCode = securityCodeMatch ? securityCodeMatch[1] : 'Unknown';
      
      // Fetch the travel request details using the security code
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3000/travel-requests/by-code/${securityCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const travelRequest = response.data;
      
      // Generate the receipt PDF
      const doc = generateReceiptPDF(travelRequest, getStatusDisplayText);
      
      // Save the PDF
      doc.save(`Travel_Receipt_${securityCode}.pdf`);
    } catch (error) {
      console.error('Failed to generate receipt PDF:', error);
      showSnackbar('Failed to generate receipt PDF. Please try again.', 'error');
    }
  };

  const generateDownloadReceiptPDFFromNotification = async (notification) => {
    try {
      // Extract security code from the notification message
      const securityCodeMatch = notification.message.match(/Security Code: ([A-Z0-9]+)/);
      const securityCode = securityCodeMatch ? securityCodeMatch[1] : 'Unknown';
      
      // Fetch the travel request details using the security code
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3000/travel-requests/by-code/${securityCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const travelRequest = response.data;
      
      // Generate the download receipt PDF
      const doc = generateDownloadReceiptPDF(travelRequest);
      
      // Save the PDF
      doc.save(`Download_Receipt_${securityCode}.pdf`);
    } catch (error) {
      console.error('Failed to generate download receipt PDF:', error);
      showSnackbar('Failed to generate download receipt PDF. Please try again.', 'error');
    }
  };

  const handleDownloadPDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    generatePDF(notification);
  };

  const handleDownloadReceiptPDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    generateReceiptPDFFromNotification(notification);
  };

  const handleDownloadNewReceiptPDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    generateDownloadReceiptPDFFromNotification(notification);
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
              Download Authority to Travel PDF
            </button>
          )}
          {notification.type === 'TRAVEL_REQUEST_RECEIPT' && (
            <>
              <button className="download-pdf-button receipt" onClick={handleDownloadReceiptPDF}>
                Download Receipt PDF
              </button>
              <button className="download-pdf-button receipt" onClick={handleDownloadNewReceiptPDF}>
                Download Certificate of Appearance
              </button>
            </>
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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:3000/notifications', {
        params: {
          page: pageNum,
          limit: 10,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const { notifications: fetchedNotifications, total } = response.data;
      
      let updatedNotifications;
      if (append) {
        updatedNotifications = [...notifications, ...fetchedNotifications];
        setNotifications(updatedNotifications);
      } else {
        updatedNotifications = fetchedNotifications;
        setNotifications(updatedNotifications);
      }
      
      // Check if we've loaded all notifications
      // Use the updated notifications count to determine if there are more to load
      setHasMore(updatedNotifications.length < total);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
    // Don't include startDate and endDate as dependencies to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };
  
  const handleDateSearch = () => {
    // Only proceed if at least one date is selected
    if (!startDate && !endDate) return;
    
    setLoading(true);
    setPage(1);
    // Reset hasMore to ensure load more works after filtering
    setHasMore(true);
    fetchNotifications(1, false);
  };
  
  const handleClearDateFilter = () => {
    // Only proceed if there are dates to clear
    if (!startDate && !endDate) return;
    
    setStartDate('');
    setEndDate('');
    setLoading(true);
    setPage(1);
    // Reset hasMore to ensure load more works after clearing filter
    setHasMore(true);
    fetchNotifications(1, false);
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
          <div className="date-filter-container">
            <div className="date-inputs">
              <div className="date-input-group">
                <label htmlFor="startDate">From:</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="endDate">To:</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="date-filter-buttons">
              <button 
                className="search-button" 
                onClick={handleDateSearch}
                disabled={loading}
              >
                Search
              </button>
              <button 
                className="clear-button" 
                onClick={handleClearDateFilter}
                disabled={loading || (!startDate && !endDate)}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications to display</p>
            ) : (
              <>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isExpanded={expandedId === notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                  />
                ))}
                
                {hasMore && (
                  <div className="load-more-container">
                    <button 
                      className="load-more-button" 
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
