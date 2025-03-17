"use client"

import { Bell } from "lucide-react"
import { useState } from "react"
import "./AOadminDashboard.css"

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
  {
    id: 4,
    teacherName: "Williams, Mary",
    department: "Social Studies",
    startDate: "2024-04-15",
    endDate: "2024-04-20",
    purpose: "History conference",
    status: "pending",
    comment: "",
    leeway: "5",
  },
  {
    id: 5,
    teacherName: "Brown, David",
    department: "Physical Education",
    startDate: "2024-05-01",
    endDate: "2024-05-05",
    purpose: "Sports coaching workshop",
    status: "pending",
    comment: "",
    leeway: "3",
  },
  {
    id: 6,
    teacherName: "Garcia, Maria",
    department: "Science",
    startDate: "2024-03-15",
    endDate: "2024-03-18",
    purpose: "Biology seminar",
    status: "accepted",
    comment: "Approved as requested. Travel budget allocated.",
    leeway: "1",
  },
  {
    id: 7,
    teacherName: "Lee, James",
    department: "Mathematics",
    startDate: "2024-02-25",
    endDate: "2024-03-01",
    purpose: "Statistics workshop",
    status: "rejected",
    comment: "Rejected due to scheduling conflict with department evaluation.",
    leeway: "3",
  },
]

// Department options for filtering
const departments = ["All Departments", "Science", "Mathematics", "English", "Social Studies", "Physical Education"]

const AdminDashboard = () => {
  const [travelOrders, setTravelOrders] = useState(mockTravelOrders)
  const [expandedId, setExpandedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [departmentFilter, setDepartmentFilter] = useState("All Departments")
  const [commentText, setCommentText] = useState("")

  // Filter travel orders based on search term, status, and department
  const filteredOrders = travelOrders.filter((order) => {
    const matchesSearch =
      order.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) || order.id.toString().includes(searchTerm)
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesDepartment = departmentFilter === "All Departments" || order.department === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  const handleOrderClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      // Find the order and set the comment text if it exists
      const order = travelOrders.find((o) => o.id === id)
      setCommentText(order?.comment || "")
      setDepartmentFilter(order?.department || "All Departments")
    }
  }

  const handleCommentChange = (e) => {
    setCommentText(e.target.value)
  }

  const handleDepartmentChange = (e) => {
    setDepartmentFilter(e.target.value)
  }

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleAccept = (id) => {
    setTravelOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === id ? { ...order, status: "accepted", comment: commentText } : order)),
    )
    setExpandedId(null)
  }

  const handleReject = (id) => {
    setTravelOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === id ? { ...order, status: "rejected", comment: commentText } : order)),
    )
    setExpandedId(null)
  }

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "pending":
        return "PENDING"
      case "accepted":
        return "ACCEPTED"
      case "rejected":
        return "REJECTED"
      default:
        return "ALL TRAVEL ORDERS"
    }
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="logo">
          <img src="/depedLogonav.png?height=40&width=100" alt="DepEd Logo" className="deped-logo" />
        </div>
        <div className="admin-actions">
          <button className="icon-button">
            <Bell className="icon" />
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
            <label htmlFor="statusFilter">Filter:</label>
            <select id="statusFilter" value={statusFilter} onChange={handleStatusChange}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="orders-container">
          <h2>{getStatusTitle()}</h2>
          <div className="orders-list">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`order-item ${expandedId === order.id ? "expanded" : ""} ${order.status}`}
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
                        <label>Purpose:</label>
                        <p>{order.purpose}</p>
                      </div>

                      <div className="detail-row">
                        <label>Leeway:</label>
                        <p>
                          {order.leeway} {order.leeway === "1" ? "day" : "days"}
                        </p>
                      </div>

                      <div className="comment-section">
                        <label htmlFor={`comment-${order.id}`}>Comment:</label>
                        <textarea
                          id={`comment-${order.id}`}
                          value={commentText}
                          onChange={handleCommentChange}
                          placeholder="Add your comment here..."
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="action-buttons">
                        <button
                          className="accept-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAccept(order.id)
                          }}
                        >
                          ACCEPT
                        </button>
                        <button
                          className="reject-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReject(order.id)
                          }}
                        >
                          REJECT
                        </button>
                      </div>
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
  )
}

export default AdminDashboard

