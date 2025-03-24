"use client"

import { Bell, Edit, Table } from "lucide-react"
import { useState, useEffect } from "react"
import axios from "axios"
import "./SuperAdminDashboard.css"

const departments = [
  "All Departments",
  "Science",
  "Mathematics",
  "English",
  "Social Studies",
  "Physical Education",
]

const SuperAdminDashboard = () => {
  const [activeView, setActiveView] = useState("orders")
  const [travelOrders, setTravelOrders] = useState([])
  const [users, setUsers] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [departmentFilter, setDepartmentFilter] = useState("All Departments")
  const [editedUsers, setEditedUsers] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [remarkText, setRemarkText] = useState("")

  // Fetch travel requests and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch travel requests
        const ordersRes = await axios.get("http://localhost:3000/travel-requests", { headers });
        const validatedOrders = ordersRes.data.filter(order => order.validationStatus === 'VALIDATED');
        
        const formatted = validatedOrders.map((order) => ({
          id: order.id,
          purpose: order.purpose || "",
          status: order.status || "pending",
          remarks: order.remarks || "",
          startDate: order.startDate ? order.startDate.slice(0, 10) : "",
          endDate: order.endDate ? order.endDate.slice(0, 10) : "",
          teacherName: order.user
            ? `${order.user.last_name}, ${order.user.first_name}`
            : `UserID #Unknown`,
          department: order.user?.department || "Unknown",
          securityCode: order.securityCode || "",
        }));
        setTravelOrders(formatted);

        // Fetch users with complete data
        const usersRes = await axios.get("http://localhost:3000/users", { headers });
        console.log('Fetched users:', usersRes.data); // Add this for debugging
        
        // Transform the user data if needed
        const formattedUsers = usersRes.data.map(user => ({
          ...user,
          // Ensure role is properly set from the database value
          role: user.role || 'Teacher' // Default to Teacher if role is undefined
        }));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  // Filter travel orders based on status
  const filteredOrders = travelOrders.filter((order) => {
    if (statusFilter === "all") return true;
    // Match "accepted" status while showing as "approved" in UI
    return order.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleOrderClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRemarkText("");
    } else {
      setExpandedId(id);
      const order = travelOrders.find((o) => o.id === id);
      setRemarkText(order?.remarks || "");
      setDepartmentFilter(order?.department || "All Departments");
    }
  };

  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/status`,
        { status: "accepted" },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );

      if (remarkText.trim()) {
        await axios.patch(
          `http://localhost:3000/travel-requests/${id}/remarks`,
          { remarks: remarkText },
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
      }

      setTravelOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id
            ? { ...order, status: "accepted", remarks: remarkText || order.remarks }
            : order
        )
      );
      setExpandedId(null);
      alert('Travel request accepted successfully!');
    } catch (error) {
      console.error("Failed to accept travel request:", error);
      alert('Failed to accept travel request. Please try again.');
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/status`,
        { status: "rejected" },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );

      if (remarkText.trim()) {
        await axios.patch(
          `http://localhost:3000/travel-requests/${id}/remarks`,
          { remarks: remarkText },
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
      }

      setTravelOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id
            ? { ...order, status: "rejected", remarks: remarkText || order.remarks }
            : order
        )
      );
      setExpandedId(null);
      alert('Travel request rejected successfully!');
    } catch (error) {
      console.error("Failed to reject travel request:", error);
      alert('Failed to reject travel request. Please try again.');
    }
  };

  // User management handlers
  const handleUserChange = (id, field, value) => {
    setEditedUsers((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Update each edited user
      for (const [userId, updates] of Object.entries(editedUsers)) {
        await axios.put(
          `http://localhost:3000/users/${userId}`,
          updates,
          { headers }
        );
      }

      // Refresh users list
      const response = await axios.get("http://localhost:3000/users", { headers });
      setUsers(response.data);
      
      setEditedUsers({});
      setHasChanges(false);
      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "pending":
        return "PENDING"
      case "accepted":
        return "APPROVED"
      case "rejected":
        return "REJECTED"
      default:
        return "ALL TRAVEL ORDERS"
    }
  }

  // UNIVERSAL SEARCH: convert the user object to a single string and search it
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    const userString = Object.values(user).join(" ").toLowerCase()
    return userString.includes(query)
  })

  // Update the role options in the users table
  const roleOptions = [
    { value: "Teacher", label: "Teacher" },
    { value: "AO Admin", label: "AO Admin" },
    { value: "Admin", label: "Admin" }
  ];

  // Update the status filter options
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Add this new handler for password reset
  const handleResetPassword = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `http://localhost:3000/users/${userId}/reset-password`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      alert('Password has been reset to "password123". User will be required to change password on next login.');
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="super-admin-dashboard">
      <header className="admin-header">
        <div className="logo">
          <img src="/depedLogonav.png?height=40&width=100" alt="DepEd Logo" className="deped-logo" />
        </div>
        <div className="admin-nav">
          <button
            className={`nav-button ${activeView === "users" ? "active" : ""}`}
            onClick={() => setActiveView("users")}
          >
            <Table className="nav-icon" />
          </button>
          <button
            className={`nav-button ${activeView === "orders" ? "active" : ""}`}
            onClick={() => setActiveView("orders")}
          >
            <Edit className="nav-icon" />
          </button>
          <button className="nav-button">
            <Bell className="nav-icon" />
          </button>
        </div>
      </header>

      <div className="admin-container">
        <div className="filter-container">
          {activeView === "orders" ? (
            // Orders filter
            <div className="orders-filter-wrapper">
              <label htmlFor="filter">Filter:</label>
              <select
                id="filter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          ) : (
            // Users search
            <div className="users-search-wrapper">
              <label htmlFor="search">Search:</label>
              <input
                id="search"
                type="text"
                placeholder="Search for anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {activeView === "orders" ? (
          <div className="orders-container">
            <h2>{getStatusTitle()}</h2>
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`order-item ${
                    expandedId === order.id ? "expanded" : ""
                  } ${order.status.toLowerCase()}`}
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="order-header">
                    <span className="teacher-name">{order.teacherName}</span>
                    <span className="order-date">
                      {order.startDate} to {order.endDate}
                    </span>
                  </div>

                  {expandedId === order.id && (
                    <div className="order-details">
                      <div className="detail-row">
                        <div className="department-filter">
                          <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {departments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="detail-row">
                        <label>Purpose:</label>
                        <p>{order.purpose}</p>
                      </div>

                      {order.status === "accepted" && order.securityCode && (
                        <div className="detail-row">
                          <label>Security Code:</label>
                          <p className="security-code">{order.securityCode}</p>
                        </div>
                      )}

                      <div className="detail-row">
                        <label>Travel Order</label>
                      </div>

                      <div className="remark-section">
                        <label htmlFor={`remark-${order.id}`}>Remark:</label>
                        {order.remarks && (
                          <p className="existing-remarks">{order.remarks}</p>
                        )}
                        <textarea
                          id={`remark-${order.id}`}
                          value={remarkText}
                          onChange={(e) => setRemarkText(e.target.value)}
                          placeholder="Add your remark here..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="action-buttons">
                        <button
                          className="accept-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(order.id);
                          }}
                        >
                          ACCEPT
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="users-container">
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>School ID</th>
                    <th>School Name</th>
                    <th>District</th>
                    <th>Email</th>
                    <th>Position</th>
                    <th>Contact No.</th>
                    <th>Employee No.</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.username || user.username}
                          onChange={(e) => handleUserChange(user.id, "username", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="password"
                          value={editedUsers[user.id]?.password || "********"}
                          onChange={(e) => handleUserChange(user.id, "password", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.first_name || user.first_name}
                          onChange={(e) => handleUserChange(user.id, "first_name", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.last_name || user.last_name}
                          onChange={(e) => handleUserChange(user.id, "last_name", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.school_id || user.school_id}
                          onChange={(e) => handleUserChange(user.id, "school_id", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.school_name || user.school_name}
                          onChange={(e) => handleUserChange(user.id, "school_name", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.district || user.district}
                          onChange={(e) => handleUserChange(user.id, "district", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          value={editedUsers[user.id]?.email || user.email}
                          onChange={(e) => handleUserChange(user.id, "email", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.position || user.position}
                          onChange={(e) => handleUserChange(user.id, "position", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.contact_no || user.contact_no}
                          onChange={(e) => handleUserChange(user.id, "contact_no", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.employee_number || user.employee_number}
                          onChange={(e) => handleUserChange(user.id, "employee_number", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={editedUsers[user.id]?.role || user.role}
                          onChange={(e) => handleUserChange(user.id, "role", e.target.value)}
                        >
                          {roleOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="reset-password-button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (window.confirm('Are you sure you want to reset this user\'s password?')) {
                              handleResetPassword(user.id);
                            }
                          }}
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-note">
              <p>
                <strong>Note:</strong> If you wish to edit an information, make sure to highlight the particular data. 
                The system is designed a certain way that information can't be easily forgotten and manipulated for security purposes.
              </p>
            </div>

            {hasChanges && (
              <div className="save-container">
                <button className="save-button" onClick={handleSaveChanges}>
                  SAVE
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SuperAdminDashboard
