import { useState, useEffect } from "react";
import axios from "axios";
import "./RequestSummary.css";
import apiConfig from '../config/api';

const RequestSummary = () => {
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0,
    expired: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequestSummary = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("accessToken");
        
        // Use the existing endpoint to get all requests
        const response = await axios.get(
          apiConfig.endpoints.travelRequests.base,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        // Calculate summary statistics
        const requests = response.data || [];
        const calculatedSummary = {
          total: requests.length,
          pending: requests.filter(req => req.validationStatus === "PENDING").length,
          validated: requests.filter(req => req.validationStatus === "VALIDATED").length,
          rejected: requests.filter(req => req.validationStatus === "REJECTED").length,
          expired: requests.filter(req => req.isCodeExpired).length
        };
        
        setSummary(calculatedSummary);
      } catch (error) {
        console.error("Error fetching request summary:", error);
        // Set fallback values in case of error
        setSummary({
          total: 0,
          pending: 0,
          validated: 0,
          rejected: 0,
          expired: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequestSummary();
  }, []);

  if (isLoading) {
    return <div className="summary-loading">Loading summary...</div>;
  }

  return (
    <div className="validation-summary">
      <div className="summary-card total">
        <h3>Total Requests</h3>
        <p>{summary.total}</p>
      </div>
      <div className="summary-card pending">
        <h3>Pending</h3>
        <p>{summary.pending}</p>
      </div>
      <div className="summary-card validated">
        <h3>Validated</h3>
        <p>{summary.validated}</p>
      </div>
      <div className="summary-card rejected">
        <h3>Rejected</h3>
        <p>{summary.rejected}</p>
      </div>
      <div className="summary-card expired">
        <h3>Expired</h3>
        <p>{summary.expired}</p>
      </div>
    </div>
  );
};

export default RequestSummary; 