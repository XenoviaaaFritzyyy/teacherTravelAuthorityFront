import { jsPDF } from 'jspdf';

/**
 * Generates a Travel Authority PDF document based on the provided travel request data
 * @param {Object} travelRequest - The travel request data
 * @returns {jsPDF} - The generated PDF document
 */
export const generateTravelAuthorityPDF = (travelRequest) => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set initial position
  let y = 12; // Start even higher on the page (reduced from 15)
  
  // Add Header.png image at the top center
  try {
    const headerImg = new Image();
    headerImg.src = '/Header.png';
    // Add the header image to the PDF
    const pageWidth = doc.internal.pageSize.width;
    const imgWidth = 180; // width in pixels
    const imgHeight = 40; // height in pixels
    const x = (pageWidth - imgWidth) / 2;
    doc.addImage(headerImg, 'PNG', x, y, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding header image:', error);
  }
  
  // Adjust y position after header
  y += 45; // Add some space after header image

  // Add title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORITY TO TRAVEL', doc.internal.pageSize.width / 2, y, { align: 'center' });

  // Add recipient information
  y += 12; // Reduced from 15 to save space
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Set up measurements
  const labelX = 20;
  const labelWidth = 35; // Width of the label area
  const lineStartX = labelX + labelWidth; // Line starts after the label
  const lineEndX = 180;

  // To field
  doc.text('To:', labelX, y);
  const fullName = `${travelRequest.user?.first_name || ''} ${travelRequest.user?.last_name || ''}`.trim();
  doc.text(fullName, (lineStartX + lineEndX) / 2, y, { align: 'center' });

  // Draw line under the name
  doc.setLineWidth(0.1);
  doc.line(lineStartX, y + 1, lineEndX, y + 1);

  // Add small text under the line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Name and position of personnel authorized to travel)', (lineStartX + lineEndX) / 2, y, { align: 'center' });
  
  // From field
  y += 10;
  doc.setFontSize(10);
  doc.text('From:', labelX, y);
  // Use school_name from travel request if available
  const schoolName = travelRequest.school_name || travelRequest.user?.school_name || 'OFFICE OF THE PRINCIPAL';
  doc.text(schoolName, (lineStartX + lineEndX) / 2, y, { align: 'center' });
  
  // Draw line under the office
  doc.setLineWidth(0.1);
  doc.line(lineStartX, y + 1, lineEndX, y + 1);
  
  // Add small text under the line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Name of the office of the person who authorized travel)', (lineStartX + lineEndX) / 2, y, { align: 'center' });
  
  // Date of filing
  y += 10;
  doc.setFontSize(10);
  doc.text('Date of filing:', labelX, y);
  
  // Format date as MONTH DD, YYYY
  // Use the filing date from the travel request if available, otherwise use start date
  let filingDate;
  
  // Check various possible fields for filing date
  if (travelRequest.filing_date) {
    filingDate = new Date(travelRequest.filing_date);
  } else if (travelRequest.created_at) {
    filingDate = new Date(travelRequest.created_at);
  } else if (travelRequest.createdAt) {
    filingDate = new Date(travelRequest.createdAt);
  } else if (travelRequest.date_filed) {
    filingDate = new Date(travelRequest.date_filed);
  } else if (travelRequest.date_created) {
    filingDate = new Date(travelRequest.date_created);
  } else if (travelRequest.startDate) {
    // If no filing date is available, use the start date as a fallback
    filingDate = new Date(travelRequest.startDate);
  } else if (travelRequest.start_date) {
    filingDate = new Date(travelRequest.start_date);
  } else {
    // Last resort: use current date
    filingDate = new Date();
    console.log('No filing date found in travel request, using current date:', filingDate);
  }
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = filingDate.toLocaleDateString('en-US', options).toUpperCase();
  doc.text(formattedDate, (lineStartX + lineEndX) / 2, y, { align: 'center' });
  
  // Draw line under the date
  doc.setLineWidth(0.1);
  doc.line(lineStartX, y + 1, lineEndX, y + 1);
  
  // Add horizontal line
  y += 15;
  doc.setLineWidth(0.5);
  doc.line(20, y, doc.internal.pageSize.width - 20, y);
  
  // Add authorization text
  y += 15;
  doc.setFontSize(10);
  
  // Calculate the proper position for the authorization text
  const authTextX = 20;
  const authText = 'You are hereby authorized to travel and proceed to';
  doc.text(authText, authTextX, y);
  
  // Add department as the place to visit
  // Check all possible locations where department data might be stored
  let departmentData = null;
  
  // Check various possible structures based on API response
  if (travelRequest.department && Array.isArray(travelRequest.department)) {
    departmentData = travelRequest.department;
  } else if (travelRequest.departments && Array.isArray(travelRequest.departments)) {
    departmentData = travelRequest.departments;
  } else if (typeof travelRequest.department === 'string') {
    // If department is a string (possibly comma-separated), split it
    departmentData = travelRequest.department.split(',').map(d => d.trim());
  }
  
  // Format the department text
  const departmentText = departmentData ? departmentData.join(', ') : (travelRequest.destination || '');
  
  // Log for debugging
  console.log('Department data in PDF generator:', {
    departmentData,
    departmentText,
    travelRequest
  });
  
  // Define the line width and position for the department
  const departmentLineStartX = authTextX + doc.getTextWidth(authText) + 5; // Start right after the auth text
  const departmentLineEndX = doc.internal.pageSize.width - 20; // End at the right margin
  
  // Split long department text into multiple lines if needed
  const maxDepartmentWidth = departmentLineEndX - departmentLineStartX - 10; // Leave some margin
  const departmentLines = doc.splitTextToSize(departmentText, maxDepartmentWidth);
  
  // Calculate center position for text alignment
  const departmentCenterX = (departmentLineStartX + departmentLineEndX) / 2;
  
  // Keep track of original y position
  const originalY = y;
  
  // Add each line of the department text
  // If there's more than one line, position it above the line to ensure alignment
  if (departmentLines.length > 1) {
    // Calculate the position to start text so the last line is at the original y position
    const startY = originalY - ((departmentLines.length - 1) * 5);
    doc.text(departmentLines, departmentCenterX, startY, { align: 'center' });
  } else {
    // For single line, use the original position
    doc.text(departmentLines, departmentCenterX, originalY, { align: 'center' });
  }
  
  // Draw line under the destination text at the fixed position
  doc.setLineWidth(0.1);
  doc.line(departmentLineStartX, originalY + 1, departmentLineEndX, originalY + 1);
  
  // Add small text under the line
  const departmentY = originalY + 5;
  doc.setFontSize(8);
  doc.text('(Name of office or place to visit)', (departmentLineStartX + departmentLineEndX) / 2, departmentY, { align: 'center' });
  
  // Update the main y position to continue after the department section
  y = departmentY;
  
  // Add date of travel - completely restructured to avoid overlapping
  y += 10;
  doc.setFontSize(10);
  
  // First line: "on" with the date
  doc.text('on', 20, y);
  
  // Calculate position after "on"
  const travelDateX = 20 + doc.getTextWidth('on ');
  
  // Format travel date range
  let travelDate = '';
  
  // Check for various date field formats that might exist in the travel request
  if (travelRequest.startDate && travelRequest.endDate) {
    // Format: "Start Date - End Date"
    const startDate = new Date(travelRequest.startDate);
    const endDate = new Date(travelRequest.endDate);
    travelDate = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  } else if (travelRequest.start_date && travelRequest.end_date) {
    // Alternative field names
    const startDate = new Date(travelRequest.start_date);
    const endDate = new Date(travelRequest.end_date);
    travelDate = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  } else if (travelRequest.travel_date) {
    // Fallback to single date if that's all we have
    const date = new Date(travelRequest.travel_date);
    travelDate = date.toLocaleDateString('en-US', options);
  }
  
  // Log the date information for debugging
  console.log('Travel date information:', {
    travelDate,
    startDate: travelRequest.startDate || travelRequest.start_date,
    endDate: travelRequest.endDate || travelRequest.end_date,
    travel_date: travelRequest.travel_date
  });
  
  // Use a slightly smaller font size for the date range to ensure it fits
  const originalFontSize = doc.getFontSize();
  if (travelDate.length > 25) { // If it's a long date range
    doc.setFontSize(9); // Reduce font size slightly
  }
  
  // Calculate width for the line
  const travelDateWidth = Math.max(doc.getTextWidth(travelDate), 60);
  
  // Display the travel date centered above the line
  doc.text(travelDate, travelDateX + (travelDateWidth / 2), y, { align: 'center' });
  
  // Restore original font size
  doc.setFontSize(originalFontSize);
  
  // Add text for official transactions on the same line as the date
  // Calculate position after the date line
  const transactionTextX = travelDateX + travelDateWidth + 5;
  doc.text(', to do the following official transactions:', transactionTextX, y);
  
  // Draw line under the travel date
  doc.setLineWidth(0.1);
  doc.line(travelDateX, y + 1, travelDateX + travelDateWidth, y + 1);
  
  // Add small text under the date line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Date of actual travel)', travelDateX + (travelDateWidth / 2), y, { align: 'center' });
  
  // Add bullet points for purpose
  y += 10;
  
  // Purpose of travel
  const purpose = travelRequest.purpose || 'TEST NOTIFICATION';
  
  // Split the purpose text into chunks for the three bullet points
  let purposeChunks = [];
  
  if (purpose.length > 150) {
    // If the purpose is long, split it into roughly equal parts for the three bullet points
    const avgChunkSize = Math.ceil(purpose.length / 3);
    
    // Find natural break points (spaces) near the desired chunk sizes
    let startIndex = 0;
    
    for (let i = 0; i < 2; i++) { // We need 2 break points for 3 chunks
      let breakIndex = Math.min(startIndex + avgChunkSize, purpose.length);
      
      // Look for a space to break at
      if (breakIndex < purpose.length) {
        while (breakIndex > startIndex && purpose[breakIndex] !== ' ') {
          breakIndex--;
        }
        
        // If we couldn't find a space, just use the calculated break point
        if (breakIndex === startIndex) {
          breakIndex = Math.min(startIndex + avgChunkSize, purpose.length);
        }
      }
      
      purposeChunks.push(purpose.substring(startIndex, breakIndex).trim());
      startIndex = breakIndex;
    }
    
    // Add the remaining text as the last chunk
    purposeChunks.push(purpose.substring(startIndex).trim());
  } else {
    // If the purpose is short, just use it for the first bullet point
    purposeChunks = [purpose, '', ''];
  }
  
  // First bullet point
  doc.text('•', 20, y);
  if (purposeChunks[0]) {
    // Split long text to fit within the available width
    const maxWidth = 150;
    const lines = doc.splitTextToSize(purposeChunks[0], maxWidth);
    doc.text(lines, 30, y);
  }
  doc.line(30, y + 2, 180, y + 2);
  
  // Second bullet point
  y += 10;
  doc.text('•', 20, y);
  if (purposeChunks[1]) {
    const maxWidth = 150;
    const lines = doc.splitTextToSize(purposeChunks[1], maxWidth);
    doc.text(lines, 30, y);
  }
  doc.line(30, y + 2, 180, y + 2);
  
  // Third bullet point
  y += 10;
  doc.text('•', 20, y);
  if (purposeChunks[2]) {
    const maxWidth = 150;
    const lines = doc.splitTextToSize(purposeChunks[2], maxWidth);
    doc.text(lines, 30, y);
  }
  doc.line(30, y + 2, 180, y + 2);
  
  // Add signature line
  y += 20; // Reduced from 30 to save space
  
  // Get approver name from all possible sources in the travel request
  let approverName = '';
  let approverPosition = '';
  
  // We need to find the first approver based on hierarchy
  // For a teacher, this would be the Principal
  // For a principal, this would be the PSDS, etc.
  
  if (travelRequest.remarks) {
    // Log the remarks for debugging
    console.log('Remarks found:', travelRequest.remarks);
    
    // Split remarks by newline to get all remarks
    const remarkLines = travelRequest.remarks.split('\n');
    
    // Look for the first remark that contains an approver information
    // This would be the first approver in the hierarchy
    for (const remark of remarkLines) {
      // Extract the name and position from the remark - format: "Remark text - User Name (Position)"
      const remarksMatch = remark.match(/.*\s+-\s+([^(]+)\s+\((.*)\)/);
      if (remarksMatch && remarksMatch[1] && remarksMatch[2]) {
        // Check if this is a principal, PSDS, or other first-level approver
        const position = remarksMatch[2].trim().toUpperCase();
        if (position.includes('PRINCIPAL') || position.includes('PSDS') || 
            position.includes('HEAD') || position.includes('SUPERVISOR')) {
          approverName = remarksMatch[1].trim();
          approverPosition = remarksMatch[2].trim();
          console.log('First approver found in remarks:', approverName, approverPosition);
          break; // Found the first approver, no need to continue
        }
      }
    }
    
    // If no specific first approver was found, fall back to the first remark
    if (!approverName && remarkLines.length > 0) {
      const firstRemark = remarkLines[0];
      const remarksMatch = firstRemark.match(/.*\s+-\s+([^(]+)\s+\((.*)\)/);
      if (remarksMatch && remarksMatch[1] && remarksMatch[2]) {
        approverName = remarksMatch[1].trim();
        approverPosition = remarksMatch[2].trim();
        console.log('Using first remark as approver:', approverName, approverPosition);
      }
    }
  }
  
  // If no approver found in remarks, check other fields
  if (!approverName) {
    // Check if there's a user role to determine the likely approver
    if (travelRequest.user && travelRequest.user.role) {
      const userRole = travelRequest.user.role.toUpperCase();
      
      // Based on user role, set the appropriate first approver title
      if (userRole.includes('TEACHER')) {
        approverName = 'SCHOOL PRINCIPAL';
        approverPosition = 'Principal';
      } else if (userRole.includes('PRINCIPAL')) {
        approverName = 'PUBLIC SCHOOLS DISTRICT SUPERVISOR';
        approverPosition = 'PSDS';
      } else if (userRole.includes('PSDS')) {
        approverName = 'ASSISTANT SCHOOLS DIVISION SUPERINTENDENT';
        approverPosition = 'ASDS';
      } else {
        // Default fallback
        approverName = 'SCHOOL PRINCIPAL';
        approverPosition = 'Principal';
      }
    } else {
      // Check direct approver fields if user role is not available
      if (travelRequest.approver_name) {
        approverName = travelRequest.approver_name;
      } 
      // Check if there's an approver object with a name field
      else if (travelRequest.approver && travelRequest.approver.name) {
        approverName = travelRequest.approver.name;
      }
      // Check if there's an approved_by field
      else if (travelRequest.approved_by) {
        approverName = travelRequest.approved_by;
      }
      // Check if there's an approver object with first_name and last_name
      else if (travelRequest.approver && travelRequest.approver.first_name) {
        approverName = `${travelRequest.approver.first_name} ${travelRequest.approver.last_name || ''}`;
      }
      // For approved requests without an approver name, use a default
      else if (travelRequest.status === 'APPROVED') {
        approverName = 'SCHOOL PRINCIPAL';
      }
    }
  }
  
  // Log approver info for debugging
  console.log('Approver information:', {
    approverName,
    remarks: travelRequest.remarks,
    message: travelRequest.message,
    approver: travelRequest.approver,
    approved_by: travelRequest.approved_by,
    status: travelRequest.status
  });
  
  // Always display the approver name (even if empty) to ensure consistent positioning
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(approverName, doc.internal.pageSize.width - 40, y - 2, { align: 'center' }); // Moved closer to the line (y-2 instead of y-5)
  doc.setFont('helvetica', 'normal');
  
  // Draw the signature line
  doc.line(doc.internal.pageSize.width - 60, y, doc.internal.pageSize.width - 20, y);
  
  // Add text under signature line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Name of Issuing Authority)', doc.internal.pageSize.width - 40, y, { align: 'center' });
  
  // Add position title line
  y += 8;
  
  // Get position title from various sources, prioritizing the one extracted from remarks
  let positionTitle = approverPosition || 
                      (travelRequest.approver ? travelRequest.approver.position : '') || 
                      travelRequest.approver_position || 
                      (travelRequest.approver ? travelRequest.approver.role : '') || 
                      '';
  
  // Check for position in the message field if not found yet
  if (!positionTitle && travelRequest.message) {
    const positionMatch = travelRequest.message.match(/position: ([\w\s]+)/i);
    if (positionMatch && positionMatch[1]) {
      positionTitle = positionMatch[1].trim();
    }
  }
  
  // For testing - use a default value if nothing is found
  if (!positionTitle && approverName === 'SCHOOL PRINCIPAL') {
    positionTitle = 'SCHOOL PRINCIPAL';
  }
  
  // Log position info for debugging
  console.log('Position information:', {
    positionTitle,
    approverPosition,
    approverPositionFromObj: travelRequest.approver ? travelRequest.approver.position : null
  });
  
  // Always display the position title (even if empty) to ensure consistent positioning
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(positionTitle, doc.internal.pageSize.width - 40, y - 2, { align: 'center' }); // Moved closer to the line (y-2 instead of y-5)
  doc.setFont('helvetica', 'normal');
  
  // Draw the position title line
  doc.line(doc.internal.pageSize.width - 60, y, doc.internal.pageSize.width - 20, y);
  
  // Add text under position line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Position Title)', doc.internal.pageSize.width - 40, y, { align: 'center' });
  
  // Add disclaimer notes at the bottom of the page - reduced spacing
  y += 15; // Reduced from 20
  doc.setFontSize(6.5); // Reduced from 7
  doc.setFont('helvetica', 'italic');
  doc.text('* The issuing authority must verify the exigency of the travel and the form properly accomplished before affixing her/his signature.', 15, y);
  
  y += 4; // Reduced from 5
  doc.text('* This form shall apply to the usual travel to the Division Office and other government agencies to transact official business.', 15, y);
  
  y += 4; // Reduced from 5
  doc.text('* For purposes of attending formal activities, i.e. seminars, workshops, conferences, and the like, Annex A will apply as required', 15, y);
  y += 3;
  doc.text('under D.O. 44 s. 2022.', 15, y);
  
  y += 4; // Reduced from 5
  doc.text('* Not valid with erasures, superimpositions, and alterations.', 15, y);
  
  // Add electronic generation note
  y += 4;
  doc.text('* This is electronically generated.', 15, y);
  
  // Add footer with contact information - more compact layout
  y += 8; // Reduced from 10
  doc.setFontSize(7); // Reduced from 8
  doc.setFont('helvetica', 'normal');
  
  // Add Footer.png image at the bottom center, moved up to avoid cutting when printed
  try {
    const footerImg = new Image();
    footerImg.src = '/Footer.png';
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const imgWidth = 180;
    const imgHeight = 25;
    const x = (pageWidth - imgWidth) / 2;
    const footerY = pageHeight - imgHeight - 20; // 20 units from the bottom edge for safe print margin
    doc.addImage(footerImg, 'PNG', x, footerY, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding footer image:', error);
  }
  
  return doc;
};
