"use client"

import axios from "axios"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./AOadminDashboard.css"

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [travelOrders, setTravelOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [showExpiredFilter, setShowExpiredFilter] = useState(false); 
  const [remarkText, setRemarkText] = useState("");
  const [isCheckingExpiredCodes, setIsCheckingExpiredCodes] = useState(false);

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

    fetchCurrentUser();
    fetchTravelOrders();
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
      setIsCheckingExpiredCodes(false);
      
      alert(`Code expiration check completed! ${response.data.expired} codes marked as expired and ${response.data.cleared} codes cleared.`);
    } catch (error) {
      console.error("Failed to check expired codes:", error);
      alert("Failed to check expired codes. Please try again.");
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
    if (!currentUser || !currentUser.position || !order.department) {
      return false;
    }

    // Get array of departments from the order
    const orderDepartments = order.department.split(',').map(dep => dep.trim().toLowerCase());
    
    // Check if user's position matches any of the order's departments
    return orderDepartments.includes(currentUser.position.toLowerCase());
  };

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
      
      alert("Remark submitted successfully!");
      setRemarkText("");
    } catch (error) {
      console.error("Failed to submit remark:", error);
      alert("Failed to submit remark. Please try again.");
    }
  };

  const handleReject = async (id) => {
    const order = travelOrders.find((o) => o.id === id);
    if (!order) return;

    const oldRemarks = order.remarks || "";
    const newRemarkWithPosition = appendPositionToRemark(remarkText);
    const appendedRemarks = remarkText.trim()
      ? combineRemarks(oldRemarks, newRemarkWithPosition)
      : oldRemarks;

    try {
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/validate`,
        { validationStatus: "REJECTED" },
        getAuthHeaders()
      );
      if (remarkText.trim()) {
        await axios.patch(
          `http://localhost:3000/travel-requests/${id}/remarks`,
          { remarks: appendedRemarks },
          getAuthHeaders()
        );
      }
      setTravelOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === id
            ? { ...ord, validationStatus: "REJECTED", remarks: appendedRemarks }
            : ord
        )
      );
      setExpandedId(null);
      alert("Travel request rejected successfully!");
      setRemarkText("");
    } catch (error) {
      console.error("Failed to reject travel request:", error);
      alert("Failed to reject travel request. Please try again.");
    }
  };

  const handleValidate = async (id) => {
    const order = travelOrders.find((o) => o.id === id);
    if (!order) return;

    const oldRemarks = order.remarks || "";
    const newRemarkWithPosition = appendPositionToRemark(remarkText);
    const appendedRemarks = remarkText.trim()
      ? combineRemarks(oldRemarks, newRemarkWithPosition)
      : oldRemarks;

    try {
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/validate`,
        { validationStatus: "VALIDATED" },
        getAuthHeaders()
      );
      if (remarkText.trim()) {
        await axios.patch(
          `http://localhost:3000/travel-requests/${id}/remarks`,
          { remarks: appendedRemarks },
          getAuthHeaders()
        );
      }
      setTravelOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === id
            ? { ...ord, validationStatus: "VALIDATED", remarks: appendedRemarks }
            : ord
        )
      );
      setExpandedId(null);
      alert("Travel request validated successfully!");
      setRemarkText("");
    } catch (error) {
      console.error("Failed to validate travel request:", error);
      alert("Failed to validate travel request. Please try again.");
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

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="logo">
          <img
            src="/depedLogonav.png?height=40&width=100"
            alt="DepEd Logo"
            className="deped-logo"
          />
        </div>
        <div className="admin-actions">
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
          {currentUser && currentUser.role === 'admin' && (
            <div className="filter-container">
              <button 
                className={`check-expired-button ${isCheckingExpiredCodes ? 'loading' : ''}`}
                onClick={handleCheckExpiredCodes}
                disabled={isCheckingExpiredCodes}
              >
                {isCheckingExpiredCodes ? 'Checking...' : 'Check Expired Codes'}
              </button>
            </div>
          )}
        </div>
        <div className="orders-container">
          <h2>{getStatusTitle()}</h2>
          <div className="orders-list">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
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
                    <span className="order-date">
                      {order.startDate} to {order.endDate}
                    </span>
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
                          {order.validationStatus === "PENDING" && (
                            <div className="action-buttons">
                              <button
                                className="validate-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleValidate(order.id);
                                }}
                              >
                                VALIDATE
                              </button>
                              <button
                                className="reject-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(order.id);
                                }}
                              >
                                REJECT
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="no-permission-notice">
                          <p>You don't have permission to add remarks or take actions on this request.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-orders">
                <p>No travel orders found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
