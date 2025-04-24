"use client"

import axios from "axios";
import { Bell, Home, Printer, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "./SnackbarProvider"; // Use unified snackbar provider
import "./AOadminOfficerDashboard.css";
import jsPDF from 'jspdf';
import { formatDate, generateReceiptPDF, getStatusBadgeClass, getStatusDisplayText } from "../utils/receiptGenerator";
import { generateCertificateOfAppearancePDF } from '../utils/certificateOfAppearanceGenerator';

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

const AOadminOfficerDashboard = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [travelOrders, setTravelOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("VALIDATED");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [deptStatusFilter, setDeptStatusFilter] = useState("all"); // Separate status filter for department view
  const [showExpiredFilter, setShowExpiredFilter] = useState(false); 
  const [remarkText, setRemarkText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deptSearchTerm, setDeptSearchTerm] = useState(""); // Separate search for department view
  const [isCheckingExpiredCodes, setIsCheckingExpiredCodes] = useState(false);
  const [activeView, setActiveView] = useState("orders");
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  // Add new state for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmOrderData, setConfirmOrderData] = useState(null);

  // Current user's position state
  const [userPosition, setUserPosition] = useState("");

  // Add user state at the top with other state declarations
  const [currentUser, setCurrentUser] = useState(null);

  const [validationSummary, setValidationSummary] = useState({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0,
    expired: 0
  });

  const [viewMode, setViewMode] = useState("officer"); // "officer" or "department"

  // Add a summary for department requests
  const [deptRequestSummary, setDeptRequestSummary] = useState({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0,
    expired: 0
  });

  useEffect(() => {
    // Fetch current user's profile and set userPosition
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:3000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
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
      }
    };

    fetchCurrentUser();
    fetchTravelOrders();
  }, []);

  useEffect(() => {
    const calculateSummary = () => {
      const summary = {
        total: travelOrders.length,
        pending: 0,
        validated: 0,
        rejected: 0,
        expired: 0
      };

      // For department summary, only count Administrative Office requests
      const deptSummary = {
        total: 0,
        pending: 0,
        validated: 0,
        rejected: 0,
        expired: 0
      };

      travelOrders.forEach(order => {
        // Add to main summary
        if (order.isCodeExpired) {
          summary.expired++;
        } else if (order.validationStatus === 'VALIDATED') {
          summary.validated++;
        } else if (order.validationStatus === 'REJECTED') {
          summary.rejected++;
        } else {
          summary.pending++;
        }

        // Check if it's an Administrative Office request
        const isAdminOfficeRequest = order.department && 
          (order.department.toLowerCase().includes("administrative office") || 
           order.department.toLowerCase().includes("admin office"));

        // If it's Administrative Office request, add to department summary
        if (isAdminOfficeRequest) {
          deptSummary.total++;
          if (order.isCodeExpired) {
            deptSummary.expired++;
          } else if (order.validationStatus === 'VALIDATED') {
            deptSummary.validated++;
          } else if (order.validationStatus === 'REJECTED') {
            deptSummary.rejected++;
          } else {
            deptSummary.pending++;
          }
        }
      });

      setValidationSummary(summary);
      setDeptRequestSummary(deptSummary);
    };

    calculateSummary();
  }, [travelOrders]);

  // Helper: Returns auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Helper function to get status badge class
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

  // Helper function to get status display text
  const getStatusDisplayText = (status, validationStatus, isCodeExpired) => {
    if (isCodeExpired) return "EXPIRED";
    
    if (validationStatus === "VALIDATED") return "APPROVED";
    if (validationStatus === "REJECTED") return "REJECTED";
    return status.toUpperCase();
  };

  // Helper: Append user's position to a remark (e.g., "Remark text - System Administrator")
  const appendPositionToRemark = (remark) => {
    // Get the department from the current user's position
    const userDepartment = currentUser?.position || "Unknown Department";
    return `${remark.trim()} (${userDepartment})`;
  };

  // Helper: Combine old and new remarks using a comma separator
  const combineRemarks = (oldRemarks, newRemark) => {
    if (!oldRemarks.trim()) {
      return newRemark;
    } else {
      return `${oldRemarks}\n${newRemark}`;
    }
  };

  // Add this helper function to detect all Administrative Officer variations
  const isAdministrativeOfficerPosition = (positionText) => {
    if (!positionText) return false;
    
    const position = positionText.toLowerCase();
    
    // Match any of these patterns:
    return (
      position.includes('administrative officer') || 
      position.includes('admin officer') ||
      position.includes('admin. officer') ||
      // Match patterns like "administrative officer ii" or "administrative officer the 2nd"
      position.match(/admin(\.|istrative)?\s+officer\s+(the\s+)?\d+(st|nd|rd|th)?/i) ||
      position.match(/admin(\.|istrative)?\s+officer\s+[iv]+/i) // Match Roman numerals
    );
  };

  // Update the checkAllDepartmentRemarks function
  const checkAllDepartmentRemarks = (order) => {
    if (!order || !order.department) return true;
    
    // Parse departments from the order
    const departments = Array.isArray(order.department)
      ? order.department
      : order.department.split(',').map(d => d.trim());
    
    // Get all remarks to check
    const remarkLines = order.remarks ? order.remarks.split('\n').filter(line => line.trim()) : [];
    
    // Track which departments have provided remarks
    const departmentsWithRemarks = new Set();
    
    // Check each remark line for department mentions
    remarkLines.forEach(line => {
      // Extract the position from the remark line using regex
      const positionMatch = line.match(/-\s+.*?\s+\((.*?)\)/);
      const position = positionMatch ? positionMatch[1] : '';
      
      // Check if the position is any variation of Administrative Officer
      if (isAdministrativeOfficerPosition(position)) {
        departmentsWithRemarks.add('Administrative Office');
      }
      
      // Check for exact department matches
      departments.forEach(dept => {
        if (line.toLowerCase().includes(dept.toLowerCase())) {
          departmentsWithRemarks.add(dept);
        }
      });
    });
    
    // Check if all departments have remarks
    const missingDepartments = departments.filter(
      dept => !departmentsWithRemarks.has(dept)
    );
    
    return missingDepartments.length === 0;
  };

  // Also update the getMissingDepartments function
  const getMissingDepartments = (order) => {
    if (!order || !order.department) return [];
    
    // Parse departments from the order
    const departments = Array.isArray(order.department)
      ? order.department
      : order.department.split(',').map(d => d.trim());
    
    // Get all remarks to check
    const remarkLines = order.remarks ? order.remarks.split('\n').filter(line => line.trim()) : [];
    
    // Track which departments have provided remarks
    const departmentsWithRemarks = new Set();
    
    // Check each remark line for department mentions
    remarkLines.forEach(line => {
      // Extract the position from the remark line using regex
      const positionMatch = line.match(/-\s+.*?\s+\((.*?)\)/);
      const position = positionMatch ? positionMatch[1] : '';
      
      // Check if the position is any variation of Administrative Officer
      if (isAdministrativeOfficerPosition(position)) {
        departmentsWithRemarks.add('Administrative Office');
      }
      
      // Check for exact department matches
      departments.forEach(dept => {
        if (line.toLowerCase().includes(dept.toLowerCase())) {
          departmentsWithRemarks.add(dept);
        }
      });
    });
    
    // Return missing departments
    return departments.filter(dept => !departmentsWithRemarks.has(dept));
  };

  // Update the checkAnyDepartmentRemarks function to use the new helper
  const checkAnyDepartmentRemarks = (order) => {
    if (!order.department || !order.remarks) return false;
    
    // Get array of departments
    const departments = Array.isArray(order.department) 
      ? order.department 
      : order.department.split(',').map(d => d.trim());
    
    if (departments.length === 0) return false;
    
    // Get array of remarks
    const remarksList = order.remarks.split('\n')
      .map(remark => remark.trim())
      .filter(remark => remark.length > 0);
    
    // Extract positions from each remark line
    const remarkedDepartments = new Set();
    
    remarksList.forEach(remark => {
      const positionMatch = remark.match(/-\s+.*?\s+\((.*?)\)/);
      const position = positionMatch ? positionMatch[1].trim() : '';
      
      // Add the position to remarkedDepartments
      if (position) {
        if (isAdministrativeOfficerPosition(position)) {
          remarkedDepartments.add('administrative office');
        } else {
          remarkedDepartments.add(position.toLowerCase());
        }
      }
      
      // Also check for direct department mentions in the remark
      departments.forEach(dept => {
        if (remark.toLowerCase().includes(dept.toLowerCase())) {
          remarkedDepartments.add(dept.toLowerCase());
        }
      });
    });
    
    // Check if EVERY department has left a remark
    return departments.every(dept => 
      remarkedDepartments.has(dept.trim().toLowerCase())
    );
  };

  // ===================== Handlers ===================== //

  const handleSubmitRemark = async (id) => {
    if (!remarkText.trim()) {
      showSnackbar("Please enter a remark before submitting.", 'warning');
      return;
    }

    const order = travelOrders.find((o) => o.id === id);
    if (!order) {
      showSnackbar("Could not find that travel order.", 'error');
      return;
    }

    // Format the new remark with name and position
    const newRemarkWithPosition = `${remarkText.trim()} - ${currentUser?.first_name} ${currentUser?.last_name} (${currentUser?.position || 'Unknown Position'})`;
    
    // Handle multiple remarks
    const existingRemarks = order.remarks ? order.remarks.trim() : "";
    
    // Check if adding this remark would make it too long
    const MAX_REMARKS_LENGTH = 1000; // Adjust this based on your database column size
    
    // Truncate the remarks if necessary
    let updatedRemarks;
    if (existingRemarks) {
      // If existing remarks + new remark is too long
      if (existingRemarks.length + newRemarkWithPosition.length + 1 > MAX_REMARKS_LENGTH) {
        // Option 1: Keep only the new remark
        updatedRemarks = newRemarkWithPosition.substring(0, MAX_REMARKS_LENGTH);
        showSnackbar("Previous remarks were too long and have been replaced.", 'warning');
      } else {
        // Concatenate with newline if within limits
        updatedRemarks = `${existingRemarks}\n${newRemarkWithPosition}`;
      }
    } else {
      // Just use the new remark, truncated if needed
      updatedRemarks = newRemarkWithPosition.substring(0, MAX_REMARKS_LENGTH);
    }

    try {
      // Create a simpler payload (removing the department field which might not be needed)
      const payload = { remarks: updatedRemarks };

      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/remarks`,
        payload,
        getAuthHeaders()
      );

      setTravelOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === id ? { ...ord, remarks: updatedRemarks } : ord
        )
      );
      
      showSnackbar("Remark submitted successfully!", 'success');
      setRemarkText("");
    } catch (error) {
      console.error("Failed to submit remark:", error);
      
      if (error.response) {
        console.error("Error response:", error.response.data);
        showSnackbar(`Failed to submit remark: ${error.response.data.message || "Server error"}`, 'error');
      } else {
        showSnackbar("Failed to submit remark. Please try again.", 'error');
      }
    }
  };

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
      (order.department && 
       order.department.split(',').map(dep => dep.trim().toLowerCase())
        .includes(departmentFilter.toLowerCase()));
    const matchesExpired = !showExpiredFilter || order.isCodeExpired;

    return matchesSearch && matchesStatus && matchesDepartment && matchesExpired;
  });

  const getStatusTitle = () => {
    if (viewMode === "department") {
      return "ADMINISTRATIVE DEPARTMENT REQUESTS";
    }
    
    if (showExpiredFilter) {
      return "EXPIRED TRAVEL ORDERS";
    }
    
    switch (statusFilter) {
      case "PENDING":
        return "PENDING TRAVEL ORDERS";
      case "VALIDATED":
        return "VALIDATED TRAVEL ORDERS";
      case "REJECTED":
        return "REJECTED TRAVEL ORDERS";
      default:
        return "ALL TRAVEL ORDERS";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
    window.location.reload()
  }

  // Modify the handleValidate function to show confirmation modal first
  const handleValidateClick = (id) => {
    const order = travelOrders.find(o => o.id === id);
    if (!order) {
      showSnackbar('Could not find travel order', 'error');
      return;
    }
    
    // Set the order data and show confirmation modal
    setConfirmOrderData(order);
    setShowConfirmModal(true);
  };
  
  // Add actual validate function that will be called after confirmation
  const confirmValidate = async () => {
    if (!confirmOrderData) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showSnackbar('Authentication token not found', 'error');
        return;
      }

      // Format the remark with user info if provided
      let updatedRemarks = confirmOrderData.remarks;
      
      // ALWAYS add a remark with the AO's info, using default text if the textarea is empty
      const aoRemark = remarkText.trim() 
        ? `${remarkText.trim()} - ${currentUser?.first_name} ${currentUser?.last_name} (${currentUser?.position || 'Administrative Officer'})`
        : `Approved - ${currentUser?.first_name} ${currentUser?.last_name} (${currentUser?.position || 'Administrative Officer'})`;
      
      updatedRemarks = confirmOrderData.remarks 
        ? `${confirmOrderData.remarks}\n${aoRemark}`
        : aoRemark;

      const response = await axios.patch(
        `http://localhost:3000/travel-requests/${confirmOrderData.id}/validate`,
        { 
          validationStatus: 'VALIDATED',
          remarks: updatedRemarks,
          administrative_officer: {
            name: `${currentUser?.first_name} ${currentUser?.last_name}`,
            position: currentUser?.position || 'Administrative Officer'
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        // Update the local state to reflect the validation
        setTravelOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === confirmOrderData.id
              ? { ...order, validationStatus: 'VALIDATED', remarks: updatedRemarks }
              : order
          )
        );

        // Send notification to the user
        if (confirmOrderData.user && confirmOrderData.user.id) {
          await axios.post(
            `http://localhost:3000/travel-requests/${confirmOrderData.id}/receipt`,
            {
              message: `Your Certificate of Appearance has been approved by ${currentUser?.first_name} ${currentUser?.last_name} (${currentUser?.position || 'Administrative Officer'}). Security Code: ${confirmOrderData.securityCode}`,
              type: 'CERTIFICATE_OF_APPEARANCE_APPROVED'
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        setExpandedId(null);
        setRemarkText("");
        setShowConfirmModal(false);
        setConfirmOrderData(null);
        showSnackbar('Travel request validated successfully', 'success');
      }
    } catch (error) {
      console.error('Error validating request:', error);
      showSnackbar('Failed to validate the request', 'error');
      setShowConfirmModal(false);
    }
  };

  // Handle rejecting a request
  const handleReject = async (id) => {
    const order = travelOrders.find((o) => o.id === id);
    if (!order) return;

    try {
      // Format the remark with user info, using default text if the textarea is empty
      const rejectText = remarkText.trim() || "Rejected";
      const newRemarkWithPosition = `${rejectText} - ${currentUser?.first_name} ${currentUser?.last_name} (${currentUser?.position || 'Unknown Position'})`;
      const updatedRemarks = order.remarks 
        ? `${order.remarks}\n${newRemarkWithPosition}`
        : newRemarkWithPosition;

      // Reject the request
      await axios.patch(
        `http://localhost:3000/travel-requests/${id}/validate`,
        { 
          validationStatus: "REJECTED",
          remarks: updatedRemarks
        },
        getAuthHeaders()
      );

      // Update local state
      setTravelOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord.id === id
            ? { 
                ...ord, 
                validationStatus: "REJECTED",
                remarks: updatedRemarks
              }
            : ord
        )
      );

      // Send notification to user about rejection
      if (order.user && order.user.id) {
        await axios.post(
          `http://localhost:3000/notifications`,
          {
            userId: order.user.id,
            message: `Your travel request has been rejected${remarkText.trim() ? `. Reason: ${remarkText.trim()}` : '.'}`,
            type: 'TRAVEL_REQUEST_REJECTED'
          },
          getAuthHeaders()
        );
      }

      setExpandedId(null);
      setRemarkText("");
      showSnackbar("Travel request rejected successfully!", 'success');
    } catch (error) {
      console.error("Failed to reject travel request:", error);
      showSnackbar("Failed to reject travel request. Please try again.", 'error');
    }
  };

  // Add generateReceipt function for paperless functionality
  const generateReceipt = async (order) => {
    try {
      // Generate receipt PDF
      const doc = generateReceiptPDF(order, getStatusDisplayText);
      
      // Save the PDF
      doc.save(`Travel_Receipt_${order.securityCode || 'document'}.pdf`);

      // Send notification to user about receipt
      if (order.user && order.user.id) {
        await axios.post(
          `http://localhost:3000/travel-requests/${order.id}/receipt`,
          {
            message: `Your travel request receipt is ready. Security Code: ${order.securityCode}`
          },
          getAuthHeaders()
        );
      }

      showSnackbar("Receipt generated and sent successfully!", 'success');
    } catch (error) {
      console.error("Failed to generate receipt:", error);
      showSnackbar("Failed to generate receipt. Please try again.", 'error');
    }
  };

  // Add handlePrintReceipt function
  const handlePrintReceipt = async (order) => {
    try {
      await generateReceipt(order);
    } catch (error) {
      console.error("Failed to print receipt:", error);
      showSnackbar("Failed to print receipt. Please try again.", 'error');
    }
  };

  // Receipt Modal Component - Now just a summary modal
  const ReceiptModal = ({ show, onClose, data }) => {
    if (!show || !data) return null;
    
    return (
      <div className="receipt-modal">
        <div className="receipt-modal-content">
          <div className="receipt-header">
            <h2>Travel Request Summary</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="receipt-body">
            <div className="receipt-section">
              <h3>Travel Details</h3>
              <div className="receipt-detail">
                <span className="label">Name:</span>
                <span className="value">{data.teacherName}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Position:</span>
                <span className="value">{data.teacherPosition}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">School/Office:</span>
                <span className="value">{data.teacherSchool}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Department(s):</span>
                <span className="value">{data.department}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Purpose:</span>
                <span className="value">{data.purpose}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Travel Period:</span>
                <span className="value">{data.startDate} to {data.endDate}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Status:</span>
                <span className={`value ${getStatusBadgeClass(data.status, data.validationStatus, data.isCodeExpired)}`}>
                  {getStatusDisplayText(data.status, data.validationStatus, data.isCodeExpired)}
                </span>
              </div>
            </div>
            
            <div className="receipt-section">
              <h3>Remarks</h3>
              <div className="receipt-remarks">
                {data.remarks ? data.remarks.split('\n').map((remark, idx) => (
                  <p key={idx}>{remark}</p>
                )) : <p>No remarks</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add the handler function for checking expired codes
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

  // Update the Confirmation Modal Component to match the image
  const ConfirmModal = ({ show, onClose, onConfirm, data }) => {
    if (!show || !data) return null;
    
    return (
      <div className="receipt-modal">
        <div className="receipt-modal-content">
          <div className="receipt-header">
            <h2>Travel Request Summary</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="receipt-body">
            <div className="receipt-section">
              <h3>Travel Details</h3>
              <div className="receipt-detail">
                <span className="label">Name:</span>
                <span className="value">{data.teacherName}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Position:</span>
                <span className="value">{data.teacherPosition}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">School/Office:</span>
                <span className="value">{data.teacherSchool}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Department(s):</span>
                <span className="value">{data.department}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Purpose:</span>
                <span className="value">{data.purpose}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Travel Period:</span>
                <span className="value">{data.startDate} to {data.endDate}</span>
              </div>
              <div className="receipt-detail">
                <span className="label">Status:</span>
                <span className="value status-badge approved">APPROVED</span>
              </div>
            </div>
            
            <div className="receipt-section">
              <h3>Remarks</h3>
              <div className="receipt-remarks">
                {data.remarks ? data.remarks.split('\n').map((remark, idx) => (
                  <p key={idx}>{remark}</p>
                )) : <p>No remarks</p>}
              </div>
            </div>
          </div>
          
          <div className="receipt-footer">
            <button className="cancel-button" onClick={onClose}>Cancel</button>
            <button className="confirm-button" onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    );
  };

  // Add department-specific handlers
  const handleDeptSearchChange = (e) => setDeptSearchTerm(e.target.value);
  const handleDeptStatusChange = (e) => setDeptStatusFilter(e.target.value);

  // Switch view mode with reset
  const handleViewModeChange = (mode) => {
    // Reset expanded state and remark text when switching views
    setExpandedId(null);
    setRemarkText("");
    setViewMode(mode);
  };

  // Render toggle buttons for switching between views
  const renderToggleButtons = () => {
    return (
      <div className="view-toggle-container">
        <button 
          className={`view-toggle-button ${viewMode === "officer" ? "active" : ""}`}
          onClick={() => handleViewModeChange("officer")}
        >
          Administrative Officer View
        </button>
        <button 
          className={`view-toggle-button ${viewMode === "department" ? "active" : ""}`}
          onClick={() => handleViewModeChange("department")}
        >
          Department Officer View
        </button>
      </div>
    );
  };

  // Specific department view filters
  const departmentRequests = travelOrders.filter(order => {
    // First filter for Administrative Office department
    const isAdminDept = order.department && 
      (order.department.toLowerCase().includes("administrative office") || 
       order.department.toLowerCase().includes("admin office"));
    
    // Then apply department-specific filters
    const matchesSearch =
      order.teacherName.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
      order.id.toString().includes(deptSearchTerm);
    const matchesStatus =
      deptStatusFilter === "all" || order.validationStatus === deptStatusFilter;
    
    // Return true only if it matches ALL conditions
    return isAdminDept && matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="logo">
          <img
            src="/depedlogo.png?height=40&width=100"
            alt="DepEd Logo"
            className="deped-logo"
          />
          <span className="admin-header-text">Travel Authority System</span>
        </div>
        <div className="admin-actions">
          <button className="icon-button" onClick={() => setActiveView("orders")}>
            <Home className="icon" />
          </button>
          <button className="icon-button">
            <Bell className="icon" />
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <div className="admin-container">
        {renderToggleButtons()}
        
        {viewMode === "officer" ? (
          // OFFICER VIEW
          <>
            <div className="validation-summary">
              <div className="summary-card">
                <h3>Total Requests</h3>
                <p>{validationSummary.total}</p>
              </div>
              <div className="summary-card pending">
                <h3>Pending</h3>
                <p>{validationSummary.pending}</p>
              </div>
              <div className="summary-card validated">
                <h3>Validated</h3>
                <p>{validationSummary.validated}</p>
              </div>
              <div className="summary-card rejected">
                <h3>Rejected</h3>
                <p>{validationSummary.rejected}</p>
              </div>
              <div className="summary-card expired">
                <h3>Expired</h3>
                <p>{validationSummary.expired}</p>
              </div>
            </div>
            
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
                    } ${order.isCodeExpired ? "expired" : order.validationStatus.toLowerCase()}`}
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <div className="order-header">
                      <span className="teacher-name">{order.teacherName}</span>
                      <span className="department-info">{order.department}</span>
                      <div className="order-status-container">
                        <span className={getStatusBadgeClass(
                          order.status, 
                          order.validationStatus, 
                          order.isCodeExpired
                        )}>
                          {getStatusDisplayText(
                            order.status, 
                            order.validationStatus, 
                            order.isCodeExpired
                          )}
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

                        {/* Display security code for accepted travel requests */}
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
                            <label>Existing Remarks:</label>
                            {order.remarks.split('\n').map((rem, idx) => (
                              <p key={idx} className="remarks-line">
                                {rem.trim()}
                              </p>
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
                            {!order.remarks.includes(`${currentUser?.first_name} ${currentUser?.last_name}`) ? (
                              <div className="remark-notification">
                                Please submit a remark before approval options will appear
                              </div>
                            ) : (
                              <>
                                <button
                                  className="validate-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleValidateClick(order.id);
                                  }}
                                  disabled={!checkAnyDepartmentRemarks(order)}
                                  title={
                                    !checkAnyDepartmentRemarks(order) 
                                      ? "All departments must add remarks before approval" 
                                      : "Approve this travel request"
                                  }
                                >
                                  APPROVE
                                </button>
                                <button
                                  className="reject-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(order.id);
                                  }}
                                >
                                  Reject
                                </button>
                                
                                {!checkAnyDepartmentRemarks(order) && (
                                  <div className="missing-departments">
                                    <p>Missing remarks from departments:</p>
                                    <ul>
                                      {getMissingDepartments(order).map(dept => (
                                        <li key={dept}>{dept}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          // DEPARTMENT OFFICER VIEW
          <>
            <div className="validation-summary">
              <div className="summary-card">
                <h3>Total Requests</h3>
                <p>{deptRequestSummary.total}</p>
              </div>
              <div className="summary-card pending">
                <h3>Pending</h3>
                <p>{deptRequestSummary.pending}</p>
              </div>
              <div className="summary-card validated">
                <h3>Validated</h3>
                <p>{deptRequestSummary.validated}</p>
              </div>
              <div className="summary-card rejected">
                <h3>Rejected</h3>
                <p>{deptRequestSummary.rejected}</p>
              </div>
              <div className="summary-card expired">
                <h3>Expired</h3>
                <p>{deptRequestSummary.expired}</p>
              </div>
            </div>
            
            <div className="search-filter-container">
              <div className="search-container">
                <label htmlFor="deptSearch">Search:</label>
                <input
                  type="text"
                  id="deptSearch"
                  value={deptSearchTerm}
                  onChange={handleDeptSearchChange}
                  placeholder="Search by name or ID"
                />
              </div>
              <div className="filter-container">
                <label htmlFor="deptStatusFilter">Status:</label>
                <select
                  id="deptStatusFilter"
                  value={deptStatusFilter}
                  onChange={handleDeptStatusChange}
                >
                  <option value="all">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="VALIDATED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
            
            <div className="orders-container">
              <h2>ADMINISTRATIVE DEPARTMENT REQUESTS</h2>
              <div className="orders-list">
                {departmentRequests.map((order) => (
                  <div
                    key={order.id}
                    className={`order-item ${
                      expandedId === order.id ? "expanded" : ""
                    } ${order.isCodeExpired ? "expired" : order.validationStatus.toLowerCase()}`}
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <div className="order-header">
                      <span className="teacher-name">{order.teacherName}</span>
                      <span className="department-info">{order.department}</span>
                      <div className="order-status-container">
                        <span className={getStatusBadgeClass(
                          order.status, 
                          order.validationStatus, 
                          order.isCodeExpired
                        )}>
                          {getStatusDisplayText(
                            order.status, 
                            order.validationStatus, 
                            order.isCodeExpired
                          )}
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
                        
                        {order.remarks && order.remarks.trim() && (
                          <div className="existing-remarks">
                            <label>Existing Remarks:</label>
                            {order.remarks.split('\n').map((rem, idx) => (
                              <p key={idx} className="remarks-line">
                                {rem.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                        
                        <div className="remark-section">
                          <label htmlFor={`remark-${order.id}`}>Department Remark:</label>
                          <textarea
                            id={`remark-${order.id}`}
                            value={remarkText}
                            onChange={handleRemarkChange}
                            placeholder="Add your department remark here..."
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            className="submit-remark-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmitRemark(order.id);
                            }}
                          >
                            Submit Department Remark
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {departmentRequests.length === 0 && (
                  <div className="no-orders">
                    <p>No Administrative Department requests found.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Receipt Modal */}
      <ReceiptModal
        show={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        data={receiptData}
      />
      
      {/* Add the new Confirmation Modal */}
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmValidate}
        data={confirmOrderData}
      />
    </div>
  );
};

export default AOadminOfficerDashboard;
