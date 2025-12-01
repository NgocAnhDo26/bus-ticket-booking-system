package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.CreateOperatorRequest;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OperatorService {

    private final OperatorRepository operatorRepository;

    @Transactional
    public Operator createOperator(CreateOperatorRequest request) {
        Operator operator = new Operator();
        operator.setName(request.getName());
        operator.setContactInfo(request.getContactInfo());
        return operatorRepository.save(operator);
    }

    @Transactional(readOnly = true)
    public List<Operator> getAllOperators() {
        return operatorRepository.findAll();
    }
}
