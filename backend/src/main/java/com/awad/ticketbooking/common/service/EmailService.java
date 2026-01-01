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
import com.awad.ticketbooking.common.utils.QrCodeUtils;
import org.springframework.core.io.ByteArrayResource;

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

            // Generate and attach QR Code
            byte[] qrCodeImage = QrCodeUtils.generateQrCodeImage(booking.getCode(), 200, 200);
            helper.addInline("qrcode", new ByteArrayResource(qrCodeImage), "image/png");

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
                            <img src="cid:qrcode" alt="QR Code" width="150" height="150" style="display: block; margin: 0 auto;"/>
                            <p style="margin: 5px 0 0 0;">Ma ve: <span style="font-weight: bold;">#%s</span></p>
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

    // @Async - Removed to ensure transactional consistency in scheduler
    public void sendTripReminderEmail(Booking booking, String recipientEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject(
                    "Nhắc nhở khởi hành - Chuyến đi " + booking.getTrip().getRoute().getOriginStation().getCity()
                            + " - " + booking.getTrip().getRoute().getDestinationStation().getCity());

            String content = """
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333333; text-align: center;">Nhắc nhở chuyến đi sắp tới</h2>
                            <p>Xin chào <strong>%s</strong>,</p>
                            <p>Đây là email nhắc nhở về chuyến đi của bạn vào ngày mai.</p>

                            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Mã vé:</strong> %s</p>
                                <p style="margin: 5px 0;"><strong>Tuyến đường:</strong> %s - %s</p>
                                <p style="margin: 5px 0;"><strong>Thời gian:</strong> %s %s</p>
                                <p style="margin: 5px 0;"><strong>Điểm đón:</strong> %s</p>
                                <p style="margin: 5px 0;"><strong>Nhà xe:</strong> %s (%s)</p>
                            </div>

                            <p>Vui lòng có mặt tại điểm đón trước <strong>15-30 phút</strong>.</p>
                            <p>Chúc bạn có một chuyến đi an toàn và vui vẻ!</p>

                            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #999999; text-align: center;">Đây là email tự động, vui lòng không trả lời.</p>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(
                            booking.getPassengerName(),
                            booking.getCode(),
                            booking.getTrip().getRoute().getOriginStation().getCity(),
                            booking.getTrip().getRoute().getDestinationStation().getCity(),
                            TIME_FORMATTER
                                    .format(booking.getTrip().getDepartureTime().atZone(ZoneId.of("Asia/Ho_Chi_Minh"))),
                            DATE_FORMATTER
                                    .format(booking.getTrip().getDepartureTime().atZone(ZoneId.of("Asia/Ho_Chi_Minh"))),
                            booking.getPickupStation().getName(),
                            booking.getTrip().getBus().getOperator().getName(),
                            booking.getTrip().getBus().getPlateNumber());

            helper.setText(content, true);

            mailSender.send(message);
            log.info("Reminder email sent to: {}", recipientEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send reminder email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Async
    public void sendActivationEmail(String recipientEmail, String name, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject("Kích hoạt tài khoản - Bus Ticket Booking");

            String activationLink = "http://localhost:5173/auth/activate?token=" + token; // Should be configurable

            String content = """
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333333; text-align: center;">Kích hoạt tài khoản</h2>
                            <p>Xin chào <strong>%s</strong>,</p>
                            <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:</p>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="%s" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Kích hoạt ngay</a>
                            </div>

                            <p>Hoặc truy cập liên kết sau:</p>
                            <p><a href="%s">%s</a></p>

                            <p>Link này sẽ hết hạn sau 24 giờ.</p>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(name, activationLink, activationLink, activationLink);

            helper.setText(content, true);

            mailSender.send(message);
            log.info("Activation email sent to: {}", recipientEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send activation email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String recipientEmail, String name, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(recipientEmail);
            helper.setSubject("Đặt lại mật khẩu - Bus Ticket Booking");

            String resetLink = "http://localhost:5173/auth/reset-password?token=" + token; // Should be configurable

            // TODO: Use frontend URL from properties

            String content = """
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333333; text-align: center;">Đặt lại mật khẩu</h2>
                            <p>Xin chào <strong>%s</strong>,</p>
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="%s" style="background-color: #dc3545; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
                            </div>

                            <p>Hoặc truy cập liên kết sau:</p>
                            <p><a href="%s">%s</a></p>

                            <p>Link này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                        </div>
                    </body>
                    </html>
                    """
                    .formatted(name, resetLink, resetLink, resetLink);

            helper.setText(content, true);

            mailSender.send(message);
            log.info("Password reset email sent to: {}", recipientEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send password reset email to {}: {}", recipientEmail, e.getMessage());
        }
    }
}
