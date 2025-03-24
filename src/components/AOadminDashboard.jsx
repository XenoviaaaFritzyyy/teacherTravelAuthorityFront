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
  const [statusFilter, setStatusFilter] = useState("PENDING") // Changed from "pending" to "PENDING"
  const [departmentFilter, setDepartmentFilter] = useState("All Departments")
  const [remarkText, setRemarkText] = useState("")

  useEffect(() => {
    const fetchTravelOrders = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get("http://localhost:3000/travel-requests", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log("Travel requests data:", res.data);

        // Transform the data to fit your display needs
        const formatted = res.data.map((order) => ({
          id: order.id,
          purpose: order.purpose || "",
          status: order.status || "pending",
          validationStatus: order.validationStatus || "PENDING", // Add this line
          remarks: order.remarks || "",
          startDate: order.startDate ? order.startDate.slice(0, 10) : "",
          endDate: order.endDate ? order.endDate.slice(0, 10) : "",
          teacherName: order.user
            ? `${order.user.last_name}, ${order.user.first_name}`
            : `UserID #${order.userID || "Unknown"}`,
          department: order.user?.department || "Unknown",
        }))

        setTravelOrders(formatted)
      } catch (error) {
        console.error("Failed to fetch travel orders:", error)
      }
    }

    fetchTravelOrders()
  }, [])

  const filteredOrders = travelOrders.filter((order) => {
    const matchesSearch =
      order.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus = 
      statusFilter === "all" || 
      order.validationStatus === statusFilter; // Removed toUpperCase()
    const matchesDepartment =
      departmentFilter === "All Departments" || 
      order.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleOrderClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null)
      setRemarkText("") // Clear remark text when closing
    } else {
      setExpandedId(id)
      const order = travelOrders.find((o) => o.id === id)
      setRemarkText(order?.remarks || "") // Changed from remark to remarks
      setDepartmentFilter(order?.department || "All Departments")
    }
  }

  const handleRemarkChange = (e) => setRemarkText(e.target.value)
  const handleDepartmentChange = (e) => setDepartmentFilter(e.target.value)
  const handleStatusChange = (e) => setStatusFilter(e.target.value)
  const handleSearchChange = (e) => setSearchTerm(e.target.value)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`http://localhost:3000/travel-requests/${id}/status`, 
        { status: "accepted" },
        getAuthHeaders()
      );
      await axios.patch(`http://localhost:3000/travel-requests/${id}/remarks`, {
        remarks: remarkText,
      }, getAuthHeaders())

      setTravelOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id
            ? { ...order, status: "accepted", remark: remarkText }
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
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/validate`,
        { validationStatus: 'REJECTED' },
        getAuthHeaders()
      );

      if (remarkText.trim()) {
        await axios.patch(
          `http://localhost:3000/travel-requests/${id}/remarks`,
          { remarks: remarkText },
          getAuthHeaders()
        );
      }

      setTravelOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id
            ? { 
                ...order, 
                validationStatus: 'REJECTED',
                remarks: remarkText || order.remarks 
              }
            : order
        )
      );
      setExpandedId(null);
      alert('Travel request rejected successfully!');
    } catch (error) {
      console.error('Failed to reject travel request:', error);
      alert('Failed to reject travel request. Please try again.');
    }
  }

  const handleSubmitRemark = async (id) => {
    try {
      if (!remarkText.trim()) {
        alert('Please enter a remark before submitting.');
        return;
      }

      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/remarks`,
        { remarks: remarkText },
        getAuthHeaders()
      );

      setTravelOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id
            ? { ...order, remarks: remarkText }
            : order
        )
      );
      alert('Remark submitted successfully!');
    } catch (error) {
      console.error('Failed to submit remark:', error);
      alert('Failed to submit remark. Please try again.');
    }
  }

  const handleValidate = async (id) => {
    try {
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/validate`,
        { validationStatus: 'VALIDATED' },
        getAuthHeaders()
      );

      if (remarkText.trim()) {
        await axios.patch(
          `http://localhost:3000/travel-requests/${id}/remarks`,
          { remarks: remarkText },
          getAuthHeaders()
        );
      }

      setTravelOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === id
            ? { 
                ...order, 
                validationStatus: 'VALIDATED',
                remarks: remarkText || order.remarks 
              }
            : order
        )
      );
      setExpandedId(null);
      alert('Travel request validated successfully!');
    } catch (error) {
      console.error('Failed to validate travel request:', error);
      alert('Failed to validate travel request. Please try again.');
    }
  }

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "PENDING":
        return "PENDING"
      case "VALIDATED":
        return "VALIDATED"
      case "REJECTED":
        return "REJECTED"
      default:
        return "ALL TRAVEL ORDERS"
    }
  }

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
              <option value="PENDING">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="REJECTED">Rejected</option>
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
                  className={`order-item ${
                    expandedId === order.id ? "expanded" : ""
                  } ${order.validationStatus.toLowerCase()}`}
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

                      <div className="remark-section">
                        <label htmlFor={`remark-${order.id}`}>Remark:</label>
                        {order.remarks && ( // Add this to show existing remarks
                          <p className="existing-remarks">{order.remarks}</p>
                        )}
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
                            e.stopPropagation()
                            handleSubmitRemark(order.id)
                          }}
                        >
                          Submit Remark
                        </button>
                      </div>

                      {order.validationStatus === 'PENDING' && (
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
