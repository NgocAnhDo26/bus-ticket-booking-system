package com.awad.ticketbooking;

import com.awad.ticketbooking.common.config.GoogleProperties;
import com.awad.ticketbooking.common.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
@EnableConfigurationProperties({ JwtProperties.class, GoogleProperties.class })
public class TicketbookingApplication {

	public static void main(String[] args) {
		SpringApplication.run(TicketbookingApplication.class, args);
	}

}
