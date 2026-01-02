import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

import type { BookingResponse } from '../types';

// Helper to remove Vietnamese accents for PDF compatibility
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTimeDisplay(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatCurrencyDisplay(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

// ... (existing imports)

export async function generateETicketPDF(booking: BookingResponse) {
  // A5 size for compact ticket (148 x 210 mm)
  const doc = new jsPDF({
    format: 'a5',
    unit: 'mm',
  }) as jsPDF & {
    setLineDash: (dashArray: number[], dashPhase?: number) => void;
  };

  const PageWidth = doc.internal.pageSize.getWidth();
  let y = 10;
  const leftMargin = 10;
  // const contentWidth = PageWidth - 20;

  // Helper for centered text
  const centerText = (text: string, yPos: number, size: number = 10, isBold: boolean = false) => {
    doc.setFontSize(size);
    doc.setFont('courier', isBold ? 'bold' : 'normal');
    doc.text(removeAccents(text), PageWidth / 2, yPos, { align: 'center' });
  };

  // Helper for left-right text row
  const row = (label: string, value: string, yPos: number, isBoldValue: boolean = false) => {
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.text(removeAccents(label), leftMargin, yPos);

    doc.setFont('courier', isBoldValue ? 'bold' : 'normal');
    doc.text(removeAccents(value), PageWidth - leftMargin, yPos, {
      align: 'right',
    });
  };

  // --- HEADER ---
  centerText('VE XE KHACH DIEN TU', y, 14, true);
  y += 5;
  centerText('E-TICKET', y, 10);
  y += 10;

  // QR Code Generation
  try {
    // Generate QR Code as DataURL
    const qrDataUrl = await QRCode.toDataURL(booking.code, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 150,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Add QR Code to PDF
    // Centered, size 30x30mm
    const qrSize = 30;
    const qrX = (PageWidth - qrSize) / 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
    y += qrSize + 5; // Advance y past the QR code
  } catch (err) {
    console.error('Error generating QR code for PDF:', err);
    // Fallback text if QR fails
    centerText('[QR Code Error]', y + 10, 8);
    y += 20;
  }

  centerText('Ma ve: ' + booking.code, y, 12, true);
  y += 10;

  // Dashed line
  doc.setLineDash([1, 1], 0);
  doc.line(leftMargin, y, PageWidth - leftMargin, y);
  doc.setLineDash([], 0);
  y += 7;

  // --- JOURNEY INFO ---
  centerText(booking.trip.bus.operatorName.toUpperCase(), y, 11, true);
  y += 8;

  row('Di tu (From):', booking.trip.route.originStation.city, y);
  y += 5;
  row('Den (To):', booking.trip.route.destinationStation.city, y);
  y += 8;

  row('Ngay di (Date):', formatDateDisplay(booking.trip.departureTime), y);
  y += 5;
  row('Gio di (Time):', formatTimeDisplay(booking.trip.departureTime), y);
  y += 8;

  row('Xe (Bus):', booking.trip.bus.plateNumber, y);
  y += 8;

  // Dashed line
  doc.setLineDash([1, 1], 0);
  doc.line(leftMargin, y, PageWidth - leftMargin, y);
  doc.setLineDash([], 0);
  y += 7;

  // --- PASSENGER INFO ---
  row('Hanh khach:', booking.passengerName, y, true);
  y += 5;
  row('SDT:', booking.passengerPhone, y);
  y += 5;
  if (booking.id) {
    // using id check as proxy
    // skip email check to keep it simple
  }

  y += 5;

  const seats = booking.tickets.map((t) => t.seatCode).join(', ');
  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  doc.text(`GHE (SEATS): ${seats}`, PageWidth / 2, y, { align: 'center' });
  y += 10;

  // Dashed line
  doc.setLineDash([1, 1], 0);
  doc.line(leftMargin, y, PageWidth - leftMargin, y);
  doc.setLineDash([], 0);
  y += 7;

  // --- PAYMENT ---
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.text('TONG TIEN (TOTAL):', leftMargin, y);

  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  doc.text(formatCurrencyDisplay(booking.totalPrice), PageWidth - leftMargin, y, {
    align: 'right',
  });

  y += 15;

  centerText('Vui long dua ve nay cho nhan vien nha xe.', y, 8);
  y += 4;
  centerText('Cam on quy khach!', y, 8);

  // Save
  doc.save(`ticket-${booking.code}.pdf`);
}
