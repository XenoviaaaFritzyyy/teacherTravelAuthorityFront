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
  doc.text('OFFICE OF THE PRINCIPAL', (lineStartX + lineEndX) / 2, y, { align: 'center' });
  
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
  const filingDate = new Date();
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
  
  // Add destination
  const destination = travelRequest.destination || '';
  const destinationX = 20 + doc.getTextWidth('You are hereby authorized to travel and proceed to ');
  doc.text(destination, destinationX, y);
  
  // Draw line under the destination
  const destinationWidth = Math.max(doc.getTextWidth(destination), 60);
  doc.setLineWidth(0.1);
  doc.line(destinationX, y + 1, destinationX + destinationWidth, y + 1);
  
  // Add small text under the line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Name of office or place to visit)', destinationX + (destinationWidth / 2), y, { align: 'center' });
  
  // Add date of travel
  y += 10;
  doc.setFontSize(10);
  doc.text('on', 20, y);
  
  // Format travel date
  let travelDate = '';
  if (travelRequest.travel_date) {
    const date = new Date(travelRequest.travel_date);
    travelDate = date.toLocaleDateString('en-US', options);
  }
  
  const travelDateX = 20 + doc.getTextWidth('on ');
  doc.text(travelDate, travelDateX, y);
  
  // Draw line under the travel date
  const travelDateWidth = Math.max(doc.getTextWidth(travelDate), 60);
  doc.setLineWidth(0.1);
  doc.line(travelDateX, y + 1, travelDateX + travelDateWidth, y + 1);
  
  // Add text for official transactions on the same line
  doc.setFontSize(10);
  const transactionTextX = travelDateX + travelDateWidth + 5;
  doc.text(', to do the following official transactions:', transactionTextX, y);
  
  // Add small text under the date line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Date of actual travel)', travelDateX + (travelDateWidth / 2), y, { align: 'center' });
  
  // Add bullet points for purpose
  y += 10;
  doc.text('•', 20, y);
  
  // Purpose of travel
  const purpose = travelRequest.purpose || 'TEST NOTIFICATION';
  doc.text(purpose, 30, y);
  
  // Draw line under the first purpose if not already filled
  if (!purpose || purpose === 'TEST NOTIFICATION') {
    doc.line(30, y + 2, 180, y + 2);
  }
  
  // Add empty bullet points for additional purposes
  y += 10;
  doc.text('•', 20, y);
  doc.line(30, y + 2, 180, y + 2);
  
  y += 10;
  doc.text('•', 20, y);
  doc.line(30, y + 2, 180, y + 2);
  
  // Add signature line
  y += 20; // Reduced from 30 to save space
  doc.line(doc.internal.pageSize.width - 60, y, doc.internal.pageSize.width - 20, y);
  
  // Add text under signature line
  y += 5;
  doc.setFontSize(8);
  doc.text('(Name of Issuing Authority)', doc.internal.pageSize.width - 40, y, { align: 'center' });
  
  // Add position title line
  y += 8;
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
