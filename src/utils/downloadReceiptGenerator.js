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
  // Format date as MM/DD/YYYY
  const currentDate = new Date();
  const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;
  doc.line(75, y + 1, doc.internal.pageSize.width - 35, y + 1);
  doc.text(formattedDate, (75 + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });
  
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

  // Add signature text below the line
  y += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('JEREMY C. DEWAMPO, J.D.', (signX + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });
  y += 7;
  doc.text('Administrative Officer V', (signX + (doc.internal.pageSize.width - 35)) / 2, y, { align: 'center' });

  // Add note about validity - left aligned, below signature
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Note: Not valid with erasures, superimpositions or alterations.', 45, y);
  
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
