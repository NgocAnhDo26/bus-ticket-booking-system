package com.awad.ticketbooking.common.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RedissonConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Value("${spring.data.redis.username:}")
    private String redisUsername;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.ssl.enabled:false}")
    private boolean redisSslEnabled;

    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        
        String protocol = redisSslEnabled ? "rediss://" : "redis://";
        String address = protocol + redisHost + ":" + redisPort;
        
        var singleServerConfig = config.useSingleServer()
                .setAddress(address);
        
        // Set username if provided (Redis 6+ ACL support)
        if (redisUsername != null && !redisUsername.isEmpty()) {
            singleServerConfig.setUsername(redisUsername);
        }
        
        // Set password if provided
        if (redisPassword != null && !redisPassword.isEmpty()) {
            singleServerConfig.setPassword(redisPassword);
        }
        
        return Redisson.create(config);
    }
}

