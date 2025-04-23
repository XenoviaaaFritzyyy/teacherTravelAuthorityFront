import { jsPDF } from 'jspdf';

/**
 * Generates a Download Receipt PDF document based on the provided travel request data
 * @param {Object} travelRequest - The travel request data
 * @returns {jsPDF} - The generated PDF document
 */
export const generateDownloadReceiptPDF = (travelRequest) => {
  // Create new PDF document in portrait format to match the original certificate
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'legal' // Changed to A4 size for standard paper
  });
  
  // Set initial position
  let y = 20;
  
  // Add the header image
  try {
    const headerImg = new Image();
    headerImg.src = '/Header.png';
    
    // Add the header to the PDF
    const pageWidth = doc.internal.pageSize.width;
    const imgWidth = 150;
    const imgHeight = 40;
    const x = (pageWidth - imgWidth) / 2;
    doc.addImage(headerImg, 'PNG', x, y, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding header:', error);
  }
  
  // Move y-position past the header
  y += 45;
  
  // Add title
  y += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF APPEARANCE', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  // Add certification text
  y += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('This is to certify that the person named hereunder had appeared before this Office, with', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 5;
  doc.text('details as follows:', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  // Add form fields
  y += 12;
  doc.setFontSize(11);
  
  // Name field
  doc.setFont('helvetica', 'bold');
  doc.text('Name', 35, y);
  doc.text(':', 68, y);
  doc.setFont('helvetica', 'normal');
  const fullName = `${travelRequest.user?.first_name || ''} ${travelRequest.user?.last_name || ''}`.trim();
  doc.line(75, y + 1, doc.internal.pageSize.width - 35, y + 1);
  doc.text(fullName, (75 + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });
  
  // Date field
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 35, y);
  doc.text(':', 68, y);
  doc.setFont('helvetica', 'normal');

  // Fetch and format travel date range (start to end)
  let dateText = '';
  if (travelRequest.startDate && travelRequest.endDate) {
    dateText = `${formatDate(new Date(travelRequest.startDate))} - ${formatDate(new Date(travelRequest.endDate))}`;
  } else if (travelRequest.start_date && travelRequest.end_date) {
    dateText = `${formatDate(new Date(travelRequest.start_date))} - ${formatDate(new Date(travelRequest.end_date))}`;
  } else if (travelRequest.travel_date) {
    dateText = formatDate(new Date(travelRequest.travel_date));
  } else {
    // fallback to current date
    const currentDate = new Date();
    dateText = formatDate(currentDate);
  }
  doc.line(75, y + 1, doc.internal.pageSize.width - 35, y + 1);
  doc.text(dateText, (75 + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });
  
  // Purpose field
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Purpose', 35, y);
  doc.text(':', 68, y);
  doc.setFont('helvetica', 'normal');
  doc.line(75, y + 1, doc.internal.pageSize.width - 35, y + 1);
  doc.text(travelRequest.purpose || '', (75 + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });
  
  // Empty line
  y += 20;
  doc.line(75, y + 1, doc.internal.pageSize.width - 35, y + 1);
  
  // Add an empty line before the note at the bottom - positioned for better spacing
  y += 25;
  doc.line(35, y, doc.internal.pageSize.width - 35, y);

  // Add note at the bottom
  y += 30;
  doc.setFontSize(11);
  doc.text('This certification is issued as averment of the foregoing facts and for whatever legal', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 7;
  doc.text('purpose this may serve.', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  // Leave more space before signature
  y += 40;
  
  // Add signature line - right aligned
  const signX = doc.internal.pageSize.width - 100;
  doc.line(signX, y, doc.internal.pageSize.width - 35, y);

  // Fetch Administrative Officer name and position
  let approverName = '';
  let approverPosition = '';
  // 1. Strictly check explicit AO fields
  if (travelRequest.administrative_officer) {
    approverName = travelRequest.administrative_officer.name || travelRequest.administrative_officer;
    approverPosition = travelRequest.administrative_officer.position || 'Administrative Officer';
  } else if (travelRequest.ao_name) {
    approverName = travelRequest.ao_name;
    approverPosition = travelRequest.ao_position || 'Administrative Officer';
  } else if (travelRequest.ao && (travelRequest.ao.name || travelRequest.ao.position)) {
    approverName = travelRequest.ao.name || '';
    approverPosition = travelRequest.ao.position || 'Administrative Officer';
  } else if (travelRequest.remarks) {
    // 2. Parse remarks for all roles (not just AO)
    const remarkLines = travelRequest.remarks.split('\n').map(l => l.trim()).filter(Boolean);
    console.log("All remarks:", remarkLines);
    let foundApprover = false;
    
    // First, try to find the most recent remark with a position
    for (let i = remarkLines.length - 1; i >= 0; i--) {
      const remark = remarkLines[i];
      const match = remark.match(/-\s+([a-zA-Z0-9\s\.]+)\s*\(([^)]*)\)$/);
      if (match && match[1] && match[2]) {
        const foundName = match[1].trim();
        const foundPosition = match[2].trim();
        
        // Accept any valid position, not just Administrative Officer
        approverName = foundName;
        approverPosition = foundPosition;
        foundApprover = true;
        break;
      }
    }
    
    // If no match found with proper format, try a more lenient match as fallback
    if (!foundApprover && remarkLines.length > 0) {
      for (let i = remarkLines.length - 1; i >= 0; i--) {
        const remark = remarkLines[i];
        // Try to find any name-like pattern
        if (remark.includes('-')) {
          const parts = remark.split('-');
          if (parts.length >= 2) {
            const nameSection = parts[parts.length-1].trim();
            
            // Check if there's a position in parentheses
            const posMatch = nameSection.match(/([^(]+)\s*\(([^)]+)\)/);
            if (posMatch) {
              approverName = posMatch[1].trim();
              approverPosition = posMatch[2].trim();
            } else {
              // Just use the name part
              approverName = nameSection;
              
              // Try to determine position from request context
              if (travelRequest.user && travelRequest.user.role) {
                const userRole = travelRequest.user.role.toUpperCase();
                if (userRole.includes('TEACHER')) {
                  approverPosition = 'School Principal';
                } else if (userRole.includes('PRINCIPAL')) {
                  approverPosition = 'Public Schools District Supervisor';
                } else if (userRole.includes('PSDS')) {
                  approverPosition = 'Assistant Schools Division Superintendent';
                } else if (userRole.includes('ASDS')) {
                  approverPosition = 'Schools Division Superintendent';
                } else if (userRole.includes('SDS')) {
                  approverPosition = 'Regional Director';
                }
              }
            }
            foundApprover = true;
            break;
          }
        }
      }
    }
  }
  // 3. Fallback to approved_by or approver ONLY if AO
  if (!approverName) {
    if (travelRequest.approved_by && travelRequest.approved_by_position && travelRequest.approved_by_position.toLowerCase().includes('administrative officer')) {
      approverName = travelRequest.approved_by;
      approverPosition = travelRequest.approved_by_position;
    } else if (travelRequest.approver && travelRequest.approver.position && travelRequest.approver.position.toLowerCase().includes('administrative officer')) {
      approverName = travelRequest.approver.name || `${travelRequest.approver.first_name || ''} ${travelRequest.approver.last_name || ''}`;
      approverPosition = travelRequest.approver.position;
    }
  }
  // Final fallback
  if (!approverName) {
    approverName = 'Administrative Officer';
  }
  if (!approverPosition) {
    approverPosition = 'Administrative Officer';
  }

  // Debug log for troubleshooting
  console.log('COA Signatory Debug:', {
    travelRequest,
    approverName,
    approverPosition
  });

  // Add signature text below the line
  y += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(approverName || ' ', (signX + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });
  y += 7;
  doc.text(approverPosition, (signX + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });

  // Add note about validity - left aligned, below signature
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Note: This is electronically generated. Not valid with erasures, superimpositions or alterations.', 35, y);
  
  // Add much more space before the footer line to prevent overlap
  y += 90;
  doc.line(30, y, doc.internal.pageSize.width - 30, y);
  
  // Add footer image at the bottom
  try {
    const footerImg = new Image();
    footerImg.src = '/Footer.png';
    
    // Add the footer to the PDF
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const imgWidth = 180;
    const imgHeight = 25;
    const x = (pageWidth - imgWidth) / 2;
    // Position the footer much higher on the page to prevent overflow
    const footerY = pageHeight - 50; 
    doc.addImage(footerImg, 'PNG', x, footerY, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding footer:', error);
  }
  
  return doc;
};

/**
 * Format a date object to MM/DD/YYYY format
 * @param {Date} date - The date to format
 * @returns {string} The formatted date
 */
const formatDate = (date) => {
  if (!date) return '';
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};
