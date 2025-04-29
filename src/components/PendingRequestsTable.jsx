import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useSnackbar } from "./SnackbarProvider"; // Use unified snackbar provider
import "./PendingRequestsTable.css";
import apiConfig from '../config/api';

const PendingRequestsTable = ({ onUnviewedCountChange }) => {
  const { user } = useUser();
  const { showSnackbar } = useSnackbar(); // Add this destructuring to get showSnackbar
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [remarkText, setRemarkText] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [unviewedCount, setUnviewedCount] = useState(0);

  // Get auth headers for API requests
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  // Fetch pending requests that this user needs to validate
  useEffect(() => {
    // Only fetch if we have a user
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          `${apiConfig.endpoints.travelRequests.pending}`,
          getAuthHeaders()
        );
        
        // Set the data directly - backend should already filter correctly
        setPendingRequests(response.data || []);
        
        // Count unviewed requests
        const unviewed = (response.data || []).filter(req => !req.viewed).length;
        setUnviewedCount(unviewed);
        if (onUnviewedCountChange) {
          onUnviewedCountChange(unviewed);
        }
      } catch (err) {
        console.error("Error fetching pending requests:", err);
        
        // Provide a more specific error message
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
        } else if (err.request) {
          // The request was made but no response was received
          setError("No response from server. Please check your connection.");
        } else {
          // Something happened in setting up the request that triggered an Error
          setError(`Error: ${err.message}`);
        }
        
        setPendingRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
    
    // Cleanup function to prevent state updates if component unmounts during fetch
    return () => {
      // This is a cleanup function that runs when the component unmounts
      // or when the dependencies change
    };
  }, [refreshTrigger, getAuthHeaders, onUnviewedCountChange]);

  // Retry fetching data
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setRefreshTrigger(prev => prev + 1);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Toggle expanded row
  const toggleExpand = async (id) => {
    setExpandedId(expandedId === id ? null : id);
    setRemarkText(""); // Clear remark text when toggling

    // Mark request as viewed when expanded
    if (expandedId !== id) {
      try {
        await axios.patch(
          `${apiConfig.endpoints.travelRequests.base}/${id}/viewed`,
          {},
          getAuthHeaders()
        );
        
        // Update local state to mark as viewed
        setPendingRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === id ? { ...req, viewed: true } : req
          )
        );
        
        // Update unviewed count
        setUnviewedCount(prev => Math.max(0, prev - 1));
        if (onUnviewedCountChange) {
          onUnviewedCountChange(Math.max(0, unviewedCount - 1));
        }
      } catch (error) {
        console.error("Failed to mark request as viewed:", error);
      }
    }
  };

  // Handle remark text change
  const handleRemarkChange = (e) => {
    setRemarkText(e.target.value);
  };

  // Append user position to remark
  const appendPositionToRemark = (text) => {
    if (!text.trim()) return "";
    const position = user.position || "Unknown Position";
    const name = `${user.first_name} ${user.last_name}`;
    return `${text.trim()} - ${name} (${position})`;
  };

  // Combine old and new remarks
  const combineRemarks = (oldRemarks, newRemark) => {
    return oldRemarks ? `${oldRemarks}\n${newRemark}` : newRemark;
  };

  // Submit remark
  const handleSubmitRemark = async (id) => {
    if (!remarkText.trim()) return;

    const request = pendingRequests.find((r) => r.id === id);
    if (!request) return;

    const oldRemarks = request.remarks || "";
    const newRemarkWithPosition = appendPositionToRemark(remarkText);
    const appendedRemarks = combineRemarks(oldRemarks, newRemarkWithPosition);

    try {
      await axios.patch(
        `${apiConfig.endpoints.travelRequests.base}/${id}/remarks`,
        { remarks: appendedRemarks },
        getAuthHeaders()
      );

      // Update local state
      setPendingRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === id ? { ...req, remarks: appendedRemarks } : req
        )
      );
      setRemarkText("");
      showSnackbar("Remark added successfully!", 'success');
    } catch (error) {
      console.error("Failed to add remark:", error);
      showSnackbar("Failed to add remark. Please try again.", 'error');
    }
  };

  // Validate request
  const handleValidate = async (id) => {
    const request = pendingRequests.find((r) => r.id === id);
    if (!request) return;

    const oldRemarks = request.remarks || "";
    const newRemarkWithPosition = appendPositionToRemark(remarkText);
    const appendedRemarks = remarkText.trim()
      ? combineRemarks(oldRemarks, newRemarkWithPosition)
      : oldRemarks;

    try {
      // Only update status to accepted
      await axios.patch(
        `${apiConfig.endpoints.travelRequests.base}/${id}/status`,
        { status: "accepted" },
        getAuthHeaders()
      );

      // Then add remark if provided
      if (remarkText.trim()) {
        await axios.patch(
          `${apiConfig.endpoints.travelRequests.base}/${id}/remarks`,
          { remarks: appendedRemarks },
          getAuthHeaders()
        );
      }

      // Update local state
      setPendingRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === id
            ? { 
                ...req, 
                status: "accepted", 
                remarks: appendedRemarks 
              }
            : req
        )
      );
      
      setExpandedId(null);
      setRemarkText("");
      showSnackbar("Travel request approved successfully!", 'success');
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to validate travel request:", error);
      showSnackbar("Failed to validate travel request. Please try again.", 'error');
    }
  };

  // Reject request
  const handleReject = async (id) => {
    const request = pendingRequests.find((r) => r.id === id);
    if (!request) return;

    // Require a remark for rejection
    if (!remarkText.trim()) {
      showSnackbar("Please provide a reason for rejection in the remarks field.", 'warning');
      return;
    }

    const oldRemarks = request.remarks || "";
    const newRemarkWithPosition = appendPositionToRemark(remarkText);
    const appendedRemarks = combineRemarks(oldRemarks, newRemarkWithPosition);

    try {
      // First add the rejection remark
      await axios.patch(
        `${apiConfig.endpoints.travelRequests.base}/${id}/remarks`,
        { remarks: appendedRemarks },
        getAuthHeaders()
      );

      // Then reject the request
      await axios.patch(
        `${apiConfig.endpoints.travelRequests.base}/${id}/validate`,
        { validationStatus: "REJECTED" },
        getAuthHeaders()
      );

      // Update local state
      setPendingRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== id)
      );
      setExpandedId(null);
      setRemarkText("");
      showSnackbar("Travel request rejected successfully.", 'success');
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to reject travel request:", error);
      showSnackbar("Failed to reject travel request. Please try again.", 'error');
    }
  };

  // Get role-specific title
  const getRoleTitle = () => {
    switch (user?.role) {
      case "Principal":
        return "Validate Teacher Requests";
      case "PSDS":
        return "Validate Principal Requests";
      case "ASDS":
        return "Validate PSDS Requests";
      case "SDS":
        return "Validate ASDS Requests";
      default:
        return "Validate Requests";
    }
  };

  // Get role-specific empty message
  const getEmptyMessage = () => {
    if (!user) return "No pending requests available.";
    
    switch (user.role) {
      case "Principal":
        return "No pending requests from teachers in your school at this time.";
      case "PSDS":
        return `No pending requests from principals in ${user.district} district at this time.`;
      case "ASDS":
        return "No pending requests from PSDS at this time.";
      case "SDS":
        return "No pending requests from ASDS at this time.";
      default:
        return "No pending requests require your validation at this time.";
    }
  };

  // Get status badge class based on status and validation status
  const getStatusBadgeClass = (status, validationStatus, isCodeExpired) => {
    if (isCodeExpired) return "status-badge expired";
    
    if (status === "accepted" || validationStatus === "VALIDATED") {
      return "status-badge accepted";
    } else if (status === "rejected" || validationStatus === "REJECTED") {
      return "status-badge rejected";
    } else {
      return "status-badge pending";
    }
  };

  // Get status display text
  const getStatusDisplayText = (status, validationStatus, isCodeExpired) => {
    if (isCodeExpired) return "EXPIRED";
    
    if (status === "accepted" || validationStatus === "VALIDATED") return "APPROVED";
    if (validationStatus === "REJECTED") return "REJECTED";
    return "PENDING";
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Filter requests based ONLY on status
  const filteredRequests = pendingRequests.filter(request => {
    if (statusFilter === "all") {
      return true;
    }

    // Normalize status from the request data (assuming it might be null/undefined or different cases)
    const currentStatus = (request.status || '').toLowerCase();

    // Compare with the selected filter value
    if (statusFilter === "PENDING") {
      return currentStatus === 'pending'; // Match 'pending' status
    }
    if (statusFilter === "VALIDATED") {
      // 'Validated' filter option should match 'accepted' status
      return currentStatus === 'accepted'; 
    }
    if (statusFilter === "REJECTED") {
      // 'Rejected' filter option should match 'rejected' status
      // Note: Check if your backend actually sets status to 'rejected'. 
      // If rejection only updates validationStatus, this filter might not show rejected items.
      return currentStatus === 'rejected'; 
    }
    
    return false; // Should not happen if statusFilter matches dropdown options
  });

  if (!user) {
    return <div className="loading-message">Please log in to view pending requests.</div>;
  }

  if (loading) {
    return <div className="loading-message">Loading pending requests...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pending-requests-container">
      <div className="header-with-count">
        <h2>{getRoleTitle()}</h2>
      </div>
      
      <div className="filter-controls">
        <label htmlFor="statusFilter">Filter by Status:</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="status-filter"
        >
          <option value="all">All Requests</option>
          <option value="PENDING">Pending</option>
          <option value="VALIDATED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      
      {filteredRequests.length === 0 ? (
        <div className="no-requests-message">
          {getEmptyMessage()}
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Purpose</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <React.Fragment key={request.id}>
                  <tr
                    className={`${expandedId === request.id ? "expanded" : ""} ${
                      request.isCodeExpired ? "expired" : 
                      request.validationStatus === "VALIDATED" ? "accepted" :
                      request.validationStatus === "REJECTED" ? "rejected" : "pending"
                    }`}
                    onClick={() => toggleExpand(request.id)}
                  >
                    <td>
                      {request.user.first_name} {request.user.last_name}
                      <div className="requester-details">
                        <span>{request.user.position}</span>
                        <span>{request.user.school_name}</span>
                      </div>
                    </td>
                    <td>{request.purpose}</td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>{formatDate(request.endDate)}</td>
                    <td>
                      <span className={getStatusBadgeClass(
                        request.status, 
                        request.validationStatus, 
                        request.isCodeExpired
                      )}>
                        {getStatusDisplayText(
                          request.status, 
                          request.validationStatus, 
                          request.isCodeExpired
                        )}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-details-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(request.id);
                        }}
                      >
                        {expandedId === request.id ? "Hide Details" : "View Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === request.id && (
                    <tr className="details-row">
                      <td colSpan="6">
                        <div className="request-details">
                          <div className="detail-item">
                            <strong>Departments:</strong>
                            <p>{request.department.join(", ")}</p>
                          </div>

                          {request.remarks && (
                            <div className="detail-item">
                              <strong>Existing Remarks:</strong>
                              {request.remarks.split("\n").map((remark, idx) => (
                                <p key={idx}>{remark}</p>
                              ))}
                            </div>
                          )}

                          <div className="remark-section">
                            <label htmlFor={`remark-${request.id}`}>
                              Add Remark:
                            </label>
                            <textarea
                              id={`remark-${request.id}`}
                              value={remarkText}
                              onChange={handleRemarkChange}
                              placeholder="Add your remark here..."
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="action-buttons">
                              <button
                                className="submit-remark-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitRemark(request.id);
                                }}
                                disabled={!remarkText.trim()}
                              >
                                Submit Remark
                              </button>
                              {/* Only show Approve/Reject buttons if the request is still pending for validation */}
                              {(request.validationStatus === "PENDING" && request.status !== "accepted") && (
                                <>
                                  <button
                                    className="validate-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleValidate(request.id);
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="reject-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(request.id);
                                    }}
                                    disabled={!remarkText.trim()}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {/* Show status message if already validated, accepted or rejected */}
                              {(request.validationStatus === "VALIDATED" || request.status === "accepted") && (
                                <span className="status-message validated">Request has been approved</span>
                              )}
                              {request.validationStatus === "REJECTED" && (
                                <span className="status-message rejected">Request has been rejected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingRequestsTable;
