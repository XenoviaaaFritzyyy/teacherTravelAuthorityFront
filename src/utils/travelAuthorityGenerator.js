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
  
  // Add DepEd logo at the top center
  try {
    const logoImg = new Image();
    logoImg.src = '/depedlogo.png';
    
    // Add the logo to the PDF - even smaller size
    const pageWidth = doc.internal.pageSize.width;
    const imgWidth = 18; // Reduced from 20
    const imgHeight = 18; // Reduced from 20
    const x = (pageWidth - imgWidth) / 2;
    doc.addImage(logoImg, 'PNG', x, y, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Add header text - further reduced spacing
  y += 18; // Reduced from 20
  doc.setFontSize(9); // Reduced from 10
  doc.setFont('helvetica', 'normal');
  doc.text('Republic of the Philippines', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  y += 3.5; // Reduced from 4
  doc.setFontSize(10); // Reduced from 11
  doc.setFont('helvetica', 'bold');
  doc.text('Department of Education', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  y += 3.5; // Reduced from 4
  doc.setFontSize(8.5); // Reduced from 9
  doc.setFont('helvetica', 'normal');
  doc.text('REGION VII - CENTRAL VISAYAS', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  y += 3.5; // Reduced from 4
  doc.text('Division of Cebu Province', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  // Add horizontal line
  y += 8;
  doc.setLineWidth(0.5);
  doc.line(20, y, doc.internal.pageSize.width - 20, y);
  
  // Add title
  y += 15;
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
  // Always use the current date for the filing date
  const filingDate = new Date();
  
  // Log the current date being used
  console.log('Using current date for filing date:', filingDate);
  
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
  doc.text('You are hereby authorized to travel and proceed to', 20, y);
  
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
  const departmentLineStartX = 100; // Start the line further to the right
  const departmentLineWidth = 80; // Fixed width for the line
  const departmentLineEndX = departmentLineStartX + departmentLineWidth;
  
  // Center the department text above the line
  doc.text(departmentText, (departmentLineStartX + departmentLineEndX) / 2, y, { align: 'center' });
  
  // Draw line under the department text
  doc.setLineWidth(0.1);
  doc.line(departmentLineStartX, y + 1, departmentLineEndX, y + 1);
  
  // Add small text under the line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Name of office or place to visit)', (departmentLineStartX + departmentLineEndX) / 2, y, { align: 'center' });
  
  // Add date of travel
  y += 10;
  doc.setFontSize(10);
  doc.text('on', 20, y);
  
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
  
  // Calculate position after "on"
  const travelDateX = 20 + doc.getTextWidth('on ');
  
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
  
  // Draw line under the travel date
  doc.setLineWidth(0.1);
  doc.line(travelDateX, y + 1, travelDateX + travelDateWidth, y + 1);
  
  // Add text for official transactions on the same line
  const transactionTextX = travelDateX + travelDateWidth + 5;
  doc.text(', to do the following official transactions:', transactionTextX, y);
  
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
  
  // First check if there are remarks that contain the approver name and position
  let approverPosition = '';
  
  if (travelRequest.remarks) {
    // Log the remarks for debugging
    console.log('Remarks found:', travelRequest.remarks);
    
    // Split remarks by newline to get the latest remark (which should be from the approver)
    const remarkLines = travelRequest.remarks.split('\n');
    const latestRemark = remarkLines[remarkLines.length - 1]; // Get the last remark
    
    // Extract the name and position from the remark - format: "Remark text - User Name (Position)"
    const remarksMatch = latestRemark.match(/.*\s+-\s+([^(]+)\s+\((.*)\)/);
    if (remarksMatch && remarksMatch[1] && remarksMatch[2]) {
      approverName = remarksMatch[1].trim();
      approverPosition = remarksMatch[2].trim();
      console.log('Name extracted from remarks:', approverName);
      console.log('Position extracted from remarks:', approverPosition);
    }
  }
  // Check direct approver fields if remarks didn't have the name
  else if (travelRequest.approver_name) {
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
  // Check for admin name in the message field
  else if (travelRequest.message) {
    const nameMatch = travelRequest.message.match(/approved by ([\w\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      approverName = nameMatch[1].trim();
    }
  }
  // Check if there's an approval_details object with approver_name
  else if (travelRequest.approval_details && travelRequest.approval_details.approver_name) {
    approverName = travelRequest.approval_details.approver_name;
  }
  // For approved requests without an approver name, use a default
  else if (travelRequest.status === 'APPROVED') {
    approverName = 'SCHOOL PRINCIPAL';
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
  
  // Add horizontal line
  y += 8; // Reduced from 10
  doc.setLineWidth(0.5);
  doc.line(15, y, doc.internal.pageSize.width - 15, y);
  
  // Add footer with contact information - more compact layout
  y += 8; // Reduced from 10
  doc.setFontSize(7); // Reduced from 8
  doc.setFont('helvetica', 'normal');
  
  // Add DepEd logo at the footer - smaller size
  try {
    const logoImg = new Image();
    logoImg.src = '/depedlogo.png';
    
    // Add the logo to the PDF - smaller size for footer
    const imgWidth = 8; // Reduced from 10
    const imgHeight = 8; // Reduced from 10
    doc.addImage(logoImg, 'PNG', 20, y, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding footer logo:', error);
  }
  
  // Add contact information - more compact layout
  const contactX = 32; // Reduced from 35
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', contactX, y);
  doc.setFont('helvetica', 'normal');
  doc.text('IPHO Bldg., Sudlon, Lahug, Cebu City', contactX + 18, y);
  
  y += 4; // Reduced from 5
  doc.setFont('helvetica', 'bold');
  doc.text('Telephone Nos.:', contactX, y);
  doc.setFont('helvetica', 'normal');
  doc.text('520-3216', contactX + 28, y);
  
  y += 4; // Reduced from 5
  doc.setFont('helvetica', 'bold');
  doc.text('Email Address:', contactX, y);
  doc.setFont('helvetica', 'normal');
  doc.text('depedcebuprovince@deped.gov.ph', contactX + 28, y);
  
  // Add a note about electronic generation
  y += 10; // Reduced from 15
  doc.setFontSize(7); // Reduced from 8
  doc.setFont('helvetica', 'italic');
  doc.text('This is an electronically generated document and does not require a signature.', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  return doc;
};
