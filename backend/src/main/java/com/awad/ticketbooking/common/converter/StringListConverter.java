package com.awad.ticketbooking.common.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Collections;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new RuntimeException("Error converting list to JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return Collections.emptyList();
        }

        try {
            // Handle both JSON arrays (preferred) and legacy JSON objects where
            // amenities were stored as {"wifi": true, ...}. For objects we return
            // the keys whose values are truthy to preserve intent.
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(dbData);

            if (node.isArray()) {
                return objectMapper.convertValue(node, new TypeReference<List<String>>() {
                });
            }

            if (node.isObject()) {
                List<String> keys = new java.util.ArrayList<>();
                java.util.Iterator<String> fieldNames = node.fieldNames();
                while (fieldNames.hasNext()) {
                    String key = fieldNames.next();
                    com.fasterxml.jackson.databind.JsonNode value = node.get(key);
                    if (value != null && (!value.isBoolean() || value.asBoolean())) {
                        keys.add(key);
                    }
                }
                return keys;
            }

            if (node.isTextual()) {
                return java.util.Collections.singletonList(node.asText());
            }

            return Collections.emptyList();
        } catch (Exception e) {
            throw new RuntimeException("Error converting JSON to list", e);
        }
    }
}
