package com.awad.ticketbooking.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ticketBookingApi() {
        final String bearerSchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Bus Ticket Booking API")
                        .description("REST API for searching trips, booking seats and managing bus ticket operations.")
                        .version("v1.0")
                        .contact(new Contact()
                                .name("Bus Ticket Booking Team")
                                .email("support@example.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .components(new Components()
                        .addSecuritySchemes(bearerSchemeName,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(bearerSchemeName));
    }

    @Bean
    public GroupedOpenApi authGroupedOpenApi() {
        return GroupedOpenApi.builder()
                .group("auth")
                .pathsToMatch("/api/auth/**", "/api/users/**")
                .build();
    }

    @Bean
    public GroupedOpenApi dashboardGroupedOpenApi() {
        return GroupedOpenApi.builder()
                .group("dashboard")
                .pathsToMatch("/api/dashboard/**")
                .build();
    }

    @Bean
    public GroupedOpenApi bookingGroupedOpenApi() {
        return GroupedOpenApi.builder()
                .group("booking")
                .pathsToMatch("/api/bookings/**")
                .build();
    }

    @Bean
    public GroupedOpenApi tripGroupedOpenApi() {
        return GroupedOpenApi.builder()
                .group("trip")
                .pathsToMatch("/api/trips/**")
                .build();
    }
}

