import jsPDF from 'jspdf';

/**
 * Generates a PDF receipt for a travel request
 * @param {Object} receiptData - The travel request data
 * @param {Function} getStatusDisplayText - Function to get status display text
 * @returns {jsPDF} The generated PDF document
 */
export const generateReceiptPDF = (receiptData, getStatusDisplayText) => {
  if (!receiptData) return null;

  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Department of Education', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Travel Authority Receipt', 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Republic of the Philippines', 105, 40, { align: 'center' });
  
  // Add travel details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Travel Details', 20, 55);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    ['Security Code:', receiptData.securityCode],
    ['Name:', receiptData.teacherName || `${receiptData.user?.first_name} ${receiptData.user?.last_name}`],
    ['Position:', receiptData.teacherPosition || receiptData.user?.position],
    ['School/Office:', receiptData.teacherSchool || receiptData.user?.school_name],
    ['Department(s):', Array.isArray(receiptData.department) 
      ? receiptData.department.join(', ') 
      : (receiptData.department || '')],
    ['Purpose:', receiptData.purpose],
    ['Travel Period:', `${formatDate(receiptData.startDate)} to ${formatDate(receiptData.endDate)}`],
    ['Status:', getStatusDisplayText(
      receiptData.status, 
      receiptData.validationStatus, 
      receiptData.isCodeExpired
    )]
  ];
  
  let y = 65;
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', 60, y);
    y += 10;
  });
  
  // Add remarks
  doc.setFont('helvetica', 'bold');
  doc.text('Remarks:', 20, y + 10);
  doc.setFont('helvetica', 'normal');
  
  if (receiptData.remarks && receiptData.remarks.trim()) {
    const remarkLines = doc.splitTextToSize(receiptData.remarks, 170);
    doc.text(remarkLines, 20, y + 20);
  } else {
    doc.text('No remarks', 20, y + 20);
  }
  
  // Add signature line
  const signatureY = doc.internal.pageSize.height - 50;
  doc.line(20, signatureY, 80, signatureY);
  doc.text('AO Admin Officer Signature', 30, signatureY + 5);
  
  // Add date
  doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, doc.internal.pageSize.height - 20);
  
  return doc;
};

/**
 * Format a date string to a more readable format
 * @param {string} dateString - The date string to format
 * @returns {string} The formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // If it's already a date object, convert to string
  const dateStr = typeof dateString === 'object' 
    ? dateString.toISOString() 
    : dateString;
    
  // Extract the date part if it's an ISO string
  const datePart = dateStr.includes('T') 
    ? dateStr.split('T')[0] 
    : dateStr;
    
  // Format as MM/DD/YYYY
  const [year, month, day] = datePart.split('-');
  return `${month}/${day}/${year}`;
};

/**
 * Get status badge class based on status and validation status
 * @param {string} status - The request status
 * @param {string} validationStatus - The validation status
 * @param {boolean} isCodeExpired - Whether the code is expired
 * @returns {string} The CSS class for the status badge
 */
export const getStatusBadgeClass = (status, validationStatus, isCodeExpired) => {
  if (isCodeExpired) return "status-badge expired";
  
  if (status === "accepted" || validationStatus === "VALIDATED") {
    return "status-badge accepted";
  } else if (status === "rejected" || validationStatus === "REJECTED") {
    return "status-badge rejected";
  } else {
    return "status-badge pending";
  }
};

/**
 * Get status display text
 * @param {string} status - The request status
 * @param {string} validationStatus - The validation status
 * @param {boolean} isCodeExpired - Whether the code is expired
 * @returns {string} The display text for the status
 */
export const getStatusDisplayText = (status, validationStatus, isCodeExpired) => {
  if (isCodeExpired) return "EXPIRED";
  
  if (validationStatus === "VALIDATED") return "VALIDATED";
  if (validationStatus === "REJECTED") return "REJECTED";
  return status.toUpperCase();
};
