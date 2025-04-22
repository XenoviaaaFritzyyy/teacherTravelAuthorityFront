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
import { generateCertificateOfAppearancePDF } from '../utils/certificateOfAppearanceGenerator'

const NotificationItem = ({ notification, isExpanded, onClick }) => {
  // Add useSnackbar hook to access the showSnackbar function
  const { showSnackbar } = useSnackbar();
  
  // Debug: Log each notification as it's rendered
  // Check if this is an administrative officer approval based on the message
  const isAdminApproval = notification.message && 
    notification.message.includes('emergency purposes until your travel end date');
  
  console.log('Rendering notification:', { 
    id: notification.id,
    type: notification.type, 
    message: notification.message,
    includes_certificate: notification.message && notification.message.includes('Certificate of Appearance'),
    isAdminApproval: isAdminApproval
  });

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
      // Extract security code from notification message
      // Extract security code from notification message
      const securityCodeMatch = notification.message.match(/Security Code: ([A-Z0-9]+)/);
      const securityCode = securityCodeMatch ? securityCodeMatch[1] : null;
      
      if (!securityCode) {
        showSnackbar('Could not find security code in notification', 'error');
        return;
      }
      
      // Fetch the travel request details using the security code
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3000/travel-requests/by-code/${securityCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const travelRequest = response.data;
      console.log('Travel request data for Authority to Travel:', travelRequest);
      
      // Generate the PDF
      const doc = generateTravelAuthorityPDF(travelRequest);
      
      // Save the PDF directly
      doc.save(`Authority_to_Travel_${securityCode}.pdf`);
      showSnackbar('Authority to Travel PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      showSnackbar('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const handleDownloadCertificateOfAppearancePDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    try {
      // Extract security code from notification message
      const securityCodeMatch = notification.message.match(/Security Code: ([A-Z0-9]+)/);
      const securityCode = securityCodeMatch ? securityCodeMatch[1] : null;
      
      if (!securityCode) {
        showSnackbar('Could not find security code in notification', 'error');
        return;
      }
      
      // Fetch the travel request details using the security code
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `http://localhost:3000/travel-requests/by-code/${securityCode}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const travelRequest = response.data;
      console.log('Travel request data for Certificate of Appearance:', travelRequest);
      
      // Generate the certificate of appearance PDF
      const doc = generateDownloadReceiptPDF(travelRequest);
      
      // Save the PDF directly
      doc.save(`Certificate_of_Appearance_${securityCode}.pdf`);
      showSnackbar('Certificate of Appearance PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to generate certificate of appearance PDF:', error);
      showSnackbar('Failed to generate certificate of appearance PDF. Please try again.', 'error');
    }
  };

  const handleDownloadReceiptPDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    try {
      // Extract security code from notification message
      const securityCodeMatch = notification.message.match(/Security Code: ([A-Z0-9]+)/);
      const securityCode = securityCodeMatch ? securityCodeMatch[1] : null;
      
      if (!securityCode) {
        showSnackbar('Could not find security code in notification', 'error');
        return;
      }
      
      // Fetch the travel request details using the security code
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3000/travel-requests/by-code/${securityCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const travelRequest = response.data;
      console.log('Travel request data for Receipt:', travelRequest);
      
      // Generate the receipt PDF
      const doc = generateReceiptPDF(travelRequest, getStatusDisplayText);
      
      // Save the PDF directly
      doc.save(`Travel_Receipt_${securityCode}.pdf`);
      showSnackbar('Receipt PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to generate receipt PDF:', error);
      showSnackbar('Failed to generate receipt PDF. Please try again.', 'error');
    }
  };

  const handleDownloadNewReceiptPDF = async (e) => {
    e.stopPropagation(); // Prevent notification from expanding when clicking download
    try {
      // Extract security code from notification message
      const securityCodeMatch = notification.message.match(/Security Code: ([A-Z0-9]+)/);
      const securityCode = securityCodeMatch ? securityCodeMatch[1] : null;
      
      if (!securityCode) {
        showSnackbar('Could not find security code in notification', 'error');
        return;
      }
      
      // Fetch the travel request details using the security code
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:3000/travel-requests/by-code/${securityCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const travelRequest = response.data;
      console.log('Travel request data for Certificate of Appearance:', travelRequest);
      
      // Generate the certificate of appearance PDF
      const doc = generateDownloadReceiptPDF(travelRequest);
      
      // Save the PDF directly
      doc.save(`Certificate_of_Appearance_${securityCode}.pdf`);
      showSnackbar('Certificate of Appearance PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to generate certificate of appearance PDF:', error);
      showSnackbar('Failed to generate certificate of appearance PDF. Please try again.', 'error');
    }
  };

  return (
    <div className={`notification-item ${isExpanded ? "expanded" : ""} ${!notification.isRead ? "unread" : ""}`} onClick={onClick}>
      <div className="notification-header">
        <span className="notification-type">
          {(() => {
            // Check if this is an AO admin officer approval
            const isAdminApproval = notification.type === 'TRAVEL_REQUEST_APPROVED' && 
              notification.message && 
              notification.message.includes('emergency purposes until your travel end date');
            
            // Check if this is a certificate of appearance notification
            const isCertificate = notification.type === 'CERTIFICATE_OF_APPEARANCE_APPROVED' ||
              notification.type === 'TRAVEL_REQUEST_RECEIPT' ||
              (notification.message && notification.message.includes('Certificate of Appearance'));
            
            // Check if this is an authority to travel notification
            // Important: Do NOT consider it an authority notification if it's an admin approval
            const isAuthority = !isAdminApproval && (
              notification.type === 'AUTHORITY_TO_TRAVEL_APPROVED' ||
              (notification.type === 'TRAVEL_REQUEST_APPROVED' &&
                !(notification.message && notification.message.includes('Certificate of Appearance')) &&
                !notification.message.includes('emergency purposes until your travel end date'))
            );
            
            // Determine the display text based on the conditions
            if (isAdminApproval) {
              return 'CERTIFICATE OF APPEARANCE APPROVED';
            } else if (isCertificate && isAuthority) {
              return 'TRAVEL DOCUMENTS APPROVED';
            } else if (isCertificate) {
              return 'CERTIFICATE OF APPEARANCE APPROVED';
            } else if (isAuthority) {
              return 'AUTHORITY TO TRAVEL APPROVED';
            } else if (notification.type === 'TRAVEL_REQUEST_VALIDATED') {
              return 'TRAVEL REQUEST VALIDATED';
            }
            
            return notification.type.replace(/_/g, ' ');
          })()}
        </span>
        <span className="date">{formatDate(notification.createdAt)}</span>
      </div>
      {isExpanded && (
        <div className="notification-details">
          <div className="message">
            <p>{notification.message}</p>
          </div>
          {/* Only show Authority to Travel buttons for hierarchy approvals */}
          {(notification.type === 'AUTHORITY_TO_TRAVEL_APPROVED' || 
             (notification.type === 'TRAVEL_REQUEST_APPROVED' &&
              !notification.message.includes('Certificate of Appearance') &&
              !notification.message.includes('receipt is ready') &&
              !notification.message.includes('emergency purposes until your travel end date'))) && (
            <>
              <button className="download-pdf-button" onClick={handleDownloadPDF}>
                Download Authority to Travel PDF
              </button>
            </>
          )}
          {/* Only show Certificate button alone for Certificate-specific notifications */}
          {(notification.type === 'CERTIFICATE_OF_APPEARANCE_APPROVED' || 
             (notification.type === 'TRAVEL_REQUEST_APPROVED' && 
              notification.message && 
              notification.message.includes('emergency purposes until your travel end date')) ||
             notification.type === 'TRAVEL_REQUEST_RECEIPT') && (
            <>
              <button className="download-pdf-button" onClick={handleDownloadCertificateOfAppearancePDF}>
                Download Certificate of Appearance PDF
              </button>
            </>
          )}
          {/* No download buttons for TRAVEL_REQUEST_VALIDATED */}
          {(notification.type === 'TRAVEL_REQUEST_RECEIPT' || 
             notification.type === 'TRAVEL_COMPLETED') && (
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
  );
};

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
      
      // Debug: Log all notification types and messages
      console.log('Fetched notifications:', fetchedNotifications.map(n => ({ 
        id: n.id,
        type: n.type, 
        message: n.message,
        createdAt: n.createdAt
      })));
      
      // Filter out duplicate notifications
      // Find all admin approval notifications (containing "emergency purposes until your travel end date")
      const adminApprovals = fetchedNotifications.filter(n => 
        n.type === 'TRAVEL_REQUEST_APPROVED' && 
        n.message && 
        n.message.includes('emergency purposes until your travel end date')
      );
      
      // For each admin approval, extract the security code to identify related notifications
      const securityCodes = adminApprovals.map(n => {
        const match = n.message.match(/Security Code: ([A-Z0-9]+)/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      // Filter out "Authority to Travel Approved" notifications that have the same security code
      // as any admin approval notification
      const filteredNotifications = fetchedNotifications.filter(n => {
        // Always keep admin approval notifications (Certificate of Appearance Approved)
        if (n.type === 'TRAVEL_REQUEST_APPROVED' && 
            n.message && 
            n.message.includes('emergency purposes until your travel end date')) {
          return true;
        }
        
        // Check if this is an "Authority to Travel" notification
        const isAuthorityNotification = 
          n.type === 'AUTHORITY_TO_TRAVEL_APPROVED' || 
          (n.type === 'TRAVEL_REQUEST_APPROVED' && 
           !n.message.includes('Certificate of Appearance') &&
           !n.message.includes('emergency purposes until your travel end date'));
        
        // If it's an authority notification, check if it has a security code that matches
        // any of our admin approval notifications - if so, remove it completely
        if (isAuthorityNotification) {
          const match = n.message.match(/Security Code: ([A-Z0-9]+)/);
          const code = match ? match[1] : null;
          
          // If the code is in our list of admin approval codes, filter it out
          if (code && securityCodes.includes(code)) {
            console.log(`Filtering out Authority to Travel notification with code ${code} as admin approval exists`);
            return false;
          }
        }
        
        // Keep all other notifications
        return true;
      });
      
      let updatedNotifications;
      if (append) {
        updatedNotifications = [...notifications, ...filteredNotifications];
        setNotifications(updatedNotifications);
      } else {
        updatedNotifications = filteredNotifications;
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
