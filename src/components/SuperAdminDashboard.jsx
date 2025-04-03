"use client"

import axios from "axios"
import { Bell, Edit, Table } from "lucide-react"
import { useEffect, useState } from "react"
import "./SuperAdminDashboard.css"

// Replacing the original departments array with the one from AOadminDashboard
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

const SuperAdminDashboard = () => {
  const [activeView, setActiveView] = useState("orders")
  const [travelOrders, setTravelOrders] = useState([])
  const [users, setUsers] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [departmentFilter, setDepartmentFilter] = useState("All Departments")
  const [showExpiredFilter, setShowExpiredFilter] = useState(false) // New state for expired filter
  const [editedUsers, setEditedUsers] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [remarkText, setRemarkText] = useState("")
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [userToUpdate, setUserToUpdate] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isCheckingExpiredCodes, setIsCheckingExpiredCodes] = useState(false) // New state for loading indicator

  // Fetch travel requests and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Add this to fetch current user
        const userRes = await axios.get("http://localhost:3000/users/me", { headers });
        setCurrentUser(userRes.data);

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
          // Update department handling to match AOadminDashboard
          department: Array.isArray(order.department) 
            ? order.department.join(',') 
            : (order.department || "").toString(),
          securityCode: order.securityCode || "",
          isCodeExpired: order.isCodeExpired || false, // Make sure to include isCodeExpired
        }));
        setTravelOrders(formatted);

        // Fetch users with complete data
        const usersRes = await axios.get("http://localhost:3000/users", { headers });
        console.log('Fetched users:', usersRes.data); // Debugging
        
        // Transform the user data if needed
        const formattedUsers = usersRes.data.map(user => ({
          ...user,
          role: user.role || 'Teacher' // Default to Teacher if role is undefined
        }));
        
        setUsers(formattedUsers);
        
        // Automatically check for expired codes when the page loads
        await checkExpiredCodes();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  // Separate function to check expired codes that can be called from useEffect
  const checkExpiredCodes = async () => {
    try {
      setIsCheckingExpiredCodes(true);
      const token = localStorage.getItem('accessToken');
      await axios.post(
        "http://localhost:3000/travel-requests/check-expired-codes",
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      // Refresh travel orders after updating expired codes
      const ordersRes = await axios.get("http://localhost:3000/travel-requests", 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
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
        department: Array.isArray(order.department) 
          ? order.department.join(',') 
          : (order.department || "").toString(),
        securityCode: order.securityCode || "",
        isCodeExpired: order.isCodeExpired || false,
      }));
      
      setTravelOrders(formatted);
      setIsCheckingExpiredCodes(false);
    } catch (error) {
      console.error("Failed to check expired codes:", error);
      setIsCheckingExpiredCodes(false);
    }
  };

  // Add handler to fix specific code expiration issues
  // Removed this function

  // Filter travel orders based on status
  const filteredOrders = travelOrders.filter((order) => {
    const matchesSearch =
      order.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();

    // Updated department filtering to exactly match AOadminDashboard
    const matchesDepartment =
      departmentFilter === "All Departments" ||
      (order.department && 
       order.department.split(',').map(dep => dep.trim().toLowerCase())
         .includes(departmentFilter.toLowerCase()));
         
    // Add expired filter
    const matchesExpired = !showExpiredFilter || order.isCodeExpired;

    return matchesSearch && matchesStatus && matchesDepartment && matchesExpired;
  });

  const handleOrderClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setRemarkText("");
    } else {
      setExpandedId(id);
      setRemarkText("");
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
    if (field === "role" && value === "AO Admin") {
      const user = users.find(u => u.id === id);
      setUserToUpdate({
        id,
        currentPosition: user?.position || '',
        newRole: value
      });
      setShowPositionModal(true);
      return;
    }

    // For all other changes, update as normal
    setEditedUsers(prev => ({
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
    if (showExpiredFilter) {
      return "EXPIRED TRAVEL ORDERS";
    }
    
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

  // Add this new handler to check for expired codes
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
      const ordersRes = await axios.get("http://localhost:3000/travel-requests", 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
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
        department: Array.isArray(order.department) 
          ? order.department.join(',') 
          : (order.department || "").toString(),
        securityCode: order.securityCode || "",
        isCodeExpired: order.isCodeExpired || false,
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

  // Update the handleSubmitRemark function
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
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/remarks`,
        { remarks: updatedRemarks },
        { headers: { Authorization: `Bearer ${token}` }}
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

  // Add position change modal component
  const PositionChangeModal = ({ show, onClose, onConfirm, currentPosition }) => {
    const [newPosition, setNewPosition] = useState(currentPosition);
    const [useCustomPosition, setUseCustomPosition] = useState(false);

    if (!show) return null;

    return (
      <div className="position-modal">
        <div className="position-modal-content">
          <h3>Update Position</h3>
          <p>This user is being changed to an AO Admin role. Would you like to update their position?</p>
          
          <div className="position-selection">
            <label>
              <input
                type="checkbox"
                checked={useCustomPosition}
                onChange={(e) => setUseCustomPosition(e.target.checked)}
              />
              Use custom position
            </label>
            
            {useCustomPosition ? (
              <input
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="Enter custom position"
              />
            ) : (
              <select
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
              >
                <option value="">Select Department Position</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}
          </div>

          <div className="modal-buttons">
            <button onClick={() => onConfirm(newPosition)}>Update Position</button>
            <button onClick={() => onConfirm(currentPosition)}>Keep Current Position</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
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
              <div className="filter-group">
                <label htmlFor="statusFilter">Status:</label>
              <select
                  id="statusFilter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                  <option value="accepted">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              </div>

              <div className="filter-group">
                <label htmlFor="departmentFilter">Department:</label>
                <select
                  id="departmentFilter"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
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
              
              <div className="filter-group">
                <button 
                  className={`check-expired-button ${isCheckingExpiredCodes ? 'loading' : ''}`}
                  onClick={handleCheckExpiredCodes}
                  disabled={isCheckingExpiredCodes}
                >
                  {isCheckingExpiredCodes ? 'Checking...' : 'Check Expired Codes'}
                </button>
              </div>
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
                  className={`order-item ${expandedId === order.id ? "expanded" : ""} ${order.status.toLowerCase()} ${order.isCodeExpired ? "expired" : ""}`}
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
                        <label>Purpose:</label>
                        <p>{order.purpose}</p>
                      </div>

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

                      <div className="detail-row">
                        <label>Travel Order</label>
                      </div>

                      <div className="remark-section">
                        <label htmlFor={`remark-${order.id}`}>Remark:</label>
                        {order.remarks && order.remarks.trim() && (
                          <div className="existing-remarks">
                            {order.remarks.split('\n').map((rem, idx) => (
                              <p key={idx} className="remarks-line">
                                {rem.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                        <textarea
                          id={`remark-${order.id}`}
                          value={remarkText}
                          onChange={(e) => setRemarkText(e.target.value)}
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

                      {/* Only show action buttons if status is not accepted */}
                      {order.status !== "accepted" && (
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
                      )}
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
                        {(editedUsers[user.id]?.role === "AO Admin" || user.role === "AO Admin") ? (
                          <select
                            value={editedUsers[user.id]?.position || user.position}
                            onChange={(e) => handleUserChange(user.id, "position", e.target.value)}
                          >
                            <option value="">Select Department Position</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        ) : (
                        <input
                          type="text"
                          value={editedUsers[user.id]?.position || user.position}
                          onChange={(e) => handleUserChange(user.id, "position", e.target.value)}
                        />
                        )}
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

      {showPositionModal && (
        <PositionChangeModal
          show={showPositionModal}
          onClose={() => {
            setShowPositionModal(false);
            setUserToUpdate(null);
            // Reset the role selection in the table
            const userId = userToUpdate?.id;
            if (userId) {
              setEditedUsers(prev => ({
                ...prev,
                [userId]: {
                  ...prev[userId],
                  role: users.find(u => u.id === userId)?.role || 'Teacher'
                }
              }));
            }
          }}
          onConfirm={(newPosition) => {
            if (userToUpdate) {
              setEditedUsers(prev => ({
                ...prev,
                [userToUpdate.id]: {
                  ...prev[userToUpdate.id],
                  position: newPosition,
                  role: userToUpdate.newRole
                }
              }));
              setHasChanges(true);
            }
            setShowPositionModal(false);
            setUserToUpdate(null);
          }}
          currentPosition={userToUpdate?.currentPosition || ''}
        />
      )}
    </div>
  )
}

export default SuperAdminDashboard;
