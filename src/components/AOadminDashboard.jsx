// AdminDashboard.jsx
"use client"

import { Bell } from "lucide-react"
import { useState, useEffect } from "react"
import axios from "axios"
import "./AOadminDashboard.css"

// Departments for the dropdown
const departments = [
  "All Departments",
  "Science",
  "Mathematics",
  "English",
  "Social Studies",
  "Physical Education",
]

const AdminDashboard = () => {
  const [travelOrders, setTravelOrders] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending") // default to "pending"
  const [departmentFilter, setDepartmentFilter] = useState("All Departments")
  const [commentText, setCommentText] = useState("")

  useEffect(() => {
    const fetchTravelOrders = async () => {
      try {
        // Updated: now using port 3000 instead of 3306
        const res = await axios.get("http://localhost:3000/travel-requests")

        console.log("Travel requests data:", res.data)

        // Transform the data to fit your display needs
        const formatted = res.data.map((order) => ({
          // Basic fields
          id: order.id,
          purpose: order.purpose || "",
          status: order.status || "pending",
          comment: order.remarks || "",
          leeway: "1", // Hard-coded for demonstration

          // Start/End date
          startDate: order.startDate ? order.startDate.slice(0, 10) : "",
          endDate: order.endDate ? order.endDate.slice(0, 10) : "",

          // Fallback to userID if user object doesn't exist
          teacherName: order.user
            ? `${order.user.last_name}, ${order.user.first_name}`
            : `UserID #${order.userID || "Unknown"}`,

          // Department also depends on user object
          department: order.user?.department || "Unknown",
        }))

        setTravelOrders(formatted)
      } catch (error) {
        console.error("Failed to fetch travel orders:", error)
      }
    }

    fetchTravelOrders()
  }, [])

  // Filter logic for search, status, department
  const filteredOrders = travelOrders.filter((order) => {
    const matchesSearch =
      order.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm)
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesDepartment =
      departmentFilter === "All Departments" || order.department === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  // Expand/Collapse the detail view
  const handleOrderClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      const order = travelOrders.find((o) => o.id === id)
      // Populate comment box with the existing remarks
      setCommentText(order?.comment || "")
      // Show department of the selected order in the dropdown
      setDepartmentFilter(order?.department || "All Departments")
    }
  }

  // Handlers for input changes
  const handleCommentChange = (e) => setCommentText(e.target.value)
  const handleDepartmentChange = (e) => setDepartmentFilter(e.target.value)
  const handleStatusChange = (e) => setStatusFilter(e.target.value)
  const handleSearchChange = (e) => setSearchTerm(e.target.value)

  // Accept/Reject travel request
  const handleAccept = async (id) => {
    try {
      await axios.patch(`http://localhost:3000/travel-requests/${id}/status`, {
        status: "accepted",
      })
      await axios.patch(`http://localhost:3000/travel-requests/${id}/remarks`, {
        remarks: commentText,
      })

      // Update state so UI reflects the new status/comment
      setTravelOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id
            ? { ...order, status: "accepted", comment: commentText }
            : order
        )
      )
      setExpandedId(null)
    } catch (error) {
      console.error("Failed to accept travel request:", error)
    }
  }

  const handleReject = async (id) => {
    try {
      await axios.patch(`http://localhost:3000/travel-requests/${id}/status`, {
        status: "rejected",
      })
      await axios.patch(`http://localhost:3000/travel-requests/${id}/remarks`, {
        remarks: commentText,
      })

      // Update state so UI reflects the new status/comment
      setTravelOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id
            ? { ...order, status: "rejected", comment: commentText }
            : order
        )
      )
      setExpandedId(null)
    } catch (error) {
      console.error("Failed to reject travel request:", error)
    }
  }

  // Display a title based on the current filter
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
      {/* Header */}
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
        </div>
      </header>

      {/* Main Container */}
      <div className="admin-container">
        {/* Search & Filter */}
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

        {/* Travel Orders List */}
        <div className="orders-container">
          <h2>{getStatusTitle()}</h2>
          <div className="orders-list">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`order-item ${
                    expandedId === order.id ? "expanded" : ""
                  } ${order.status}`}
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="order-header">
                    <span className="teacher-name">{order.teacherName}</span>
                    <span className="order-date">
                      {order.startDate} to {order.endDate}
                    </span>
                  </div>

                  {/* Expanded details */}
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
