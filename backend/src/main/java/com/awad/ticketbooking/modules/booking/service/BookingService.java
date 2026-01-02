package com.awad.ticketbooking.modules.booking.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.dto.BookingResponse;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.dto.TicketRequest;
import com.awad.ticketbooking.modules.booking.dto.UpdateBookingRequest;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.entity.Ticket;
import com.awad.ticketbooking.modules.booking.dto.RefundCalculation;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.repository.TicketRepository;
import java.time.Instant;
import java.util.Set;
import java.util.Map;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import com.awad.ticketbooking.modules.booking.repository.BookingSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

        private final BookingRepository bookingRepository;
        private final TripRepository tripRepository;
        private final UserRepository userRepository;
        private final TicketRepository ticketRepository;
        private final StationRepository stationRepository;
        private final EmailService emailService;
        private final SeatLockService seatLockService;

        @Transactional
        public BookingResponse createBooking(CreateBookingRequest request) {
                Trip trip = tripRepository.findById(request.getTripId())
                                .orElseThrow(() -> new RuntimeException("Trip not found"));

                // User is optional - can be null for guest bookings
                User user = null;
                if (request.getUserId() != null) {
                        user = userRepository.findById(request.getUserId()).orElse(null);
                }

                // Validate seats are not already booked
                List<String> bookedSeats = ticketRepository.findBookedSeatCodesByTripId(request.getTripId());
                List<String> requestedSeats = request.getTickets().stream()
                                .map(TicketRequest::getSeatCode)
                                .collect(Collectors.toList());

                // Check for seat conflicts with "Self-Correction" logic
                List<Ticket> conflictingTickets = ticketRepository.findByBookingTripIdAndSeatCodeIn(request.getTripId(),
                                requestedSeats);

                if (!conflictingTickets.isEmpty()) {
                        // Check if these conflicts are all from ONE pending booking of THIS user
                        Map<UUID, List<Ticket>> ticketsByBookingId = conflictingTickets.stream()
                                        .collect(Collectors.groupingBy(t -> t.getBooking().getId()));

                        for (List<Ticket> tickets : ticketsByBookingId.values()) {
                                Booking existingBooking = tickets.get(0).getBooking();
                                boolean isSelfConflict = false;

                                // Check if it's a PENDING booking from the SAME user
                                if (existingBooking.getStatus() == BookingStatus.PENDING &&
                                                user != null && existingBooking.getUser() != null &&
                                                existingBooking.getUser().getId().equals(user.getId())) {
                                        isSelfConflict = true;
                                }

                                if (isSelfConflict) {
                                        // 1. Check if seats are IDENTICAL (Update Case)
                                        Set<String> existingSeats = existingBooking.getTickets().stream()
                                                        .map(Ticket::getSeatCode)
                                                        .collect(Collectors.toSet());
                                        Set<String> requestedSeatSet = new java.util.HashSet<>(requestedSeats);

                                        if (existingSeats.equals(requestedSeatSet)) {
                                                // Matches exactly -> Update this booking instead of creating new
                                                return updatePendingBooking(existingBooking, request);
                                        } else {
                                                // 2. Mismatch (User changed seats) -> "Self-Healing": Cancel old,
                                                // create new
                                                existingBooking.setStatus(BookingStatus.CANCELLED);
                                                bookingRepository.save(existingBooking);
                                        }
                                } else if (existingBooking.getStatus() == BookingStatus.PENDING
                                                || existingBooking.getStatus() == BookingStatus.CONFIRMED) {
                                        // Real conflict with another user/confirmed booking
                                        throw new RuntimeException(
                                                        "Seat " + tickets.get(0).getSeatCode() + " is already booked");
                                }
                        }
                }

                Booking booking = new Booking();
                booking.setTrip(trip);
                booking.setUser(user); // Can be null for guest
                booking.setPassengerName(request.getPassengerName());
                booking.setPassengerPhone(request.getPassengerPhone());
                booking.setPassengerIdNumber(request.getPassengerIdNumber());
                booking.setPassengerEmail(request.getPassengerEmail());
                booking.setStatus(BookingStatus.PENDING);

                // Validate Pickup/Dropoff
                com.awad.ticketbooking.modules.trip.entity.TripStop pickupStop = null;
                com.awad.ticketbooking.modules.trip.entity.TripStop dropoffStop = null;
                int pickupOrder = -1;
                int dropoffOrder = Integer.MAX_VALUE;

                // PICKUP LOGIC
                if (request.getPickupTripStopId() != null) {
                        // New flow: TripStop ID provided
                        final UUID id = request.getPickupTripStopId();
                        pickupStop = trip.getTripStops().stream()
                                        .filter(ts -> ts.getId().equals(id))
                                        .findFirst()
                                        .orElseThrow(() -> new RuntimeException("Invalid pickup trip stop ID"));

                        pickupOrder = pickupStop.getStopOrder();
                        booking.setPickupTripStop(pickupStop);
                        booking.setPickupStation(pickupStop.getStation());

                } else if (request.getPickupStationId() != null) {
                        // Legacy flow: Station ID provided
                        final UUID id = request.getPickupStationId();

                        if (trip.getRoute().getOriginStation().getId().equals(id)) {
                                // Origin Station
                                booking.setPickupStation(trip.getRoute().getOriginStation());
                                pickupOrder = 0;
                        } else {
                                // Find TripStop by Station ID
                                pickupStop = trip.getTripStops().stream()
                                                .filter(ts -> ts.getStation() != null
                                                                && ts.getStation().getId().equals(id))
                                                .findFirst()
                                                .orElse(null);

                                if (pickupStop != null) {
                                        pickupOrder = pickupStop.getStopOrder();
                                        booking.setPickupTripStop(pickupStop);
                                        booking.setPickupStation(pickupStop.getStation());
                                } else {
                                        // If station ID valid but not a trip stop, fallback or error?
                                        // For safety, let's treat it as valid station if found in route stops, but for
                                        // Booking we prefer TripStop linkage
                                        // If not found in TripStops, we can try RouteStops but we are deprecating that
                                        // link in Booking entity (maybe?)
                                        // For now, assume if user selected it, it should exist in TripStops or be
                                        // Origin.
                                        throw new RuntimeException("Invalid pickup station for this trip");
                                }
                        }
                } else {
                        // Default: Origin
                        booking.setPickupStation(trip.getRoute().getOriginStation());
                        pickupOrder = 0;
                }

                // DROPOFF LOGIC
                if (request.getDropoffTripStopId() != null) {
                        // New flow: TripStop ID provided
                        final UUID id = request.getDropoffTripStopId();
                        dropoffStop = trip.getTripStops().stream()
                                        .filter(ts -> ts.getId().equals(id))
                                        .findFirst()
                                        .orElseThrow(() -> new RuntimeException("Invalid dropoff trip stop ID"));

                        dropoffOrder = dropoffStop.getStopOrder();
                        booking.setDropoffTripStop(dropoffStop);
                        booking.setDropoffStation(dropoffStop.getStation());

                } else if (request.getDropoffStationId() != null) {
                        // Legacy flow: Station ID provided
                        final UUID id = request.getDropoffStationId();

                        if (trip.getRoute().getDestinationStation().getId().equals(id)) {
                                // Destination Station
                                booking.setDropoffStation(trip.getRoute().getDestinationStation());
                                dropoffOrder = Integer.MAX_VALUE;
                        } else {
                                // Find TripStop by Station ID
                                dropoffStop = trip.getTripStops().stream()
                                                .filter(ts -> ts.getStation() != null
                                                                && ts.getStation().getId().equals(id))
                                                .findFirst()
                                                .orElse(null);

                                if (dropoffStop != null) {
                                        dropoffOrder = dropoffStop.getStopOrder();
                                        booking.setDropoffTripStop(dropoffStop);
                                        booking.setDropoffStation(dropoffStop.getStation());
                                } else {
                                        throw new RuntimeException("Invalid dropoff station for this trip");
                                }
                        }
                } else {
                        // Default: Destination
                        booking.setDropoffStation(trip.getRoute().getDestinationStation());
                        dropoffOrder = Integer.MAX_VALUE;
                }

                if (pickupOrder >= dropoffOrder) {
                        throw new RuntimeException("Pickup station must be before dropoff station");
                }

                // Generate unique booking code with retry
                String bookingCode = generateBookingCode();
                int maxRetries = 5;
                while (bookingRepository.findByCode(bookingCode).isPresent() && maxRetries > 0) {
                        bookingCode = generateBookingCode();
                        maxRetries--;
                }
                if (maxRetries == 0) {
                        throw new RuntimeException("Failed to generate unique booking code. Please try again.");
                }
                booking.setCode(bookingCode);

                booking.setTickets(request.getTickets().stream().map(ticketReq ->

                mapTicket(ticketReq, booking))
                                .collect(Collectors.toList()));

                BigDecimal calculatedTotal = booking.getTickets().stream()
                                .map(Ticket::getPrice)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                booking.setTotalPrice(calculatedTotal);

                Booking savedBooking = bookingRepository.save(booking);

                // Broadcast BOOKED status to WebSocket clients
                List<String> seatCodes = savedBooking.getTickets().stream()
                                .map(Ticket::getSeatCode)
                                .collect(Collectors.toList());
                seatLockService.markSeatsAsBooked(trip.getId(), seatCodes);

                return toBookingResponse(savedBooking);
        }

        private BookingResponse updatePendingBooking(Booking booking, CreateBookingRequest request) {
                booking.setPassengerName(request.getPassengerName());
                booking.setPassengerPhone(request.getPassengerPhone());
                booking.setPassengerEmail(request.getPassengerEmail());

                // Update Pickup/Dropoff
                Trip trip = booking.getTrip();
                Station pickupStation = null;
                if (request.getPickupStationId() != null) {
                        if (request.getPickupStationId().equals(trip.getRoute().getOriginStation().getId())) {
                                pickupStation = trip.getRoute().getOriginStation();
                        } else {
                                java.util.stream.Stream<? extends Object> stopsStream = (trip.getTripStops() != null
                                                && !trip.getTripStops().isEmpty())
                                                                ? trip.getTripStops().stream()
                                                                : trip.getRoute().getStops().stream();

                                var stopObj = stopsStream
                                                .filter(s -> {
                                                        if (s instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                                return ((com.awad.ticketbooking.modules.trip.entity.TripStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getPickupStationId());
                                                        } else {
                                                                return ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getPickupStationId());
                                                        }
                                                })
                                                .findFirst().orElse(null);

                                if (stopObj != null) {
                                        if (stopObj instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                pickupStation = ((com.awad.ticketbooking.modules.trip.entity.TripStop) stopObj)
                                                                .getStation();
                                        } else {
                                                pickupStation = ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) stopObj)
                                                                .getStation();
                                        }
                                }
                        }
                } else {
                        pickupStation = trip.getRoute().getOriginStation();
                }
                booking.setPickupStation(pickupStation);

                Station dropoffStation = null;
                if (request.getDropoffStationId() != null) {
                        if (request.getDropoffStationId().equals(trip.getRoute().getDestinationStation().getId())) {
                                dropoffStation = trip.getRoute().getDestinationStation();
                        } else {
                                java.util.stream.Stream<? extends Object> stopsStream = (trip.getTripStops() != null
                                                && !trip.getTripStops().isEmpty())
                                                                ? trip.getTripStops().stream()
                                                                : trip.getRoute().getStops().stream();

                                var stopObj = stopsStream
                                                .filter(s -> {
                                                        if (s instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                                return ((com.awad.ticketbooking.modules.trip.entity.TripStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getDropoffStationId());
                                                        } else {
                                                                return ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getDropoffStationId());
                                                        }
                                                })
                                                .findFirst().orElse(null);

                                if (stopObj != null) {
                                        if (stopObj instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                dropoffStation = ((com.awad.ticketbooking.modules.trip.entity.TripStop) stopObj)
                                                                .getStation();
                                        } else {
                                                dropoffStation = ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) stopObj)
                                                                .getStation();
                                        }
                                }
                        }
                } else {
                        dropoffStation = trip.getRoute().getDestinationStation();
                }
                booking.setDropoffStation(dropoffStation);

                return toBookingResponse(bookingRepository.save(booking));
        }

        private String generateBookingCode() {
                String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                StringBuilder code = new StringBuilder("BK-");
                java.util.Random rnd = new java.util.Random();
                for (int i = 0; i < 6; i++) {
                        code.append(chars.charAt(rnd.nextInt(chars.length())));
                }
                return code.toString();
        }

        @Transactional(readOnly = true)
        public BookingResponse lookupBooking(String code, String email) {
                Booking booking = bookingRepository.findByCode(code)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                String bookingEmail = booking.getPassengerEmail();
                if (bookingEmail == null && booking.getUser() != null) {
                        bookingEmail = booking.getUser().getEmail();
                }

                if (bookingEmail == null || !bookingEmail.equalsIgnoreCase(email)) {
                        throw new RuntimeException("Booking not found or email does not match");
                }

                return toBookingResponse(booking);
        }

        @Transactional(readOnly = true)
        public BookingResponse getBookingById(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));
                return toBookingResponse(booking);
        }

        @Transactional(readOnly = true)
        public Page<BookingResponse> getUserBookings(UUID userId, Pageable pageable) {
                return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                                .map(this::toBookingResponse);
        }

        @Transactional(readOnly = true)
        public Page<BookingResponse> getAdminBookings(String search, List<BookingStatus> statuses,
                        java.time.Instant startDate, java.time.Instant endDate, Pageable pageable) {
                Specification<Booking> spec = BookingSpecification.withFilters(search, statuses, startDate, endDate);
                return bookingRepository.findAll(spec, pageable).map(this::toBookingResponse);
        }

        @Transactional(readOnly = true)
        public List<String> getBookedSeatsForTrip(UUID tripId) {
                return ticketRepository.findBookedSeatCodesByTripId(tripId);
        }

        public BookingResponse confirmBooking(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() != BookingStatus.PENDING) {
                        throw new RuntimeException("Only pending bookings can be confirmed");
                }

                booking.setStatus(BookingStatus.CONFIRMED);
                Booking savedBooking = bookingRepository.save(booking);

                // Determine email for confirmation
                String recipientEmail = booking.getPassengerEmail();
                if (recipientEmail == null && booking.getUser() != null) {
                        recipientEmail = booking.getUser().getEmail();
                }

                // Send confirmation email if we have an email
                if (recipientEmail != null && !recipientEmail.isBlank()) {
                        Booking bookingForEmail = bookingRepository.findByIdWithFullDetails(savedBooking.getId())
                                        .orElse(savedBooking);
                        emailService.sendBookingConfirmationEmail(bookingForEmail, recipientEmail);
                }

                return toBookingResponse(savedBooking);
        }

        @Transactional
        public BookingResponse cancelBooking(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() == BookingStatus.CANCELLED) {
                        throw new RuntimeException("Booking is already cancelled");
                }

                if (booking.getStatus() == BookingStatus.CONFIRMED) {
                        // Check if trip hasn't departed yet
                        if (booking.getTrip().getDepartureTime().isBefore(java.time.Instant.now())) {
                                throw new RuntimeException("Cannot cancel booking for departed trip");
                        }

                        // Check refund eligibility
                        RefundCalculation refundCalc = calculateRefund(bookingId);
                        if (refundCalc.isRefundable()) {
                                // If refundable, we process it as a refund
                                return refundBooking(bookingId);
                        }
                }

                // Delete tickets to release seats
                List<String> seatCodes = booking.getTickets().stream()
                                .map(Ticket::getSeatCode)
                                .collect(Collectors.toList());

                // Release Redis locks
                seatLockService.unlockSeatsForBooking(booking.getTrip().getId(), seatCodes);

                booking.setStatus(BookingStatus.CANCELLED);
                return toBookingResponse(bookingRepository.save(booking));
        }

        @Transactional(readOnly = true)
        public RefundCalculation calculateRefund(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                Instant now = Instant.now();
                Instant departureTime = booking.getTrip().getDepartureTime();

                // Policy: 100% refund if > 24 hours before departure
                // 0% refund if <= 24 hours
                long hoursUntilDeparture = java.time.Duration.between(now, departureTime).toHours();

                boolean isRefundable = hoursUntilDeparture > 24;
                double refundPercentage = isRefundable ? 100.0 : 0.0;
                BigDecimal refundAmount = isRefundable ? booking.getTotalPrice() : BigDecimal.ZERO;

                String policyDesc = isRefundable
                                ? "Hoàn tiền 100% vì hủy trước 24h khởi hành."
                                : "Không hoàn tiền vì hủy trong vòng 24h trước khởi hành.";

                return RefundCalculation.builder()
                                .refundAmount(refundAmount)
                                .refundPercentage(refundPercentage)
                                .policyDescription(policyDesc)
                                .isRefundable(isRefundable)
                                .build();
        }

        @Transactional
        public BookingResponse refundBooking(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() != BookingStatus.CONFIRMED) {
                        // Allow refunding cancelled bookings if they were previously paid?
                        // Ideally refund is for CONFIRMED. If CANCELLED, it might have been
                        // auto-cancelled without refund.
                        // Let's stick to CONFIRMED or CANCELLED (if manual refund is needed after
                        // cancellation)
                        // But requirements say "Process refunds: Handle refund requests". usually for
                        // confirmed.
                        // Safety: Ensure it's not already refunded or pending.
                        if (booking.getStatus() == BookingStatus.REFUNDED) {
                                throw new RuntimeException("Booking is already refunded");
                        }
                        if (booking.getStatus() == BookingStatus.PENDING) {
                                throw new RuntimeException("Cannot refund a pending booking");
                        }
                }

                // Delete tickets to release seats if not already released (e.g. if CONFIRMED)
                if (!booking.getTickets().isEmpty()) {
                        List<String> seatCodes = booking.getTickets().stream()
                                        .map(Ticket::getSeatCode)
                                        .collect(Collectors.toList());

                        // Tickets are preserved for history using the new repository filter logic
                        // ticketRepository.deleteAll(booking.getTickets());
                        // booking.getTickets().clear();

                        if (booking.getTrip() != null) {
                                seatLockService.unlockSeatsForBooking(booking.getTrip().getId(), seatCodes);
                        }
                }

                booking.setStatus(BookingStatus.REFUNDED);
                Booking savedBooking = bookingRepository.save(booking);

                // Determine email for notification
                String recipientEmail = booking.getPassengerEmail();
                if (recipientEmail == null && booking.getUser() != null) {
                        recipientEmail = booking.getUser().getEmail();
                }

                // Send Refund Email (We can use a generic notification or create a new one. For
                // now, log it)
                // Ideally we should add sendRefundEmail to EmailService.
                if (recipientEmail != null) {
                        // TODO: Add specific refund email template
                        // emailService.sendRefundNotification(booking, recipientEmail);
                }

                return toBookingResponse(savedBooking);
        }

        private Ticket mapTicket(TicketRequest ticketReq, Booking booking) {
                Ticket ticket = new Ticket();
                ticket.setBooking(booking);
                ticket.setSeatCode(ticketReq.getSeatCode());
                ticket.setPassengerName(ticketReq.getPassengerName());
                ticket.setPassengerPhone(ticketReq.getPassengerPhone());
                ticket.setPassengerIdNumber(ticketReq.getPassengerIdNumber());
                ticket.setPrice(ticketReq.getPrice());
                return ticket;
        }

        @Transactional
        public BookingResponse updateBooking(UUID bookingId, UpdateBookingRequest request) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() != BookingStatus.PENDING) {
                        throw new RuntimeException("Only pending bookings can be updated");
                }

                // Update passenger details
                booking.setPassengerName(request.getPassengerName());
                booking.setPassengerPhone(request.getPassengerPhone());
                booking.setPassengerEmail(request.getPassengerEmail());

                Trip trip = booking.getTrip();

                // Update Pickup Station
                if (request.getPickupStationId() != null) {
                        Station pickupStation = null;
                        if (request.getPickupStationId().equals(trip.getRoute().getOriginStation().getId())) {
                                pickupStation = trip.getRoute().getOriginStation();
                        } else {
                                java.util.stream.Stream<? extends Object> stopsStream = (trip.getTripStops() != null
                                                && !trip.getTripStops().isEmpty())
                                                                ? trip.getTripStops().stream()
                                                                : trip.getRoute().getStops().stream();

                                var stopObj = stopsStream
                                                .filter(s -> {
                                                        if (s instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                                return ((com.awad.ticketbooking.modules.trip.entity.TripStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getPickupStationId());
                                                        } else {
                                                                return ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getPickupStationId());
                                                        }
                                                })
                                                .findFirst().orElse(null);

                                if (stopObj != null) {
                                        if (stopObj instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                pickupStation = ((com.awad.ticketbooking.modules.trip.entity.TripStop) stopObj)
                                                                .getStation();
                                        } else {
                                                pickupStation = ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) stopObj)
                                                                .getStation();
                                        }
                                }
                        }
                        if (pickupStation != null) {
                                booking.setPickupStation(pickupStation);
                        }
                }

                // Update Dropoff Station
                if (request.getDropoffStationId() != null) {
                        Station dropoffStation = null;
                        if (request.getDropoffStationId().equals(trip.getRoute().getDestinationStation().getId())) {
                                dropoffStation = trip.getRoute().getDestinationStation();
                        } else {
                                java.util.stream.Stream<? extends Object> stopsStream = (trip.getTripStops() != null
                                                && !trip.getTripStops().isEmpty())
                                                                ? trip.getTripStops().stream()
                                                                : trip.getRoute().getStops().stream();

                                var stopObj = stopsStream
                                                .filter(s -> {
                                                        if (s instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                                return ((com.awad.ticketbooking.modules.trip.entity.TripStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getDropoffStationId());
                                                        } else {
                                                                return ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) s)
                                                                                .getStation().getId()
                                                                                .equals(request.getDropoffStationId());
                                                        }
                                                })
                                                .findFirst().orElse(null);

                                if (stopObj != null) {
                                        if (stopObj instanceof com.awad.ticketbooking.modules.trip.entity.TripStop) {
                                                dropoffStation = ((com.awad.ticketbooking.modules.trip.entity.TripStop) stopObj)
                                                                .getStation();
                                        } else {
                                                dropoffStation = ((com.awad.ticketbooking.modules.catalog.entity.RouteStop) stopObj)
                                                                .getStation();
                                        }
                                }
                        }
                        if (dropoffStation != null) {
                                booking.setDropoffStation(dropoffStation);
                        }
                }

                // Update tickets (seats) if provided
                if (request.getTickets() != null && !request.getTickets().isEmpty()) {
                        List<String> requestedSeats = request.getTickets().stream()
                                        .map(TicketRequest::getSeatCode)
                                        .collect(Collectors.toList());

                        // Check for seat conflicts (excluding this booking's tickets)
                        List<Ticket> conflictingTickets = ticketRepository
                                        .findByBookingTripIdAndSeatCodeIn(booking.getTrip().getId(), requestedSeats);

                        boolean hasRealConflict = conflictingTickets.stream()
                                        .anyMatch(t -> !t.getBooking().getId().equals(bookingId));

                        if (hasRealConflict) {
                                throw new RuntimeException("One or more seats are already booked by another user");
                        }

                        // Replace tickets
                        List<Ticket> newTickets = request.getTickets().stream()
                                        .map(ticketReq -> mapTicket(ticketReq, booking))
                                        .collect(Collectors.toList());

                        booking.getTickets().clear();
                        booking.getTickets().addAll(newTickets);

                        // Recalculate total price
                        BigDecimal calculatedTotal = newTickets.stream()
                                        .map(Ticket::getPrice)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                        booking.setTotalPrice(calculatedTotal);
                }

                Booking savedBooking = bookingRepository.save(booking);
                return toBookingResponse(savedBooking);
        }

        private BookingResponse toBookingResponse(Booking booking) {
                Trip trip = booking.getTrip();

                BookingResponse.TripInfo tripInfo = BookingResponse.TripInfo.builder()
                                .id(trip.getId())
                                .departureTime(trip.getDepartureTime())
                                .arrivalTime(trip.getArrivalTime())
                                .route(BookingResponse.RouteInfo.builder()
                                                .id(trip.getRoute().getId())
                                                .originStation(BookingResponse.StationInfo.builder()
                                                                .id(trip.getRoute().getOriginStation()
                                                                                .getId())
                                                                .name(trip.getRoute().getOriginStation()
                                                                                .getName())
                                                                .city(trip.getRoute().getOriginStation()
                                                                                .getCity())
                                                                .address(trip.getRoute()
                                                                                .getOriginStation()
                                                                                .getAddress())
                                                                .build())
                                                .destinationStation(BookingResponse.StationInfo
                                                                .builder()
                                                                .id(trip.getRoute()
                                                                                .getDestinationStation()
                                                                                .getId())
                                                                .name(trip.getRoute()
                                                                                .getDestinationStation()
                                                                                .getName())
                                                                .city(trip.getRoute()
                                                                                .getDestinationStation()
                                                                                .getCity())
                                                                .address(trip.getRoute()
                                                                                .getDestinationStation()
                                                                                .getAddress())
                                                                .build())
                                                .durationMinutes(trip.getRoute().getDurationMinutes())
                                                .build())
                                .bus(BookingResponse.BusInfo.builder()
                                                .id(trip.getBus().getId())
                                                .plateNumber(trip.getBus().getPlateNumber())
                                                .operatorName(trip.getBus().getOperator().getName())
                                                .busLayoutId(trip.getBus().getBusLayout() != null
                                                                ? trip.getBus().getBusLayout().getId()
                                                                : null)
                                                .amenities(trip.getBus().getAmenities())
                                                .build())
                                .build();

                return BookingResponse.builder()
                                .id(booking.getId())
                                .code(booking.getCode())
                                .status(booking.getStatus())
                                .totalPrice(booking.getTotalPrice())
                                .passengerName(booking.getPassengerName())
                                .passengerPhone(booking.getPassengerPhone())
                                .createdAt(booking.getCreatedAt())
                                .updatedAt(booking.getUpdatedAt())
                                .trip(tripInfo)
                                .tickets(booking.getTickets().stream()
                                                .map(ticket -> BookingResponse.TicketInfo.builder()
                                                                .id(ticket.getId())
                                                                .seatCode(ticket.getSeatCode())
                                                                .passengerName(ticket.getPassengerName())
                                                                .passengerPhone(ticket.getPassengerPhone())
                                                                .price(ticket.getPrice())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .pickupStation(booking.getPickupStation() != null
                                                ? BookingResponse.StationInfo.builder()
                                                                .id(booking.getPickupStation().getId())
                                                                .name(booking.getPickupStation().getName())
                                                                .city(booking.getPickupStation().getCity())
                                                                .address(booking.getPickupStation().getAddress())
                                                                .build()
                                                : null)
                                .dropoffStation(booking.getDropoffStation() != null
                                                ? BookingResponse.StationInfo.builder()
                                                                .id(booking.getDropoffStation().getId())
                                                                .name(booking.getDropoffStation().getName())
                                                                .city(booking.getDropoffStation().getCity())
                                                                .address(booking.getDropoffStation().getAddress())
                                                                .build()
                                                : null)
                                .build();
        }

        @Transactional
        public BookingResponse checkInPassenger(UUID ticketId) {
                Ticket ticket = ticketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found"));

                ticket.setBoarded(!ticket.isBoarded()); // Toggle status
                ticketRepository.save(ticket);

                return toBookingResponse(ticket.getBooking());
        }
}
