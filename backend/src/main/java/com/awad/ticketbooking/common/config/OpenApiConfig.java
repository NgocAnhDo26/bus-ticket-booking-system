package com.awad.ticketbooking.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ticketBookingApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Bus Ticket Booking API")
                        .description("Assignment 1 backend APIs for authentication, dashboard and future modules")
                        .version("v1.0"))
                .components(new Components());
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
}

