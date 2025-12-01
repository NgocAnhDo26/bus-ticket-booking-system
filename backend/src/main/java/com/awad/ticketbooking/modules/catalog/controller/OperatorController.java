package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.CreateOperatorRequest;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.service.OperatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operators")
@RequiredArgsConstructor
public class OperatorController {

    private final OperatorService operatorService;

    @PostMapping
    public ResponseEntity<Operator> createOperator(@Valid @RequestBody CreateOperatorRequest request) {
        return ResponseEntity.ok(operatorService.createOperator(request));
    }

    @GetMapping
    public ResponseEntity<List<Operator>> getAllOperators() {
        return ResponseEntity.ok(operatorService.getAllOperators());
    }
}
