"use client"

import { Bell, Edit, Table } from "lucide-react"
import { useState } from "react"
import "./SuperAdminDashboard.css"

// Mock data for travel orders
const mockTravelOrders = [
  {
    id: 1,
    teacherName: "Smith, John",
    department: "Science",
    startDate: "2024-03-20",
    endDate: "2024-03-25",
    purpose: "Science conference in Manila",
    status: "pending",
    comment: "",
    leeway: "1",
  },
  {
    id: 2,
    teacherName: "Doe, Jane",
    department: "Mathematics",
    startDate: "2024-04-05",
    endDate: "2024-04-10",
    purpose: "Mathematics workshop in Cebu",
    status: "pending",
    comment: "",
    leeway: "3",
  },
  {
    id: 3,
    teacherName: "Johnson, Robert",
    department: "English",
    startDate: "2024-03-28",
    endDate: "2024-04-02",
    purpose: "English literature seminar",
    status: "pending",
    comment: "",
    leeway: "1",
  },
]

// Mock data for users
const mockUsers = [
  {
    id: 1,
    username: "jsmith",
    password: "********",
    firstName: "John",
    lastName: "Smith",
    schoolId: "SCH001",
    schoolName: "Central Elementary School",
    district: "North District",
    email: "john.smith@school.edu",
    position: "Teacher",
    contactNo: "09123456789",
    employeeNo: "EMP001",
    role: "Teacher",
  },
  {
    id: 2,
    username: "jdoe",
    password: "********",
    firstName: "Jane",
    lastName: "Doe",
    schoolId: "SCH001",
    schoolName: "Central Elementary School",
    district: "North District",
    email: "jane.doe@school.edu",
    position: "Teacher",
    contactNo: "09123456790",
    employeeNo: "EMP002",
    role: "Teacher",
  },
  {
    id: 3,
    username: "rjohnson",
    password: "********",
    firstName: "Robert",
    lastName: "Johnson",
    schoolId: "SCH002",
    schoolName: "South High School",
    district: "South District",
    email: "robert.johnson@school.edu",
    position: "Teacher",
    contactNo: "09123456791",
    employeeNo: "EMP003",
    role: "Teacher",
  },
  {
    id: 4,
    username: "mwilliams",
    password: "********",
    firstName: "Mary",
    lastName: "Williams",
    schoolId: "SCH002",
    schoolName: "South High School",
    district: "South District",
    email: "mary.williams@school.edu",
    position: "Teacher",
    contactNo: "09123456792",
    employeeNo: "EMP004",
    role: "Teacher",
  },
  {
    id: 5,
    username: "dbrown",
    password: "********",
    firstName: "David",
    lastName: "Brown",
    schoolId: "SCH003",
    schoolName: "East Elementary School",
    district: "East District",
    email: "david.brown@school.edu",
    position: "Teacher",
    contactNo: "09123456793",
    employeeNo: "EMP005",
    role: "Teacher",
  },
  {
    id: 6,
    username: "mgarcia",
    password: "********",
    firstName: "Maria",
    lastName: "Garcia",
    schoolId: "SCH003",
    schoolName: "East Elementary School",
    district: "East District",
    email: "maria.garcia@school.edu",
    position: "Teacher",
    contactNo: "09123456794",
    employeeNo: "EMP006",
    role: "Teacher",
  },
  {
    id: 7,
    username: "jlee",
    password: "********",
    firstName: "James",
    lastName: "Lee",
    schoolId: "SCH004",
    schoolName: "West High School",
    district: "West District",
    email: "james.lee@school.edu",
    position: "Teacher",
    contactNo: "09123456795",
    employeeNo: "EMP007",
    role: "Teacher",
  },
  {
    id: 8,
    username: "aadmin",
    password: "********",
    firstName: "Admin",
    lastName: "User",
    schoolId: "ADMIN",
    schoolName: "Department of Education",
    district: "Central",
    email: "admin@deped.gov",
    position: "Administrator",
    contactNo: "09123456796",
    employeeNo: "ADM001",
    role: "Admin",
  },
  {
    id: 9,
    username: "superadmin",
    password: "********",
    firstName: "Super",
    lastName: "Admin",
    schoolId: "ADMIN",
    schoolName: "Department of Education",
    district: "Central",
    email: "superadmin@deped.gov",
    position: "Super Administrator",
    contactNo: "09123456797",
    employeeNo: "ADM002",
    role: "SuperAdmin",
  },
]

// Department options for filtering
const departments = ["All Departments", "Science", "Mathematics", "English", "Social Studies", "Physical Education"]

const SuperAdminDashboard = () => {
  const [activeView, setActiveView] = useState("orders") // "orders" or "users"
  const [travelOrders, setTravelOrders] = useState(mockTravelOrders)
  const [users, setUsers] = useState(mockUsers)
  const [expandedId, setExpandedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [departmentFilter, setDepartmentFilter] = useState("All Departments")
  const [editedUsers, setEditedUsers] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Filter travel orders based on status
  const filteredOrders = travelOrders.filter((order) => {
    return statusFilter === "all" || order.status === statusFilter
  })

  

  const handleOrderClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      // Find the order and set department if it exists
      const order = travelOrders.find((o) => o.id === id)
      setDepartmentFilter(order?.department || "All Departments")
    }
  }

  const handleDepartmentChange = (e) => {
    setDepartmentFilter(e.target.value)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
  }

  const handleSendOrder = (id) => {
    setTravelOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === id ? { ...order, status: "approved" } : order)),
    )
    setExpandedId(null)
  }

  const handleUserChange = (id, field, value) => {
    setEditedUsers((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleSaveChanges = () => {
    // Apply all changes to the users
    const updatedUsers = users.map((user) => {
      if (editedUsers[user.id]) {
        return { ...user, ...editedUsers[user.id] }
      }
      return user
    })

    setUsers(updatedUsers)
    setEditedUsers({})
    setHasChanges(false)
    alert("Changes saved successfully!")
  }

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "pending":
        return "PENDING"
      case "approved":
        return "APPROVED"
      case "rejected":
        return "REJECTED"
      default:
        return "ALL TRAVEL ORDERS"
    }
  }

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
          <label htmlFor="filter">Filter:</label>
          <select
            id="filter"
            value={activeView === "orders" ? statusFilter : "all"}
            onChange={activeView === "orders" ? handleStatusFilterChange : null}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {activeView === "orders" ? (
          <div className="orders-container">
            <h2>{getStatusTitle()}</h2>
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`order-item ${expandedId === order.id ? "expanded" : ""}`}
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="order-header">
                    <span className="teacher-name">{order.teacherName}</span>
                    <span className="order-date">{order.startDate}</span>
                  </div>

                  {expandedId === order.id && (
                    <div className="order-details">
                      <div className="detail-row">
                        <div className="department-filter">
                          <select
                            value={departmentFilter}
                            onChange={handleDepartmentChange}
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
                        <label>Travel Order</label>
                      </div>

                      <div className="action-buttons">
                        <button
                          className="send-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendOrder(order.id)
                          }}
                        >
                          SEND
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
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
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
                          value={editedUsers[user.id]?.password || user.password}
                          onChange={(e) => handleUserChange(user.id, "password", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.firstName || user.firstName}
                          onChange={(e) => handleUserChange(user.id, "firstName", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.lastName || user.lastName}
                          onChange={(e) => handleUserChange(user.id, "lastName", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.schoolId || user.schoolId}
                          onChange={(e) => handleUserChange(user.id, "schoolId", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.schoolName || user.schoolName}
                          onChange={(e) => handleUserChange(user.id, "schoolName", e.target.value)}
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
                          value={editedUsers[user.id]?.contactNo || user.contactNo}
                          onChange={(e) => handleUserChange(user.id, "contactNo", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editedUsers[user.id]?.employeeNo || user.employeeNo}
                          onChange={(e) => handleUserChange(user.id, "employeeNo", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={editedUsers[user.id]?.role || user.role}
                          onChange={(e) => handleUserChange(user.id, "role", e.target.value)}
                        >
                          <option value="Teacher">Teacher</option>
                          <option value="Admin">Admin</option>
                          <option value="SuperAdmin">SuperAdmin</option>
                        </select>
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

