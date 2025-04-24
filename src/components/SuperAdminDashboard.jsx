"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSnackbar } from './SnackbarProvider'; // Correct import
import "./SuperAdminDashboard.css"
import { Bell, Home, RefreshCw, Users } from "lucide-react";

// Replacing the original departments array with the one from AOadminDashboard
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

// List of all districts
const districtOptions = [
  "Alcantara","Alcoy","Alegria","Aloguinsan","Argao I","Argao II","Asturias I",
  "Asturias II","Badian","Balamban I","Balamban II","Bantayan I","Bantayan II","Barili I",
  "Barili II","Boljoon","Borbon","Carmen","Catmon","Compostela","Consolacion I","Consolacion II",
  "Cordova","Dalaguete I","Dalaguete II","Daanbantayan I","Daanbantayan II","Dumanjug I","Dumanjug II",
  "Ginatilan","Liloan","Madridejos","Malabuyoc","Medellin","Minglanilla I","Minglanilla II","Moalboal","Oslob","Pilar",
  "Pinamungajan I","Pinamungajan II","Poro","Ronda","Samboan","San Fernando I","San Fernando II","San Francisco",
  "San Remigio I","San Remigio II","Santa Fe","Santander","Sibonga","Sogod","Tabogon","Tabuelan","Tuburan I","Tuburan II","Tudela"
];

const SuperAdminDashboard = () => {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  // District editing state
  const [editingDistrictUserId, setEditingDistrictUserId] = useState(null);
  const [editingDistrictValue, setEditingDistrictValue] = useState("");
  const [editedUsers, setEditedUsers] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null)
  const [activeView, setActiveView] = useState("users");
  const [travelOrders, setTravelOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [showExpiredFilter, setShowExpiredFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isCheckingExpiredCodes, setIsCheckingExpiredCodes] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Add this to fetch current user
        const userRes = await axios.get("http://localhost:3000/users/me", { headers });
        setCurrentUser(userRes.data);

        // Fetch users with complete data
        const usersRes = await axios.get("http://localhost:3000/users", { headers });
        console.log('Fetched users:', usersRes.data); // Debugging
        
        // Transform the user data if needed
        const formattedUsers = usersRes.data.map(user => ({
          ...user,
          role: user.role || 'Teacher' // Default to Teacher if role is undefined
        }));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  // Add fetch travel orders effect
  useEffect(() => {
    const fetchTravelOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken");
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
        showSnackbar("Failed to fetch travel orders", 'error');
      }
    };

    if (activeView === "orders") {
      fetchTravelOrders();
    }
  }, [activeView]);

  // User management handlers
  const handleUserChange = (id, field, value) => {
    // If changing role to AO Admin Officer (Administrative Officer)
    if (field === "role" && value === "AO Admin Officer") {
      // Instead of automatically setting position, show the modal with admin officer positions
      const user = users.find(u => u.id === id);
      setUserToUpdate({
        id,
        currentPosition: user?.position || '',
        newRole: value,
        isAdminOfficer: true // Flag to indicate this is for admin officer selection
      });
      setShowPositionModal(true);
      return;
    }
    
    // If role is AO Admin (Department Officer), show department position modal
    if (field === "role" && value === "AO Admin") {
      const user = users.find(u => u.id === id);
      setUserToUpdate({
        id,
        currentPosition: user?.position || '',
        newRole: value,
        isAdminOfficer: false // Flag to indicate this is for department selection
      });
      setShowPositionModal(true);
      return;
    }

    // For all other changes, handle normally
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
      showSnackbar("Changes saved successfully!", 'success');
    } catch (error) {
      console.error("Failed to save changes:", error);
      showSnackbar("Failed to save changes. Please try again.", 'error');
    }
  };

  // UNIVERSAL SEARCH: convert the user object to a single string and search it
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    const userString = Object.values(user).join(" ").toLowerCase()
    return userString.includes(query)
  })

  // Update the role options in the users table
  const roleOptions = [
    { value: "Teacher", label: "Teacher" },
    { value: "Principal", label: "Principal" },
    { value: "PSDS", label: "PSDS" },
    { value: "ASDS", label: "ASDS" },
    { value: "SDS", label: "SDS" },
    { value: "AO Admin Officer", label: "Administrative Officer" },
    { value: "AO Admin", label: "Department Officer" },
    { value: "Admin", label: "Admin" }
  ];

  // Add this new handler for password reset
  const handleResetPassword = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `http://localhost:3000/users/${userId}/reset-password`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      showSnackbar('Password has been reset to "password123". User will be required to change password on next login.', 'info');
    } catch (error) {
      console.error("Failed to reset password:", error);
      showSnackbar("Failed to reset password. Please try again.", 'error');
    }
  };

  // Add position change modal component
  const PositionChangeModal = ({ show, onClose, onConfirm, currentPosition }) => {
    const [newPosition, setNewPosition] = useState(currentPosition);
    const [useCustomPosition, setUseCustomPosition] = useState(false);

    if (!show) return null;

    // Determine if we're selecting an Administrative Officer position
    const isAdminOfficer = userToUpdate?.isAdminOfficer || false;
    const title = isAdminOfficer ? "Select Administrative Officer Position" : "Update Position";
    const positionOptions = isAdminOfficer ? adminOfficerPositions : departments;
    const promptText = isAdminOfficer 
      ? "Select the specific Administrative Officer position for this user:"
      : "This user's role is being changed. Would you like to update their position?";

    return (
      <div className="position-modal">
        <div className="position-modal-content">
          <h3>{title}</h3>
          <p>{promptText}</p>
          
          <div className="position-selection">
            {!isAdminOfficer && (
              <label>
                <input
                  type="checkbox"
                  checked={useCustomPosition}
                  onChange={(e) => setUseCustomPosition(e.target.checked)}
                />
                Use custom position
              </label>
            )}
            
            {(useCustomPosition && !isAdminOfficer) ? (
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
                <option value="">{isAdminOfficer ? "Select Officer Position" : "Select Department Position"}</option>
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            )}
          </div>

          <div className="modal-buttons">
            <button onClick={() => onConfirm(newPosition)}>Update Position</button>
            {!isAdminOfficer && (
              <button onClick={() => onConfirm(currentPosition)}>Keep Current Position</button>
            )}
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
    window.location.reload()
  }

  // Add handlers for travel orders
  const handleStatusChange = (e) => setStatusFilter(e.target.value);
  const handleDepartmentChange = (e) => setDepartmentFilter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleOrderClick = (id) => setExpandedId(expandedId === id ? null : id);

  // Add filter function for travel orders
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
    if (showExpiredFilter) return "EXPIRED TRAVEL ORDERS";
    switch (statusFilter) {
      case "PENDING": return "PENDING TRAVEL ORDERS";
      case "VALIDATED": return "VALIDATED TRAVEL ORDERS";
      case "REJECTED": return "REJECTED TRAVEL ORDERS";
      default: return "ALL TRAVEL ORDERS";
    }
  };

  // Add check expired codes handler
  const handleCheckExpiredCodes = async () => {
    try {
      setIsCheckingExpiredCodes(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        "http://localhost:3000/travel-requests/check-expired-codes",
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      // Refresh travel orders
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
      
      showSnackbar(`Code expiration check completed! ${response.data.expired} codes marked as expired and ${response.data.cleared} codes cleared.`, 'success');
    } catch (error) {
      console.error("Failed to check expired codes:", error);
      showSnackbar("Failed to check expired codes. Please try again.", 'error');
      setIsCheckingExpiredCodes(false);
    }
  };

  const handleEditDistrict = (userId, currentDistrict) => {
    setEditingDistrictUserId(userId);
    setEditingDistrictValue(currentDistrict || "");
  };

  const handleSaveDistrict = (userId) => {
    setEditedUsers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        district: editingDistrictValue
      }
    }));
    setHasChanges(true);
    setEditingDistrictUserId(null);
    setEditingDistrictValue("");
  };

  const handleCancelEditDistrict = () => {
    setEditingDistrictUserId(null);
    setEditingDistrictValue("");
  };

  return (
    <div className="super-admin-dashboard">
      <header className="admin-header">
        <div className="logo">
          <img src="/depedlogo.png?height=40&width=100" alt="DepEd Logo" className="deped-logo" />
          <span className="admin-header-text">Travel Authority System</span>
        </div>
        <div className="admin-nav">
          <div className="admin-actions">
            <button 
              className={`icon-button ${activeView === "orders" ? "active" : ""}`} 
              onClick={() => setActiveView("orders")}
            >
              <Home className="icon" />
            </button>
            <button 
              className={`icon-button ${activeView === "users" ? "active" : ""}`}
              onClick={() => setActiveView("users")}
            >
              <Users className="icon" />
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-container">
        {activeView === "users" ? (
          <>
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
            <div className="users-container">
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
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
                        <select
                            value={editedUsers[user.id]?.district || user.district || ""}
                            onChange={e => handleUserChange(user.id, "district", e.target.value)}
                          >
                            {user.district && !districtOptions.includes(user.district) && (
                              <option value={user.district} disabled>
                                {user.district} (not in options)
                              </option>
                            )}
                            <option value="">Select District</option>
                            {districtOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="email"
                            value={editedUsers[user.id]?.email || user.email}
                            onChange={(e) => handleUserChange(user.id, "email", e.target.value)}
                          />
                        </td>
                        <td>
                          {(editedUsers[user.id]?.role === "AO Admin" || 
                            user.role === "AO Admin") ? (
                              <select
                                value={editedUsers[user.id]?.position || user.position}
                                onChange={(e) => handleUserChange(user.id, "position", e.target.value)}
                              >
                                <option value="">Select Department Position</option>
                                {departments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            ) : (editedUsers[user.id]?.role === "AO Admin Officer" || 
                                user.role === "AO Admin Officer") ? (
                              // For Administrative Officers, show position if already set, or "Set position" prompt
                              <div style={{ backgroundColor: "#f0f0f0", padding: "8px", borderRadius: "4px" }}>
                                {(editedUsers[user.id]?.position || user.position) || 
                                  "Click Role dropdown to set specific Admin Officer position"}
                              </div>
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
          </>
        ) : (
          <>
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
                        <span className={`status-badge ${order.validationStatus.toLowerCase()}`}>
                          {order.validationStatus}
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
                            <label>Remarks:</label>
                            {order.remarks.split('\n').map((rem, idx) => (
                              <p key={idx} className="remarks-line">
                                {rem.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
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
