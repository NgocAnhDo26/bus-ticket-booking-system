package com.awad.ticketbooking.common.config;

import com.awad.ticketbooking.common.config.security.CustomUserDetailsService;
import com.awad.ticketbooking.common.config.security.JwtAuthenticationFilter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Slf4j
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
            throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public actuator and technical endpoints
                        .requestMatchers("/actuator/**").permitAll()

                        // Swagger / OpenAPI docs
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**")
                        .permitAll()

                        // Auth and public APIs
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/v1/ai/**").permitAll() // AI Chat endpoint
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers("/api/trips/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/routes/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/routes/**").permitAll()
                        .requestMatchers("/api/operators/**").permitAll()
                        .requestMatchers("/api/buses/**").permitAll()
                        .requestMatchers("/api/stations/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Bus Layouts
                        .requestMatchers(HttpMethod.GET, "/api/bus-layouts/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/bus-layouts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/bus-layouts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/bus-layouts/**").hasRole("ADMIN")

                        // Bookings
                        .requestMatchers("/api/bookings/admin").hasRole("ADMIN") // Admin listing
                        .requestMatchers("/api/bookings/seats/**").permitAll() // Lock/Unlock/View seats
                        .requestMatchers(HttpMethod.GET, "/api/bookings/**").permitAll() // View booking details
                                                                                         // (confirmation)
                        .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll() // Create booking
                        .requestMatchers(HttpMethod.POST, "/api/bookings/lookup").permitAll() // Lookup booking
                        .requestMatchers(HttpMethod.PUT, "/api/bookings/*/confirm").permitAll() // Confirm booking (pay)
                        .requestMatchers(HttpMethod.PUT, "/api/bookings/*/cancel").permitAll() // Cancel booking

                        // Payments
                        .requestMatchers(HttpMethod.POST, "/api/payments").permitAll() // Create payment link
                        .requestMatchers(HttpMethod.GET, "/api/payments/**").permitAll() // Get payment details

                        .requestMatchers(HttpMethod.POST, "/api/bookings/tickets/*/check-in").hasRole("ADMIN") // Check-in
                                                                                                               // passenger

                        // Webhooks (no auth - signature verified internally)
                        .requestMatchers("/api/webhooks/**").permitAll()

                        .requestMatchers(HttpMethod.PUT, "/api/routes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/routes/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .authenticationProvider(daoAuthenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String allowedOriginsProperty) {

        log.info("Raw CORS allowed-origins property: {}", allowedOriginsProperty);

        // Parse comma-separated list (handles both List<String> from @Value and single string)
        List<String> allowedOrigins;
        if (allowedOriginsProperty.contains(",")) {
            allowedOrigins = Arrays.stream(allowedOriginsProperty.split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
        } else {
            allowedOrigins = List.of(allowedOriginsProperty.trim());
        }

        log.info("Parsed CORS allowed origins: {}", allowedOrigins);

        // Normalize origins: trim whitespace, remove trailing slashes (CORS origin doesn't include path)
        List<String> validOrigins = allowedOrigins.stream()
                .map(String::trim)
                .map(origin -> origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin)
                .filter(origin -> !origin.equals("*") && !origin.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        log.info("Normalized CORS allowed origins: {}", validOrigins);

        if (validOrigins.isEmpty()) {
            throw new IllegalStateException(
                    "app.cors.allowed-origins must contain at least one specific origin (not '*'). " +
                    "When credentials are enabled, wildcard '*' is not allowed. " +
                    "Current value: '" + allowedOriginsProperty + "'. " +
                    "Example: app.cors.allowed-origins=http://localhost:5173,https://your-vercel-app.vercel.app");
        }

        // Webhook endpoints - allow all origins (PayOS server)
        CorsConfiguration webhookConfig = new CorsConfiguration();
        webhookConfig.setAllowedOrigins(List.of("*"));
        webhookConfig.setAllowedMethods(List.of("POST", "OPTIONS"));
        webhookConfig.setAllowedHeaders(List.of("*"));
        webhookConfig.setAllowCredentials(false); // Must be false when allowedOrigins is *

        // Regular endpoints - restrict to allowed origins
        CorsConfiguration defaultConfig = new CorsConfiguration();
        defaultConfig.setAllowedOrigins(validOrigins);
        defaultConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        defaultConfig.setAllowedHeaders(List.of("*"));
        defaultConfig.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/webhooks/**", webhookConfig);
        source.registerCorsConfiguration("/**", defaultConfig);
        return source;
    }
}
