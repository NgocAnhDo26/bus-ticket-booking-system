import { jsPDF } from "jspdf";
import type { BookingResponse } from "../types";

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

export function generateETicketPDF(booking: BookingResponse) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const textColor = "#1f2937";
    const mutedColor = "#6b7280";

    let yPos = 20;

    // Header
    doc.setFillColor(37, 99, 235); // Primary blue
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("VE XE DIEN TU", pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("E-TICKET", pageWidth / 2, 35, { align: "center" });

    yPos = 60;

    // Booking ID
    doc.setTextColor(textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Ma dat ve:", 20, yPos);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`#${booking.id.slice(0, 8).toUpperCase()}`, 55, yPos);

    yPos += 15;

    // Status badge
    const statusText =
        booking.status === "CONFIRMED"
            ? "DA XAC NHAN"
            : booking.status === "PENDING"
                ? "CHO XAC NHAN"
                : "DA HUY";
    const statusColorRGB =
        booking.status === "CONFIRMED"
            ? [34, 197, 94]
            : booking.status === "PENDING"
                ? [234, 179, 8]
                : [239, 68, 68];

    doc.setFillColor(statusColorRGB[0], statusColorRGB[1], statusColorRGB[2]);
    doc.roundedRect(20, yPos - 5, 45, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(statusText, 42.5, yPos + 2, { align: "center" });

    yPos += 20;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 15;

    // Route section
    doc.setTextColor(mutedColor);
    doc.setFontSize(10);
    doc.text("HANH TRINH", 20, yPos);

    yPos += 10;

    // Origin
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("O", 22, yPos);
    doc.setTextColor(textColor);
    doc.text(booking.trip.route.originStation.name, 30, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.text(booking.trip.route.originStation.city, 30, yPos + 5);

    yPos += 20;

    // Arrow
    doc.setDrawColor(200, 200, 200);
    doc.line(22, yPos - 15, 22, yPos - 5);

    // Destination
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("O", 22, yPos);
    doc.setTextColor(textColor);
    doc.text(booking.trip.route.destinationStation.name, 30, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(mutedColor);
    doc.text(booking.trip.route.destinationStation.city, 30, yPos + 5);

    yPos += 25;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 15;

    // Trip details in 2 columns
    doc.setTextColor(mutedColor);
    doc.setFontSize(10);
    doc.text("NGAY DI", 20, yPos);
    doc.text("GIO KHOI HANH", 110, yPos);

    yPos += 8;

    doc.setTextColor(textColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(booking.trip.departureTime), 20, yPos);
    doc.text(formatTime(booking.trip.departureTime), 110, yPos);

    yPos += 15;

    doc.setTextColor(mutedColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("NHA XE", 20, yPos);
    doc.text("GIO DEN (DU KIEN)", 110, yPos);

    yPos += 8;

    doc.setTextColor(textColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(booking.trip.bus.operatorName, 20, yPos);
    doc.text(formatTime(booking.trip.arrivalTime), 110, yPos);

    yPos += 20;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 15;

    // Passenger info
    doc.setTextColor(mutedColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("THONG TIN HANH KHACH", 20, yPos);

    yPos += 10;

    doc.setTextColor(textColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(booking.passengerName, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor);
    doc.text(booking.passengerPhone, 80, yPos);

    yPos += 15;

    // Seats
    doc.setTextColor(mutedColor);
    doc.setFontSize(10);
    doc.text("GHE DA DAT", 20, yPos);

    yPos += 10;

    const seats = booking.tickets.map((t) => t.seatCode).join(", ");
    doc.setTextColor(textColor);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(seats, 20, yPos);

    yPos += 20;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 15;

    // Total price
    doc.setFillColor(240, 245, 255);
    doc.rect(20, yPos - 5, pageWidth - 40, 25, "F");

    doc.setTextColor(mutedColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TONG TIEN", 25, yPos + 5);

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(booking.totalPrice), pageWidth - 25, yPos + 10, {
        align: "right",
    });

    yPos += 40;

    // Footer
    doc.setTextColor(mutedColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
        "Vui long xuat trinh ve nay (ban in hoac dien tu) khi len xe.",
        pageWidth / 2,
        yPos,
        { align: "center" }
    );
    doc.text(`Ngay dat: ${formatDate(booking.createdAt)}`, pageWidth / 2, yPos + 8, {
        align: "center",
    });

    // Download the PDF
    doc.save(`ve-xe-${booking.id.slice(0, 8).toUpperCase()}.pdf`);
}
