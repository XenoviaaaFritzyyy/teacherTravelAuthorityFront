"use client"

import axios from "axios"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
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
  const [travelOrders, setTravelOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [remarkText, setRemarkText] = useState("");

  // Current user's position state
  const [userPosition, setUserPosition] = useState("");

  useEffect(() => {
    // Fetch current user's profile and set userPosition
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:3000/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User profile:", res.data); // Verify the returned object
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

        const formatted = res.data.map((order) => {
          let departmentValue;
          if (typeof order.department === "string") {
            departmentValue = order.department;
          } else if (Array.isArray(order.department)) {
            departmentValue = order.department.join(", ");
          } else {
            departmentValue = "Unknown";
          }

          return {
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
            department: departmentValue,
          };
        });

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

  // Helper: Append user's position to a remark (e.g., "Remark text - System Administrator")
  const appendPositionToRemark = (remark) => {
    return userPosition ? `${remark} - ${userPosition}` : remark;
  };

  // Helper: Combine old and new remarks using a comma separator
  const combineRemarks = (oldRemarks, newRemark) => {
    if (!oldRemarks.trim()) {
      return newRemark;
    } else {
      return `${oldRemarks}, ${newRemark}`;
    }
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
    const oldRemarks = order.remarks || "";
    const newRemarkWithPosition = appendPositionToRemark(remarkText);
    const appendedRemarks = combineRemarks(oldRemarks, newRemarkWithPosition);

    try {
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/remarks`,
        { remarks: appendedRemarks },
        getAuthHeaders()
      );
      setTravelOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === id ? { ...ord, remarks: appendedRemarks } : ord
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
      (typeof order.department === "string" &&
        order.department
          .toLowerCase()
          .split(",")
          .some((dep) => dep.trim().includes(departmentFilter.toLowerCase())));
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "PENDING":
        return "PENDING";
      case "VALIDATED":
        return "VALIDATED";
      case "REJECTED":
        return "REJECTED";
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
                        <label>Purpose:</label>
                        <p>{order.purpose}</p>
                      </div>
                      {order.remarks && order.remarks.trim() && (
                        <div className="existing-remarks">
                          <label>Existing Remarks:</label>
                          {order.remarks.split(",").map((rem, idx) => (
                            <p key={idx} className="remarks-line">{rem.trim()}</p>
                          ))}
                        </div>
                      )}
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
