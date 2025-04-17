"use client"

import axios from "axios";
import { Bell, Home, Printer, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AOadminOfficerDashboard.css";
import jsPDF from 'jspdf';
import { formatDate, generateReceiptPDF, getStatusBadgeClass, getStatusDisplayText } from "../utils/receiptGenerator";

const departments = [
  "Accounting",
  "Administrative",
  "Administrator",
  "Assessment and Evaluation",
  "Assistant Schools Division Superintendent (Cluster A)",
  "Assistant Schools Division Superintendent (Cluster B)",
  "Assistant Schools Division Superintendent (Cluster C)",
  "Authorized Center",
  "Authorized Officer",
  "Authorized Official",
  "Budget",
  "Cashier",
  "CID",
  "Client",
  "Curriculum Management",
  "Dental",
  "Disbursing",
  "Educational Support Staff and Development",
  "Educational Facilities",
  "General Services",
  "HRTD",
  "Human Resource Management",
  "ICT",
  "Instructional Supervision",
  "Learning and Development",
  "Legal",
  "LRMDS",
  "M and E",
  "Medical",
  "Office of the Schools Division Superintendent",
  "Physical Facilities",
  "Planning",
  "Records",
  "Remittance",
  "School Governance",
  "SGOD",
  "Soc. Mob",
  "Supply"
];

const AOadminOfficerDashboard = () => {
  const navigate = useNavigate();
  const [travelOrders, setTravelOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("VALIDATED");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [showExpiredFilter, setShowExpiredFilter] = useState(false); 
  const [remarkText, setRemarkText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckingExpiredCodes, setIsCheckingExpiredCodes] = useState(false);
  const [activeView, setActiveView] = useState("orders");
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Current user's position state
  const [userPosition, setUserPosition] = useState("");

  // Add user state at the top with other state declarations
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch current user's profile and set userPosition
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:3000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
        setUserPosition(res.data.position || "Unknown Position");
      } catch (error) {
        console.error("Failed to fetch current user profile:", error);
        setUserPosition("Unknown Position");
      }
    };

    // Fetch travel orders
    const fetchTravelOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:3000/travel-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Travel requests data:", res.data);

        const formatted = res.data.map((order) => ({
          id: order.id,
          purpose: order.purpose || "",
          status: order.status || "pending",
          validationStatus: order.validationStatus || "PENDING",
          remarks: order.remarks || "",
          startDate: order.startDate ? order.startDate.slice(0, 10) : "",
          endDate: order.endDate ? order.endDate.slice(0, 10) : "",
          teacherName: order.user
            ? `${order.user.last_name}, ${order.user.first_name}`
            : `UserID #${order.userID || "Unknown"}`,
          teacherPosition: order.user ? order.user.position || "" : "",
          teacherSchool: order.user ? order.user.school_name || "" : "",
          department: Array.isArray(order.department) 
            ? order.department.join(',') 
            : (order.department || "").toString(),
          securityCode: order.securityCode || "",
          isCodeExpired: order.isCodeExpired || false,
          user: order.user || {}
        }));

        setTravelOrders(formatted);
      } catch (error) {
        console.error("Failed to fetch travel orders:", error);
      }
    };

    fetchCurrentUser();
    fetchTravelOrders();
  }, []);

  // Helper: Returns auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status, validationStatus, isCodeExpired) => {
    if (isCodeExpired) return "status-badge expired";
    
    if (status === "accepted" || validationStatus === "VALIDATED") {
      return "status-badge accepted";
    } else if (status === "rejected" || validationStatus === "REJECTED") {
      return "status-badge rejected";
    } else {
      return "status-badge pending";
    }
  };

  // Helper function to get status display text
  const getStatusDisplayText = (status, validationStatus, isCodeExpired) => {
    if (isCodeExpired) return "EXPIRED";
    
    if (validationStatus === "VALIDATED") return "VALIDATED";
    if (validationStatus === "REJECTED") return "REJECTED";
    return status.toUpperCase();
  };

  // Helper: Append user's position to a remark (e.g., "Remark text - System Administrator")
  const appendPositionToRemark = (remark) => {
    // Get the department from the current user's position
    const userDepartment = currentUser?.position || "Unknown Department";
    return `${remark.trim()} (${userDepartment})`;
  };

  // Helper: Combine old and new remarks using a comma separator
  const combineRemarks = (oldRemarks, newRemark) => {
    if (!oldRemarks.trim()) {
      return newRemark;
    } else {
      return `${oldRemarks}\n${newRemark}`;
    }
  };

  // Helper function to check if all departments have added remarks
  const checkAllDepartmentRemarks = (order) => {
    if (!order.department || !order.remarks) return false;
    
    // Get array of departments
    const departments = Array.isArray(order.department) 
      ? order.department 
      : order.department.split(',').map(d => d.trim());
    
    // Get array of remarks (each remark should end with the department name in parentheses)
    const remarks = order.remarks.split('\n')
      .map(remark => remark.trim())
      .filter(remark => remark.length > 0);
    
    // Check if each department has a corresponding remark
    return departments.every(dept => 
      remarks.some(remark => {
        // Look for remarks that end with the department name in parentheses
        const match = remark.match(/.*\((.*?)\)$/);
        return match && match[1].trim() === dept.trim();
      })
    );
  }

  // ===================== Handlers ===================== //

  const handleSubmitRemark = async (id) => {
    if (!remarkText.trim()) {
      alert("Please enter a remark before submitting.");
      return;
    }

    const order = travelOrders.find((o) => o.id === id);
    if (!order) {
      alert("Could not find that travel order.");
      return;
    }

    // Format the new remark with name and position
    const newRemarkWithPosition = appendPositionToRemark(remarkText);
    
    // Handle multiple remarks
    const updatedRemarks = order.remarks 
      ? `${order.remarks}\n${newRemarkWithPosition}`
      : newRemarkWithPosition;

    try {
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/remarks`,
        { remarks: updatedRemarks },
        getAuthHeaders()
      );

      setTravelOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === id ? { ...ord, remarks: updatedRemarks } : ord
        )
      );
      
      alert("Remark submitted successfully!");
      setRemarkText("");
    } catch (error) {
      console.error("Failed to submit remark:", error);
      alert("Failed to submit remark. Please try again.");
    }
  };

  const handleOrderClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRemarkText("");
    } else {
      setExpandedId(id);
      setRemarkText("");
    }
  };

  const handleRemarkChange = (e) => setRemarkText(e.target.value);
  const handleDepartmentChange = (e) => setDepartmentFilter(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredOrders = travelOrders.filter((order) => {
    const matchesSearch =
      order.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || order.validationStatus === statusFilter;
    const matchesDepartment =
      departmentFilter === "All Departments" ||
      (order.department && 
       order.department.split(',').map(dep => dep.trim().toLowerCase())
        .includes(departmentFilter.toLowerCase()));
    const matchesExpired = !showExpiredFilter || order.isCodeExpired;

    return matchesSearch && matchesStatus && matchesDepartment && matchesExpired;
  });

  const getStatusTitle = () => {
    if (showExpiredFilter) {
      return "EXPIRED TRAVEL ORDERS";
    }
    
    switch (statusFilter) {
      case "PENDING":
        return "PENDING TRAVEL ORDERS";
      case "VALIDATED":
        return "VALIDATED TRAVEL ORDERS";
      case "REJECTED":
        return "REJECTED TRAVEL ORDERS";
      default:
        return "ALL TRAVEL ORDERS";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
    window.location.reload()
  }

  // Generate receipt for a travel request
  const generateReceipt = (order) => {
    setReceiptData(order);
    setShowReceiptModal(true);
  };

  // Handle printing the receipt
  const handlePrintReceipt = async () => {
    if (!receiptData) return;

    try {
      // First, send a notification to the user
      const token = localStorage.getItem('accessToken');
      const message = `Your travel request receipt is ready. Security Code: ${receiptData.securityCode}`;
      
      await axios.post(
        `http://localhost:3000/travel-requests/${receiptData.id}/receipt`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Generate the PDF using the shared utility
      const doc = generateReceiptPDF(receiptData, getStatusDisplayText);
      
      // Save the PDF
      doc.save(`Travel_Receipt_${receiptData.securityCode}.pdf`);
      
      // Close the modal and show success message
      setShowReceiptModal(false);
      alert("Receipt has been generated and sent to the user");
    } catch (error) {
      console.error("Error sending receipt notification:", error);
      alert("There was an error sending the receipt notification. Please try again.");
    }
  };

  // Receipt Modal Component
  const ReceiptModal = ({ show, onClose, data, onPrint }) => {
    if (!show || !data) return null;
    
    return (
      <div className="receipt-modal">
        <div className="receipt-modal-content">
          <div className="receipt-header">
            <h2>Travel Authority Receipt</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="receipt-body">
            <div className="receipt-section">
              <h3>Travel Details</h3>
              <div className="receipt-detail">
                <span className="label">Security Code:</span>
                <span className="value">{data.securityCode}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Name:</span>
                <span className="value">{data.teacherName}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Position:</span>
                <span className="value">{data.teacherPosition}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">School/Office:</span>
                <span className="value">{data.teacherSchool}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Department(s):</span>
                <span className="value">{data.department}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Purpose:</span>
                <span className="value">{data.purpose}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Travel Period:</span>
                <span className="value">{data.startDate} to {data.endDate}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Status:</span>
                <span className={`value ${getStatusBadgeClass(data.status, data.validationStatus, data.isCodeExpired)}`}>
                  {getStatusDisplayText(data.status, data.validationStatus, data.isCodeExpired)}
                </span>
              </div>
            </div>
            
            <div className="receipt-section">
              <h3>Remarks</h3>
              <div className="receipt-remarks">
                {data.remarks ? data.remarks.split('\n').map((remark, idx) => (
                  <p key={idx}>{remark}</p>
                )) : <p>No remarks</p>}
              </div>
            </div>
          </div>
          
          <div className="receipt-footer">
            <button className="print-button" onClick={onPrint}>
              <Printer size={16} />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add the handler function for checking expired codes
  const handleCheckExpiredCodes = async () => {
    try {
      setIsCheckingExpiredCodes(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        "http://localhost:3000/travel-requests/check-expired-codes",
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      // Refresh travel orders after updating expired codes
      const res = await axios.get("http://localhost:3000/travel-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Travel requests data:", res.data);

      const formatted = res.data.map((order) => ({
        id: order.id,
        purpose: order.purpose || "",
        status: order.status || "pending",
        validationStatus: order.validationStatus || "PENDING",
        remarks: order.remarks || "",
        startDate: order.startDate ? order.startDate.slice(0, 10) : "",
        endDate: order.endDate ? order.endDate.slice(0, 10) : "",
        teacherName: order.user
          ? `${order.user.last_name}, ${order.user.first_name}`
          : `UserID #${order.userID || "Unknown"}`,
        teacherPosition: order.user ? order.user.position || "" : "",
        teacherSchool: order.user ? order.user.school_name || "" : "",
        department: Array.isArray(order.department) 
          ? order.department.join(',') 
          : (order.department || "").toString(),
        securityCode: order.securityCode || "",
        isCodeExpired: order.isCodeExpired || false,
        user: order.user || {}
      }));

      setTravelOrders(formatted);
      setIsCheckingExpiredCodes(false);
      
      alert(`Code expiration check completed! ${response.data.expired} codes marked as expired and ${response.data.cleared} codes cleared.`);
    } catch (error) {
      console.error("Failed to check expired codes:", error);
      alert("Failed to check expired codes. Please try again.");
      setIsCheckingExpiredCodes(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="logo">
          <img
            src="/depedlogo.png?height=40&width=100"
            alt="DepEd Logo"
            className="deped-logo"
          />
          <span className="admin-header-text">Travel Authority System</span>
        </div>
        <div className="admin-actions">
          <button className="icon-button" onClick={() => setActiveView("orders")}>
            <Home className="icon" />
          </button>
          <button className="icon-button">
            <Bell className="icon" />
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <div className="admin-container">
        <div className="search-filter-container">
          <div className="search-container">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name or ID"
            />
          </div>
          <div className="filter-container">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="filter-container">
            <label htmlFor="departmentFilter">Department:</label>
            <select
              id="departmentFilter"
              value={departmentFilter}
              onChange={handleDepartmentChange}
            >
              <option value="All Departments">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="expiredFilter">
              <input
                id="expiredFilter"
                type="checkbox"
                checked={showExpiredFilter}
                onChange={(e) => setShowExpiredFilter(e.target.checked)}
              />
              Show Expired Only
            </label>
          </div>
          <div className="filter-container">
            <button 
              className={`check-expired-button ${isCheckingExpiredCodes ? 'loading' : ''}`}
              onClick={handleCheckExpiredCodes}
              disabled={isCheckingExpiredCodes}
            >
              <RefreshCw className="refresh-icon" size={16} />
              {isCheckingExpiredCodes ? 'Checking...' : 'Check Expired Codes'}
            </button>
          </div>
        </div>
        <div className="orders-container">
          <h2>{getStatusTitle()}</h2>
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`order-item ${
                  expandedId === order.id ? "expanded" : ""
                } ${order.validationStatus.toLowerCase()}`}
                onClick={() => handleOrderClick(order.id)}
              >
                <div className="order-header">
                  <span className="teacher-name">{order.teacherName}</span>
                  <span className="department-info">{order.department}</span>
                  <div className="order-status-container">
                    <span className={getStatusBadgeClass(
                      order.status, 
                      order.validationStatus, 
                      order.isCodeExpired
                    )}>
                      {getStatusDisplayText(
                        order.status, 
                        order.validationStatus, 
                        order.isCodeExpired
                      )}
                    </span>
                    <span className="order-date">
                      {order.startDate} to {order.endDate}
                    </span>
                  </div>
                </div>
                {expandedId === order.id && (
                  <div className="order-details">
                    <div className="detail-row">
                      <label>Purpose:</label>
                      <p>{order.purpose}</p>
                    </div>

                    {/* Display security code for accepted travel requests */}
                    {order.status === "accepted" && (
                      <div className="detail-row">
                        <label>Security Code:</label>
                        {order.isCodeExpired ? (
                          <p className="security-code expired">
                            {order.securityCode || "Code Expired"}
                            <span className="expired-tag">(Expired)</span>
                          </p>
                        ) : (
                          <p className="security-code">
                            {order.securityCode}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {order.remarks && order.remarks.trim() && (
                      <div className="existing-remarks">
                        <label>Existing Remarks:</label>
                        {order.remarks.split('\n').map((rem, idx) => (
                          <p key={idx} className="remarks-line">
                            {rem.trim()}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    <div className="remark-section">
                      <label htmlFor={`remark-${order.id}`}>New Remark:</label>
                      <textarea
                        id={`remark-${order.id}`}
                        value={remarkText}
                        onChange={handleRemarkChange}
                        placeholder="Add your remark here..."
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="submit-remark-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmitRemark(order.id);
                        }}
                      >
                        Submit Remark
                      </button>
                    </div>
                    
                    {order.validationStatus === "VALIDATED" && (
                      <div className="action-buttons">
                        <button
                          className="generate-receipt-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateReceipt(order);
                          }}
                        >
                          Generate Receipt
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Receipt Modal */}
      <ReceiptModal
        show={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        data={receiptData}
        onPrint={handlePrintReceipt}
      />
    </div>
  );
};

export default AOadminOfficerDashboard;
