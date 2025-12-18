package com.awad.ticketbooking.common.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    public static final String CACHE_ADMIN_METRICS = "adminDashboard:metrics";
    public static final String CACHE_ADMIN_REVENUE = "adminDashboard:revenue";
    public static final String CACHE_ADMIN_BOOKING_TRENDS = "adminDashboard:bookingTrends";
    public static final String CACHE_ADMIN_BOOKING_CONVERSION = "adminDashboard:bookingConversion";
    public static final String CACHE_ADMIN_TOP_ROUTES = "adminDashboard:topRoutes";
    public static final String CACHE_ADMIN_TOP_OPERATORS = "adminDashboard:topOperators";
    public static final String CACHE_ADMIN_RECENT_TRANSACTIONS = "adminDashboard:recentTransactions";

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        JacksonJsonRedisSerializer<Object> serializer = new JacksonJsonRedisSerializer<>(Object.class);
        
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration cacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues();

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(cacheConfiguration)
                .withInitialCacheConfigurations(Map.of(
                        CACHE_ADMIN_METRICS, cacheConfiguration.entryTtl(Duration.ofSeconds(30)),
                        CACHE_ADMIN_RECENT_TRANSACTIONS, cacheConfiguration.entryTtl(Duration.ofSeconds(30)),
                        CACHE_ADMIN_REVENUE, cacheConfiguration.entryTtl(Duration.ofMinutes(5)),
                        CACHE_ADMIN_BOOKING_TRENDS, cacheConfiguration.entryTtl(Duration.ofMinutes(5)),
                        CACHE_ADMIN_BOOKING_CONVERSION, cacheConfiguration.entryTtl(Duration.ofMinutes(5)),
                        CACHE_ADMIN_TOP_ROUTES, cacheConfiguration.entryTtl(Duration.ofMinutes(10)),
                        CACHE_ADMIN_TOP_OPERATORS, cacheConfiguration.entryTtl(Duration.ofMinutes(10))
                ))
                .build();
    }
}
