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
            helper.setSubject("Xác nhận đặt vé - #" + booking.getCode());
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

        String seats = booking.getTickets().stream()
                .map(Ticket::getSeatCode)
                .collect(Collectors.joining(", "));

        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Courier New', Courier, monospace; background-color: #ffffff; color: #000000; font-size: 14px; line-height: 1.5;">
                    <div style="max-width: 400px; margin: 0 auto; padding: 20px; border: 1px dashed #000000;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; font-size: 18px; font-weight: bold;">VE XE KHACH DIEN TU</h2>
                            <p style="margin: 5px 0 0 0;">E-TICKET</p>
                        </div>

                        <div style="text-align: center; margin-bottom: 20px;">
                            <p style="margin: 0;">Ma ve: <span style="font-weight: bold;">#%s</span></p>
                        </div>

                        <div style="border-bottom: 1px dashed #000000; margin-bottom: 15px;"></div>

                        <div style="text-align: center; margin-bottom: 15px;">
                            <p style="font-weight: bold; margin: 0; font-size: 16px;">%s</p>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Di tu (From):</span>
                            <span style="font-weight: bold; text-align: right;">%s</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <span>Den (To):</span>
                            <span style="font-weight: bold; text-align: right;">%s</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Ngay di (Date):</span>
                            <span style="font-weight: bold; text-align: right;">%s</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Gio di (Time):</span>
                            <span style="font-weight: bold; text-align: right;">%s</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <span>Xe (Bus):</span>
                            <span style="font-weight: bold; text-align: right;">%s</span>
                        </div>

                        <div style="border-bottom: 1px dashed #000000; margin-bottom: 15px;"></div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Hanh khach:</span>
                            <span style="font-weight: bold; text-align: right;">%s</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <span>SDT:</span>
                            <span style="font-weight: bold; text-align: right;">%s</span>
                        </div>

                        <div style="text-align: center; margin-bottom: 15px;">
                            <p style="margin: 0;">GHE (SEATS):</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">%s</p>
                        </div>

                        <div style="border-bottom: 1px dashed #000000; margin-bottom: 15px;"></div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <span>TONG TIEN (TOTAL):</span>
                            <span style="font-weight: bold; font-size: 16px;">%s</span>
                        </div>

                        <div style="text-align: center; font-size: 12px;">
                            <p style="margin: 0;">Vui long dua ve nay cho nhan vien nha xe.</p>
                            <p style="margin: 5px 0 0 0;">Cam on quy khach!</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        booking.getCode(),
                        trip.getBus().getOperator().getName().toUpperCase(),
                        route.getOriginStation().getCity(),
                        route.getDestinationStation().getCity(),
                        DATE_FORMATTER.format(departureTime),
                        TIME_FORMATTER.format(departureTime),
                        trip.getBus().getPlateNumber(),
                        booking.getPassengerName(),
                        booking.getPassengerPhone(),
                        seats,
                        CURRENCY_FORMATTER.format(booking.getTotalPrice()));
    }
}
