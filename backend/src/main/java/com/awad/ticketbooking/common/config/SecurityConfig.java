package com.awad.ticketbooking.common.config;

import com.awad.ticketbooking.common.config.security.CustomUserDetailsService;
import com.awad.ticketbooking.common.config.security.JwtAuthenticationFilter;
import java.util.List;
import lombok.RequiredArgsConstructor;
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
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers("/api/trips/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/routes/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/routes/**").permitAll()
                        .requestMatchers("/api/operators/**").permitAll()
                        .requestMatchers("/api/buses/**").permitAll()
                        .requestMatchers("/api/stations/**").permitAll()
                        .requestMatchers("/api/admin/**").permitAll()

                        // Bus Layouts
                        .requestMatchers(HttpMethod.GET, "/api/bus-layouts/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/bus-layouts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/bus-layouts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/bus-layouts/**").hasRole("ADMIN")

                        // Bookings
                        .requestMatchers("/api/bookings/seats/**").permitAll() // Lock/Unlock/View seats
                        .requestMatchers(HttpMethod.GET, "/api/bookings/**").permitAll() // View booking details
                                                                                         // (confirmation)
                        .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll() // Create booking
                        .requestMatchers(HttpMethod.POST, "/api/bookings/lookup").permitAll() // Lookup booking
                        .requestMatchers(HttpMethod.PUT, "/api/bookings/*/confirm").permitAll() // Confirm booking (pay)
                        .requestMatchers(HttpMethod.PUT, "/api/bookings/*/cancel").permitAll() // Cancel booking

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
            @Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
