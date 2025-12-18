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
    public ResponseEntity<org.springframework.data.domain.Page<Operator>> getAllOperators(
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(operatorService.getAllOperators(pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Operator> updateOperator(@PathVariable java.util.UUID id,
            @Valid @RequestBody CreateOperatorRequest request) {
        return ResponseEntity.ok(operatorService.updateOperator(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOperator(@PathVariable java.util.UUID id,
            @RequestParam(defaultValue = "false") boolean force) {
        operatorService.deleteOperator(id, force);
        return ResponseEntity.noContent().build();
    }
}
