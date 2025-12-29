package com.awad.ticketbooking.modules.ai.service;

import com.awad.ticketbooking.modules.ai.dto.ChatRequest;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.ai.dto.ChatResponse;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.dto.TicketRequest;
import com.awad.ticketbooking.modules.booking.service.BookingService;
import com.awad.ticketbooking.modules.trip.service.TripService;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.google.genai.Client;
import com.google.genai.types.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiChatService {

        @Value("${gemini.api-key}")
        private String apiKey;

        private final TripService tripService;
        private final BookingService bookingService;
        private final UserRepository userRepository;
        private final ObjectMapper objectMapper;

        private static final String SYSTEM_PROMPT = """
                        You are "Vexere Assistant" (Trợ lý ảo Vexere), a comprehensive Customer Support & Booking Agent.

                        ====================
                        BUSINESS CONTEXT
                        ====================
                        This website allows users to:
                        1. Search for bus trips (origin, destination, date).
                        2. Book tickets (select seats, enter passenger info).
                        3. Manage bookings (History, Cancel).
                        4. Authentication (Login/Register) for better experience.

                        ====================
                        CORE RULES
                        ====================
                        1. Role: CUSTOMER SUPPORT
                        - Not just a booking bot. You help users with:
                          - Finding trips based on vague needs (e.g., "I want to go to beach").
                          - Explaining system features (How to cancel? How to pay?).
                          - Guiding Guest vs Logged-in users.
                        - Tone: Warm, helpful, proactive. Like a real human agent.

                        2. Booking Logic (CRITICAL)
                        - CHECK "User Context" at the start of the message.
                        - SCENARIO A: USER LOGGED IN
                          - DETECTED: "LOGGED_IN (Name: ..., Email: ...)"
                          - EXPLAIN: "Bạn là Người đặt (Account Owner)."
                          - ASK: "Bạn đặt cho chính mình hay đặt hộ người khác?"
                          - IF "Cho mình":
                            - Người đi = Người đặt.
                            - AUTO-FILL info (Name, Email) from context. Ask Phone if missing.
                          - IF "Đặt hộ / Cho người khác":
                            - Ask for **Người đi** info: Name, Phone, Email (to receive ticket).
                        - SCENARIO B: GUEST (Chưa đăng nhập)
                          - DETECTED: "GUEST"
                          - ACTION: Ask for **Người đi** info.
                          - EXPLAIN: "Vì bạn chưa đăng nhập, vui lòng cung cấp Email để nhận vé, và Họ tên/SĐT người đi để nhà xe liên hệ."

                        3. Process
                        - Step 1: CONSULT & SEARCH. Understand need -> `search_trips`.
                        - Step 2: ADVISE. Show trip details, available seats.
                        - Step 3: SELECT SEATS. User picks seats (e.g. A01, A02).
                        - Step 4: INFO COLLECTION (Apply Logic above).
                        - Step 5: CONFIRM & BOOK. Show summary -> Call `create_booking`.
                        - Step 6: PAYMENT. "Vé [Code] đang chờ thanh toán. Bạn hãy thanh toán ngay để giữ chỗ."

                        4. Knowledge Base (FAQs)
                        - Cancellation: "Hủy vé tại 'Lịch sử đặt vé' trước 24h."
                        - Payment: "PayOS (QR Code, Visa/Mastercard)."
                        - Account: "Đăng nhập giúp tự động điền thông tin và quản lý vé."

                        5. Tools
                        - `search_trips`: Flexible.
                        - `get_trip_details`: Check seats.
                        - `create_booking`: Making the reservation.
                        """;

        public AiChatService(TripService tripService, BookingService bookingService, UserRepository userRepository,
                        ObjectMapper objectMapper) {
                this.tripService = tripService;
                this.bookingService = bookingService;
                this.userRepository = userRepository;
                this.objectMapper = objectMapper;
        }

        public ChatResponse getChatResponse(ChatRequest request) {
                try {
                        Client client = new Client.Builder().apiKey(apiKey).build();

                        // Build Context String
                        StringBuilder contextBuilder = new StringBuilder();
                        contextBuilder.append("User Context: ");
                        if (request.getUserId() != null) {
                                userRepository.findById(request.getUserId()).ifPresentOrElse(
                                                user -> contextBuilder.append("LOGGED_IN (Name: ")
                                                                .append(user.getFullName()).append(", Email: ")
                                                                .append(user.getEmail()).append(")"),
                                                () -> contextBuilder.append("GUEST (Invalid ID)"));
                        } else {
                                contextBuilder.append("GUEST");
                        }
                        String fullMessage = contextBuilder.toString() + "\nUser Message: " + request.getMessage();

                        // 1. Tool: search_trips
                        FunctionDeclaration searchTool = FunctionDeclaration.builder()
                                        .name("search_trips")
                                        .description("Search for available bus trips. All parameters are optional.")
                                        .parameters(Schema.builder()
                                                        .type("OBJECT")
                                                        .properties(Map.of(
                                                                        "origin",
                                                                        Schema.builder().type("STRING")
                                                                                        .description("Departure city")
                                                                                        .build(),
                                                                        "destination",
                                                                        Schema.builder().type("STRING")
                                                                                        .description("Arrival city")
                                                                                        .build(),
                                                                        "date",
                                                                        Schema.builder().type("STRING")
                                                                                        .description("YYYY-MM-DD")
                                                                                        .build()))
                                                        // Removed "destination" and "date" from required list
                                                        .required(Collections.emptyList())
                                                        .build())
                                        .build();

                        // 2. Tool: get_trip_details
                        FunctionDeclaration detailsTool = FunctionDeclaration.builder()
                                        .name("get_trip_details")
                                        .description("Get details of a specific trip including available seats.")
                                        .parameters(Schema.builder()
                                                        .type("OBJECT")
                                                        .properties(Map.of(
                                                                        "tripId",
                                                                        Schema.builder().type("STRING").description(
                                                                                        "The UUID of the trip")
                                                                                        .build()))
                                                        .required(List.of("tripId"))
                                                        .build())
                                        .build();

                        // 3. Tool: create_booking
                        FunctionDeclaration bookingTool = FunctionDeclaration.builder()
                                        .name("create_booking")
                                        .description("Create a bus ticket booking.")
                                        .parameters(Schema.builder()
                                                        .type("OBJECT")
                                                        .properties(Map.of(
                                                                        "tripId",
                                                                        Schema.builder().type("STRING")
                                                                                        .description("Trip UUID")
                                                                                        .build(),
                                                                        "seatCodes",
                                                                        Schema.builder().type("ARRAY")
                                                                                        .items(Schema.builder()
                                                                                                        .type("STRING")
                                                                                                        .build())
                                                                                        .description("List of seat codes like ['A01', 'A02']")
                                                                                        .build(),
                                                                        "passengerName",
                                                                        Schema.builder().type("STRING").build(),
                                                                        "passengerPhone",
                                                                        Schema.builder().type("STRING").build(),
                                                                        "passengerEmail",
                                                                        Schema.builder().type("STRING").build(),
                                                                        "pickupStationId",
                                                                        Schema.builder().type("STRING")
                                                                                        .description("Optional UUID")
                                                                                        .build(),
                                                                        "dropoffStationId",
                                                                        Schema.builder().type("STRING")
                                                                                        .description("Optional UUID")
                                                                                        .build()))
                                                        .required(List.of("tripId", "seatCodes", "passengerName",
                                                                        "passengerPhone", "passengerEmail"))
                                                        .build())
                                        .build();

                        Tool toolObj = Tool.builder()
                                        .functionDeclarations(List.of(searchTool, detailsTool, bookingTool))
                                        .build();

                        GenerateContentConfig config = GenerateContentConfig.builder()
                                        .systemInstruction(Content.builder()
                                                        .parts(List.of(Part.builder().text(SYSTEM_PROMPT).build()))
                                                        .build())
                                        .tools(List.of(toolObj))
                                        .build();

                        // First turn
                        GenerateContentResponse response = client.models.generateContent("gemini-2.5-flash",
                                        fullMessage, config);

                        // Handle response
                        List<Candidate> candidates = response.candidates().orElse(Collections.emptyList());
                        if (candidates.isEmpty())
                                return new ChatResponse("Không có phản hồi.");

                        Candidate candidate = candidates.get(0);
                        Content content = candidate.content().orElse(null);
                        if (content == null)
                                return new ChatResponse("...");

                        // Check for Function Calls
                        List<Part> parts = content.parts().orElse(Collections.emptyList());
                        for (Part part : parts) {
                                FunctionCall fc = part.functionCall().orElse(null);
                                if (fc != null) {
                                        Map<String, Object> args = fc.args().orElse(Collections.emptyMap());
                                        String funcName = fc.name().orElse("");
                                        String toolResult = "";

                                        if ("search_trips".equals(funcName)) {
                                                toolResult = executeSearch((String) args.get("origin"),
                                                                (String) args.get("destination"),
                                                                (String) args.get("date"));
                                        } else if ("get_trip_details".equals(funcName)) {
                                                toolResult = executeGetTripDetails((String) args.get("tripId"));
                                        } else if ("create_booking".equals(funcName)) {
                                                // Safe extraction of list
                                                List<String> seats = new ArrayList<>();
                                                if (args.get("seatCodes") instanceof List) {
                                                        seats = ((List<?>) args.get("seatCodes")).stream()
                                                                        .map(Object::toString)
                                                                        .collect(Collectors.toList());
                                                }
                                                toolResult = executeCreateBooking(
                                                                (String) args.get("tripId"),
                                                                seats,
                                                                (String) args.get("passengerName"),
                                                                (String) args.get("passengerPhone"),
                                                                (String) args.get("passengerEmail"),
                                                                (String) args.get("pickupStationId"),
                                                                (String) args.get("dropoffStationId"),
                                                                request.getUserId());
                                        }

                                        // Send back to model
                                        List<Content> history = List.of(
                                                        Content.builder().role("user").parts(List.of(Part.builder()
                                                                        .text(fullMessage).build())).build(),
                                                        content,
                                                        Content.builder().role("function").parts(List.of(
                                                                        Part.builder().functionResponse(FunctionResponse
                                                                                        .builder()
                                                                                        .name(funcName)
                                                                                        .response(Map.of("content",
                                                                                                        toolResult))
                                                                                        .build()).build()))
                                                                        .build());

                                        GenerateContentResponse finalRes = client.models
                                                        .generateContent("gemini-2.5-flash", history, config);
                                        return new ChatResponse(finalRes.text());
                                }
                        }

                        return new ChatResponse(response.text());

                } catch (Exception e) {
                        e.printStackTrace();
                        return new ChatResponse("Lỗi hệ thống: " + e.getMessage());
                }
        }

        private String executeSearch(String origin, String destination, String dateStr) {
                try {
                        com.awad.ticketbooking.modules.trip.dto.SearchTripRequest searchRequest = new com.awad.ticketbooking.modules.trip.dto.SearchTripRequest();
                        searchRequest.setOrigin(origin);
                        searchRequest.setDestination(destination);
                        if (dateStr != null) {
                                try {
                                        searchRequest.setDate(java.time.LocalDate.parse(dateStr));
                                } catch (DateTimeParseException e) {
                                        return "Lỗi ngày. Định dạng: YYYY-MM-DD.";
                                }
                        }
                        var trips = tripService.searchTrips(searchRequest);
                        if (trips.isEmpty())
                                return "Không tìm thấy chuyến xe.";

                        List<Map<String, Object>> result = trips.getContent().stream().map(t -> {
                                Map<String, Object> map = new HashMap<>();
                                map.put("tripId", t.getId()); // Hidden for AI
                                map.put("route", t.getRoute().getOriginStation().getCity() + " - "
                                                + t.getRoute().getDestinationStation().getCity());
                                map.put("time", t.getDepartureTime().toString());
                                map.put("price", t.getTripPricings().isEmpty() ? "LH"
                                                : t.getTripPricings().get(0).getPrice());
                                map.put("bus", t.getBus().getOperator().getName() + " (" + t.getBus().getPlateNumber()
                                                + ")");
                                return map;
                        }).toList();

                        return objectMapper.writeValueAsString(result);
                } catch (Exception e) {
                        return "Lỗi: " + e.getMessage();
                }
        }

        private String executeGetTripDetails(String tripIdStr) {
                try {
                        UUID tripId = UUID.fromString(tripIdStr);
                        TripResponse trip = tripService.getTripById(tripId);
                        List<String> bookedSeats = bookingService.getBookedSeatsForTrip(tripId);

                        Map<String, Object> details = new HashMap<>();
                        details.put("tripId", trip.getId());
                        details.put("route", trip.getRoute().getOriginStation().getCity() + " -> "
                                        + trip.getRoute().getDestinationStation().getCity());
                        details.put("departure", trip.getDepartureTime().toString());
                        details.put("totalSeats", trip.getBus().getTotalSeats());
                        details.put("bookedSeats", bookedSeats);
                        details.put("prices", trip.getTripPricings()); // List of {seatType, price}
                        details.put("operator", trip.getBus().getOperator().getName());

                        return objectMapper.writeValueAsString(details);
                } catch (Exception e) {
                        return "Lỗi lấy chi tiết: " + e.getMessage();
                }
        }

        private String executeCreateBooking(String tripIdStr, List<String> seatCodes, String name, String phone,
                        String email, String pickupId, String dropoffId, UUID userId) {
                try {
                        UUID tripId = UUID.fromString(tripIdStr);

                        // Fetch trip to get price
                        TripResponse trip = tripService.getTripById(tripId);
                        BigDecimal pricePerSeat = BigDecimal.ZERO;
                        if (!trip.getTripPricings().isEmpty()) {
                                pricePerSeat = trip.getTripPricings().get(0).getPrice(); // Simple assumption
                        }

                        BigDecimal total = pricePerSeat.multiply(BigDecimal.valueOf(seatCodes.size()));

                        CreateBookingRequest req = new CreateBookingRequest();
                        req.setTripId(tripId);
                        req.setUserId(userId);
                        req.setPassengerName(name);
                        req.setPassengerPhone(phone);
                        req.setPassengerEmail(email);
                        req.setTotalPrice(total);
                        if (pickupId != null)
                                req.setPickupStationId(UUID.fromString(pickupId));
                        if (dropoffId != null)
                                req.setDropoffStationId(UUID.fromString(dropoffId));

                        List<TicketRequest> tickets = new ArrayList<>();
                        for (String code : seatCodes) {
                                TicketRequest t = new TicketRequest();
                                t.setSeatCode(code);
                                t.setPassengerName(name);
                                t.setPassengerPhone(phone);
                                t.setPrice(pricePerSeat);
                                tickets.add(t);
                        }
                        req.setTickets(tickets);

                        var booking = bookingService.createBooking(req);
                        return "Đặt vé thành công! Mã vé: " + booking.getCode() + ". Trạng thái: " + booking.getStatus()
                                        + ". Vui lòng thanh toán.";

                } catch (Exception e) {
                        return "Lỗi đặt vé: " + e.getMessage();
                }
        }
}
