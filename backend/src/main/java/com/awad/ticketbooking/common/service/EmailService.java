package com.awad.ticketbooking.common.service;

import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.entity.Ticket;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.from-name:Bus Ticket Booking}")
    private String fromName;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy",
            new Locale("vi", "VN"));
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

    @Async
    public void sendBookingConfirmationEmail(Booking booking, String recipientEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject("Xác nhận đặt vé - #" + booking.getId().toString().substring(0, 8).toUpperCase());
            helper.setText(buildEmailContent(booking), true);

            mailSender.send(message);
            log.info("Booking confirmation email sent to: {}", recipientEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    private String buildEmailContent(Booking booking) {
        var trip = booking.getTrip();
        var route = trip.getRoute();
        var departureTime = trip.getDepartureTime().atZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        var arrivalTime = trip.getArrivalTime().atZone(ZoneId.of("Asia/Ho_Chi_Minh"));

        String seats = booking.getTickets().stream()
                .map(Ticket::getSeatCode)
                .collect(Collectors.joining(", "));

        String statusColor = switch (booking.getStatus()) {
            case CONFIRMED -> "#22c55e";
            case PENDING -> "#eab308";
            case CANCELLED -> "#ef4444";
            case REFUNDED -> "#8b5cf6";
        };

        String statusText = switch (booking.getStatus()) {
            case CONFIRMED -> "ĐÃ XÁC NHẬN";
            case PENDING -> "CHỜ XÁC NHẬN";
            case CANCELLED -> "ĐÃ HỦY";
            case REFUNDED -> "ĐÃ HOÀN TIỀN";
        };

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #2563eb 0%%, #1d4ed8 100%%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">🚌 VÉ XE ĐIỆN TỬ</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">E-TICKET</p>
                        </div>

                        <!-- Main Content -->
                        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <!-- Booking ID & Status -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <p style="color: #6b7280; margin: 0; font-size: 12px;">Mã đặt vé</p>
                                    <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 20px; font-weight: bold; font-family: monospace;">#%s</p>
                                </div>
                                <span style="background-color: %s; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">%s</span>
                            </div>

                            <hr style="border: none; border-top: 2px dashed #e5e7eb; margin: 20px 0;">

                            <!-- Route -->
                            <div style="margin-bottom: 20px;">
                                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase;">Hành trình</p>
                                <div style="display: flex; align-items: flex-start;">
                                    <div style="display: flex; flex-direction: column; align-items: center; margin-right: 15px;">
                                        <div style="width: 12px; height: 12px; background-color: #2563eb; border-radius: 50%%;"></div>
                                        <div style="width: 2px; height: 30px; background-color: #e5e7eb;"></div>
                                        <div style="width: 12px; height: 12px; background-color: #22c55e; border-radius: 50%%;"></div>
                                    </div>
                                    <div>
                                        <p style="color: #1f2937; margin: 0; font-weight: 600;">%s</p>
                                        <p style="color: #6b7280; margin: 2px 0 15px 0; font-size: 14px;">%s</p>
                                        <p style="color: #1f2937; margin: 0; font-weight: 600;">%s</p>
                                        <p style="color: #6b7280; margin: 2px 0 0 0; font-size: 14px;">%s</p>
                                    </div>
                                </div>
                            </div>

                            <hr style="border: none; border-top: 2px dashed #e5e7eb; margin: 20px 0;">

                            <!-- Trip Details -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                                <div>
                                    <p style="color: #6b7280; margin: 0; font-size: 12px;">NGÀY ĐI</p>
                                    <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">%s</p>
                                </div>
                                <div>
                                    <p style="color: #6b7280; margin: 0; font-size: 12px;">GIỜ KHỞI HÀNH</p>
                                    <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">%s</p>
                                </div>
                                <div>
                                    <p style="color: #6b7280; margin: 0; font-size: 12px;">NHÀ XE</p>
                                    <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">%s</p>
                                </div>
                                <div>
                                    <p style="color: #6b7280; margin: 0; font-size: 12px;">GIỜ ĐẾN (DỰ KIẾN)</p>
                                    <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">%s</p>
                                </div>
                            </div>

                            <hr style="border: none; border-top: 2px dashed #e5e7eb; margin: 20px 0;">

                            <!-- Passenger & Seats -->
                            <div style="margin-bottom: 20px;">
                                <p style="color: #6b7280; margin: 0; font-size: 12px;">HÀNH KHÁCH</p>
                                <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">%s</p>
                                <p style="color: #6b7280; margin: 2px 0 0 0; font-size: 14px;">%s</p>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <p style="color: #6b7280; margin: 0; font-size: 12px;">GHẾ ĐÃ ĐẶT</p>
                                <p style="color: #2563eb; margin: 5px 0 0 0; font-size: 18px; font-weight: bold; font-family: monospace;">%s</p>
                            </div>

                            <hr style="border: none; border-top: 2px dashed #e5e7eb; margin: 20px 0;">

                            <!-- Total -->
                            <div style="background-color: #eff6ff; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #6b7280; font-size: 14px;">Tổng tiền</span>
                                <span style="color: #2563eb; font-size: 24px; font-weight: bold;">%s</span>
                            </div>

                            <!-- Footer Note -->
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
                                Vui lòng xuất trình vé này (bản in hoặc điện tử) khi lên xe.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; padding: 20px;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © 2024 Bus Ticket Booking System
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        booking.getId().toString().substring(0, 8).toUpperCase(),
                        statusColor,
                        statusText,
                        route.getOriginStation().getName(),
                        route.getOriginStation().getCity(),
                        route.getDestinationStation().getName(),
                        route.getDestinationStation().getCity(),
                        DATE_FORMATTER.format(departureTime),
                        TIME_FORMATTER.format(departureTime),
                        trip.getBus().getOperator().getName(),
                        TIME_FORMATTER.format(arrivalTime),
                        booking.getPassengerName(),
                        booking.getPassengerPhone(),
                        seats,
                        CURRENCY_FORMATTER.format(booking.getTotalPrice()));
    }
}
