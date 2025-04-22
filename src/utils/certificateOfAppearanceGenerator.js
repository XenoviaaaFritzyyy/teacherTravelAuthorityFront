import { jsPDF } from 'jspdf';

export const generateCertificateOfAppearancePDF = (travelRequest) => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set initial position
  let y = 20;
  
  // Add DepEd logo at the top center
  try {
    const logoImg = new Image();
    logoImg.src = '/depedlogo.png';
    
    const pageWidth = doc.internal.pageSize.width;
    const imgWidth = 20;
    const imgHeight = 20;
    const x = (pageWidth - imgWidth) / 2;
    doc.addImage(logoImg, 'PNG', x, y, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Add header text
  y += 25;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Republic of the Philippines', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  y += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Department of Education', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('REGION VII - CENTRAL VISAYAS', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  y += 5;
  doc.text('Division of Cebu Province', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  // Add title
  y += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF APPEARANCE', doc.internal.pageSize.width / 2, y, { align: 'center' });
  
  // Add form fields
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Name field
  doc.text('Name:', 30, y);
  const fullName = `${travelRequest.user?.first_name || ''} ${travelRequest.user?.last_name || ''}`.trim();
  doc.text(fullName, 105, y, { align: 'center' });
  doc.line(60, y + 1, 150, y + 1);
  
  // Date field
  y += 15;
  doc.text('Date:', 30, y);
  
  // Format date as MM/DD/YYYY using the travel request end date
  const travelDate = travelRequest.endDate ? new Date(travelRequest.endDate) : new Date();
  const formattedDate = formatDate(travelDate);
  doc.text(formattedDate, 105, y, { align: 'center' });
  doc.line(60, y + 1, 150, y + 1);
  
  // Purpose field
  y += 15;
  doc.text('Purpose:', 30, y);
  // Split purpose text if it's too long
  const maxWidth = 80;
  const purposeLines = doc.splitTextToSize(travelRequest.purpose || '', maxWidth);
  doc.text(purposeLines, 105, y, { align: 'center' });
  doc.line(60, y + 1, 150, y + 1);
  
  // Add certification text
  y += 25;
  doc.setFontSize(10);
  doc.text('This is to certify that the person named herewith appeared before this Office, with', 105, y, { align: 'center' });
  
  y += 10;
  doc.text('details as follows:', 105, y, { align: 'center' });
  
  // Add details
  y += 20;
  const labelX = 30;
  const valueX = 80;
  
  // Security Code
  doc.setFont('helvetica', 'bold');
  doc.text('Security Code:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(travelRequest.securityCode || '', valueX, y);
  
  // Position
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Position:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(travelRequest.user?.position || '', valueX, y);
  
  // School/Office
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('School/Office:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(travelRequest.user?.school_name || '', valueX, y);
  
  // Department
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Department(s):', labelX, y);
  doc.setFont('helvetica', 'normal');
  
  // Format department text
  let departmentText = '';
  if (travelRequest.department) {
    if (Array.isArray(travelRequest.department)) {
      departmentText = travelRequest.department.join(', ');
    } else {
      departmentText = travelRequest.department;
    }
  }
  doc.text(departmentText, valueX, y);
  
  // Travel Period
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Travel Period:', labelX, y);
  doc.setFont('helvetica', 'normal');
  
  // Format travel dates
  let travelPeriod = '';
  if (travelRequest.startDate && travelRequest.endDate) {
    const startDate = new Date(travelRequest.startDate);
    const endDate = new Date(travelRequest.endDate);
    travelPeriod = `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }
  doc.text(travelPeriod, valueX, y);
  
  // Add signature line
  y = doc.internal.pageSize.height - 50;
  doc.line(30, y, 90, y);

  // Fetch Administrative Officer name and position
  let approverName = '';
  let approverPosition = '';
  if (travelRequest.remarks) {
    const remarkLines = travelRequest.remarks.split('\n');
    for (const remark of remarkLines) {
      const remarksMatch = remark.match(/.*\s+-\s+([^(]+)\s+\((.*)\)/);
      if (remarksMatch && remarksMatch[1] && remarksMatch[2]) {
        approverName = remarksMatch[1].trim();
        approverPosition = remarksMatch[2].trim();
        break;
      }
    }
    // fallback to first remark if none matched
    if (!approverName && remarkLines.length > 0) {
      const firstRemark = remarkLines[0];
      const remarksMatch = firstRemark.match(/.*\s+-\s+([^(]+)\s+\((.*)\)/);
      if (remarksMatch && remarksMatch[1] && remarksMatch[2]) {
        approverName = remarksMatch[1].trim();
        approverPosition = remarksMatch[2].trim();
      }
    }
  }
  if (!approverName) {
    if (travelRequest.approver_name) {
      approverName = travelRequest.approver_name;
    } else if (travelRequest.approver && travelRequest.approver.name) {
      approverName = travelRequest.approver.name;
    } else if (travelRequest.approved_by) {
      approverName = travelRequest.approved_by;
    } else if (travelRequest.approver && travelRequest.approver.first_name) {
      approverName = `${travelRequest.approver.first_name} ${travelRequest.approver.last_name || ''}`;
    } else {
      approverName = '';
    }
  }
  if (!approverPosition) {
    approverPosition = 'Administrative Officer V';
  }
  doc.text(approverName || ' ', 60, y + 5, { align: 'center' });
  doc.text(approverPosition, 60, y + 10, { align: 'center' });
  
  // Add note at the bottom
  y = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.text('This certificate is issued as required for proof of appearance and for whatever legal', 105, y, { align: 'center' });
  y += 5;
  doc.text('purposes it may serve.', 105, y, { align: 'center' });
  
  return doc;
};

const formatDate = (date) => {
  if (!date) return '';
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
}; 