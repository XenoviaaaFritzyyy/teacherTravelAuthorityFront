"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSnackbar } from 'notistack';
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
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null)

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

  // User management handlers
  const handleUserChange = (id, field, value) => {
    if (field === "role" && 
        (value === "AO Admin" || 
         value === "AO Admin Officer" ||
         value === "PSDS" || 
         value === "ASDS" ||
         value === "SDS")) {
      const user = users.find(u => u.id === id);
      setUserToUpdate({
        id,
        currentPosition: user?.position || '',
        newRole: value
      });
      setShowPositionModal(true);
      return;
    }

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
      enqueueSnackbar("Changes saved successfully!", { variant: 'success' });
    } catch (error) {
      console.error("Failed to save changes:", error);
      enqueueSnackbar("Failed to save changes. Please try again.", { variant: 'error' });
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
    { value: "AO Admin Officer", label: "Department Officer" },
    { value: "AO Admin", label: "Administrative Officer" },
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
      enqueueSnackbar('Password has been reset to "password123". User will be required to change password on next login.', { variant: 'info' });
    } catch (error) {
      console.error("Failed to reset password:", error);
      enqueueSnackbar("Failed to reset password. Please try again.", { variant: 'error' });
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
          <p>This user's role is being changed. Would you like to update their position?</p>
          
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
    window.location.reload()
  }


  return (
    <div className="super-admin-dashboard">
      <header className="admin-header">
        <div className="logo">
          <img src="/depedlogo.png?height=40&width=100" alt="DepEd Logo" className="deped-logo" />
          <span className="admin-header-text">Travel Authority System</span>
        </div>
        <div className="admin-nav">
          <div className="admin-actions">
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-container">
        {/* Remove orders filter and keep only users search */}
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

        {/* Keep only the users table section */}
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
                      {(editedUsers[user.id]?.role === "AO Admin" || 
                        editedUsers[user.id]?.role === "AO Admin Officer" ||
                        editedUsers[user.id]?.role === "PSDS" || 
                        editedUsers[user.id]?.role === "ASDS" || 
                        user.role === "AO Admin" ||
                        user.role === "AO Admin Officer" ||
                        user.role === "PSDS" ||
                        user.role === "ASDS" ||
                        user.role === "SDS") ? (
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
