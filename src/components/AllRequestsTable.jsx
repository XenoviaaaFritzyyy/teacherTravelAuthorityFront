import { useState, useEffect } from "react";
import axios from "axios";
import "./AllRequestsTable.css";

const AllRequestsTable = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const fetchAllRequests = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("accessToken");
        
        // Use existing endpoint to get all requests
        const response = await axios.get(
          "http://localhost:3000/travel-requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const formattedRequests = response.data.map((request) => ({
          id: request.id,
          teacherName: request.user ? `${request.user.last_name}, ${request.user.first_name}` : "Unknown",
          userRole: request.user ? request.user.role : "Unknown",
          purpose: request.purpose || "",
          startDate: request.startDate ? new Date(request.startDate).toLocaleDateString() : "",
          endDate: request.endDate ? new Date(request.endDate).toLocaleDateString() : "",
          status: request.validationStatus || "PENDING",
          isExpired: request.isCodeExpired || false,
          securityCode: request.securityCode || "N/A",
          createdAt: request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "",
        }));
        
        setRequests(formattedRequests);
      } catch (error) {
        console.error("Error fetching all requests:", error);
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllRequests();
  }, []);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredRequests = requests.filter((request) => {
    // Filter by status
    if (statusFilter !== "all" && request.status !== statusFilter) {
      return false;
    }
    
    // Filter by role
    if (roleFilter !== "all" && request.userRole !== roleFilter) {
      return false;
    }
    
    // Check for search term in teacher name or purpose
    const searchTermLower = searchTerm.toLowerCase();
    const teacherNameMatch = request.teacherName.toLowerCase().includes(searchTermLower);
    const purposeMatch = request.purpose.toLowerCase().includes(searchTermLower);
    
    return teacherNameMatch || purposeMatch;
  });

  // Get unique roles for the role filter dropdown
  const uniqueRoles = [...new Set(requests.map(req => req.userRole))].sort();

  const getStatusClass = (status, isExpired) => {
    if (isExpired) return "status-expired";
    
    switch (status) {
      case "VALIDATED":
        return "status-validated";
      case "REJECTED":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  const formatRoleDisplayName = (role) => {
    if (!role) return "Unknown";
    
    // Convert underscore naming to readable format with capitalization
    return role
      .split("_")
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (isLoading) {
    return <div className="requests-loading">Loading requests...</div>;
  }

  return (
    <div className="all-requests-container">
      <div className="filter-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or purpose"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-group">
          <div className="status-filter">
            <select value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="role-filter">
            <select value={roleFilter} onChange={handleRoleFilterChange}>
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {formatRoleDisplayName(role)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="no-requests">
          <p>No requests found matching your criteria.</p>
        </div>
      ) : (
        <div className="requests-table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Requester</th>
                <th>Role</th>
                <th>Purpose</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Security Code</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.teacherName}</td>
                  <td>{formatRoleDisplayName(request.userRole)}</td>
                  <td>{request.purpose}</td>
                  <td>{request.startDate}</td>
                  <td>{request.endDate}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(request.status, request.isExpired)}`}>
                      {request.isExpired ? "EXPIRED" : request.status}
                    </span>
                  </td>
                  <td className={request.isExpired ? "code-expired" : ""}>
                    {request.securityCode}
                    {request.isExpired && <span className="expired-tag">(Expired)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllRequestsTable; 