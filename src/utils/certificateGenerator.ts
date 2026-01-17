import jsPDF from 'jspdf';

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: Date;
  courseHours: number;
  certificateId?: string;
}

export function generateCertificatePDF(data: CertificateData): jsPDF {
  const { studentName, courseName, completionDate, courseHours, certificateId } = data;
  
  // Create landscape A4 PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Background gradient effect (simulated with rectangles)
  doc.setFillColor(250, 250, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(99, 102, 241); // Indigo
  doc.setLineWidth(3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  // Inner border
  doc.setLineWidth(0.5);
  doc.setDrawColor(168, 85, 247); // Purple
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Corner decorations
  drawCornerDecoration(doc, 20, 20);
  drawCornerDecoration(doc, pageWidth - 20, 20, true);
  drawCornerDecoration(doc, 20, pageHeight - 20, false, true);
  drawCornerDecoration(doc, pageWidth - 20, pageHeight - 20, true, true);

  // Header - Logo area
  doc.setFillColor(99, 102, 241);
  doc.circle(centerX, 35, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BN', centerX, 38, { align: 'center' });

  // Title
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO', centerX, 60, { align: 'center' });

  // Subtitle
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('DE CONCLUSÃO DE CURSO', centerX, 70, { align: 'center' });

  // Decorative line
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(1);
  doc.line(centerX - 50, 78, centerX + 50, 78);

  // Certificate text
  doc.setTextColor(55, 65, 81); // Gray-700
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Certificamos que', centerX, 95, { align: 'center' });

  // Student name
  doc.setTextColor(17, 24, 39); // Gray-900
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(studentName.toUpperCase(), centerX, 112, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(studentName.toUpperCase());
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(centerX - nameWidth/2 - 10, 116, centerX + nameWidth/2 + 10, 116);

  // Course completion text
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('concluiu com êxito o curso', centerX, 130, { align: 'center' });

  // Course name
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`"${courseName}"`, centerX, 145, { align: 'center' });

  // Course details
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const hoursText = `com carga horária de ${courseHours} horas`;
  doc.text(hoursText, centerX, 158, { align: 'center' });

  // Completion date
  const formattedDate = formatDate(completionDate);
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(11);
  doc.text(`Concluído em ${formattedDate}`, centerX, 168, { align: 'center' });

  // Signature area
  const signatureY = 185;
  
  // Left signature
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.3);
  doc.line(60, signatureY, 130, signatureY);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.text('Coordenação Pedagógica', 95, signatureY + 5, { align: 'center' });

  // Right signature
  doc.line(pageWidth - 130, signatureY, pageWidth - 60, signatureY);
  doc.text('Direção Geral', pageWidth - 95, signatureY + 5, { align: 'center' });

  // Footer with certificate ID
  if (certificateId) {
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text(`Certificado ID: ${certificateId}`, centerX, pageHeight - 18, { align: 'center' });
  }

  // Footer branding
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Universidade ByNeofolic', centerX, pageHeight - 12, { align: 'center' });

  return doc;
}

function drawCornerDecoration(doc: jsPDF, x: number, y: number, flipX = false, flipY = false) {
  const size = 15;
  const dirX = flipX ? -1 : 1;
  const dirY = flipY ? -1 : 1;

  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(1.5);
  
  // L-shaped corner
  doc.line(x, y, x + (size * dirX), y);
  doc.line(x, y, x, y + (size * dirY));
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('pt-BR', options);
}

export function downloadCertificate(data: CertificateData) {
  const doc = generateCertificatePDF(data);
  const fileName = `certificado-${data.courseName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}

export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}
