package com.awad.ticketbooking.common.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    @NotBlank
    private String secret;

    @Min(5)
    private long accessTokenExpirationMinutes = 30;

    @Min(1)
    private long refreshTokenExpirationDays = 7;

    public Duration accessTokenTtl() {
        return Duration.ofMinutes(accessTokenExpirationMinutes);
    }

    public Duration refreshTokenTtl() {
        return Duration.ofDays(refreshTokenExpirationDays);
    }
}

