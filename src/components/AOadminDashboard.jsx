"use client"

import axios from "axios";
import { Bell, Home, RefreshCw } from "lucide-react"; 
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "./SnackbarProvider"; // Use unified snackbar provider
import "./AOadminDashboard.css";

const departments = [
  "Accounting",
  "Administrative Office",
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [travelOrders, setTravelOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [showExpiredFilter, setShowExpiredFilter] = useState(false); 
  const [remarkText, setRemarkText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckingExpiredCodes, setIsCheckingExpiredCodes] = useState(false);
  const [activeView, setActiveView] = useState("orders");
  const [unreadCount, setUnreadCount] = useState(0);

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

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get('http://localhost:3000/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const unread = response.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
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
          department: Array.isArray(order.department) 
            ? order.department.join(',') 
            : (order.department || "").toString(),
          securityCode: order.securityCode || "",
          isCodeExpired: order.isCodeExpired || false
        }));

        setTravelOrders(formatted);
      } catch (error) {
        console.error("Failed to fetch travel orders:", error);
      }
    };

    // Initial fetches
    fetchCurrentUser();
    fetchTravelOrders();
    fetchNotifications();

    // Set up interval for notifications
    const notificationInterval = setInterval(fetchNotifications, 30000);

    // Cleanup
    return () => clearInterval(notificationInterval);
  }, []);

  // Helper: Returns auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Add this handler to check for expired codes
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
        department: Array.isArray(order.department) 
          ? order.department.join(',') 
          : (order.department || "").toString(),
        securityCode: order.securityCode || "",
        isCodeExpired: order.isCodeExpired || false
      }));

      setTravelOrders(formatted);
      setIsCheckingExpiredCodes(false);
      
      showSnackbar(`Code expiration check completed! ${response.data.expired} codes marked as expired and ${response.data.cleared} codes cleared.`, 'success');
    } catch (error) {
      console.error("Failed to check expired codes:", error);
      showSnackbar("Failed to check expired codes. Please try again.", 'error');
      setIsCheckingExpiredCodes(false);
    }
  };

  // Helper: Append user's position to a remark (e.g., "Remark text - System Administrator")
  const appendPositionToRemark = (remark) => {
    return userPosition ? `${remark} - ${currentUser?.first_name} ${currentUser?.last_name} ${userPosition}` : remark;
  };

  // Helper: Combine old and new remarks using a comma separator
  const combineRemarks = (oldRemarks, newRemark) => {
    if (!oldRemarks.trim()) {
      return newRemark;
    } else {
      return `${oldRemarks}, ${newRemark}`;
    }
  };

  // Add this helper function to check if user has permission for the order
  const hasPermissionForOrder = (order) => {
    // Allow any user with a position to add remarks, regardless of matching department
    return !!(currentUser && currentUser.position);
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

  // ===================== Handlers ===================== //

  const handleSubmitRemark = async (id) => {
    if (!remarkText.trim()) {
      showSnackbar("Please enter a remark before submitting.", 'warning');
      return;
    }

    const order = travelOrders.find((o) => o.id === id);
    if (!order) {
      showSnackbar("Could not find that travel order.", 'error');
      return;
    }

    // Format the new remark with name and position
    const newRemarkWithPosition = `${remarkText.trim()} - ${currentUser?.first_name} ${currentUser?.last_name} (${currentUser?.position || 'Unknown Position'})`;
    
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
      
      showSnackbar("Remark submitted successfully!", 'success');
      setRemarkText("");
    } catch (error) {
      console.error("Failed to submit remark:", error);
      showSnackbar("Failed to submit remark. Please try again.", 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
    window.location.reload()
  }

  // ===================== UI / Filtering ===================== //

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

  // Add notification handler
  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  const handleReject = async (id) => {
    if (!remarkText.trim()) {
      showSnackbar("Please enter remarks before rejecting.", 'warning');
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const newRemark = appendPositionToRemark(remarkText);
      const order = travelOrders.find(o => o.id === id);
      const updatedRemarks = combineRemarks(order.remarks, newRemark);

      await axios.patch(
        `http://localhost:3000/travel-requests/${id}`,
        {
          remarks: updatedRemarks,
          validationStatus: "REJECTED"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setTravelOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id
            ? {
                ...order,
                remarks: updatedRemarks,
                validationStatus: "REJECTED"
              }
            : order
        )
      );

      setRemarkText("");
      showSnackbar("Travel request rejected successfully", 'success');
    } catch (error) {
      console.error("Error rejecting travel request:", error);
      showSnackbar("Failed to reject travel request", 'error');
    }
  };

  // Add validate function
  const handleValidate = async (id) => {
    const order = travelOrders.find((o) => o.id === id);
    if (!order) return;

    try {
      // Format the remark with user info if provided
      let updatedRemarks = order.remarks;
      if (remarkText.trim()) {
        const newRemarkWithPosition = `${remarkText.trim()} - ${currentUser?.first_name} ${currentUser?.last_name} (${currentUser?.position || 'Unknown Position'})`;
        updatedRemarks = order.remarks 
          ? `${order.remarks}\n${newRemarkWithPosition}`
          : newRemarkWithPosition;
      }

      // Validate the request
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/validate`,
        { 
          validationStatus: "VALIDATED",
          remarks: updatedRemarks
        },
        getAuthHeaders()
      );

      // Update local state
      setTravelOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === id
            ? { 
                ...ord, 
                validationStatus: "VALIDATED",
                remarks: updatedRemarks
              }
            : ord
        )
      );

      // Send notification to user about validation
      if (order.user && order.user.id) {
        await axios.post(
          `http://localhost:3000/notifications`,
          {
            userId: order.user.id,
            message: `Your travel request has been validated by ${currentUser?.first_name} ${currentUser?.last_name}.`,
            type: 'CERTIFICATE_OF_APPEARANCE_APPROVED'
          },
          getAuthHeaders()
        );
      }

      setExpandedId(null);
      setRemarkText("");
      showSnackbar("Travel request validated successfully!", 'success');
    } catch (error) {
      console.error("Failed to validate travel request:", error);
      showSnackbar("Failed to validate travel request. Please try again.", 'error');
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
          <button className="icon-button" onClick={handleNotificationClick}>
            <Bell className="icon" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
              <option value="VALIDATED">Approved</option>
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
                    
                    {/* Only show remark section and action buttons if user has permission */}
                    {hasPermissionForOrder(order) ? (
                      <>
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
                      </>
                    ) : (
                      <div className="no-permission-notice">
                        <p>You don't have permission to add remarks or take actions on this request.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
