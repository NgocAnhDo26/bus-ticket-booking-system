package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.modules.auth.dto.CreateAdminRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateAdminRequest;
import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<User> getAllUsers(UserRole role, Pageable pageable) {
        if (role != null) {
            return userRepository.findByRole(role, pageable);
        }
        return userRepository.findAll(pageable);
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    @Transactional
    public User createAdmin(CreateAdminRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        if (request.phone() != null && !request.phone().isEmpty()) {
            userRepository.findByPhone(request.phone()).ifPresent(u -> {
                throw new IllegalArgumentException("Phone number already in use");
            });
        }

        User user = User.builder()
                .email(request.email())
                .fullName(request.fullName())
                .phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.ADMIN)
                .authProvider(AuthProvider.LOCAL)
                .enabled(true)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User updateAdmin(UUID id, UpdateAdminRequest request) {
        User user = getUserById(id);

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Can only update admin users via this endpoint");
        }

        user.setFullName(request.fullName());

        if (request.phone() != null && !request.phone().equals(user.getPhone())) {
            userRepository.findByPhone(request.phone()).ifPresent(existingUser -> {
                if (!existingUser.getId().equals(user.getId())) {
                    throw new IllegalArgumentException("Phone number already in use");
                }
            });
            user.setPhone(request.phone());
        }

        return userRepository.save(user);
    }

    @Transactional
    public User setUserStatus(UUID id, boolean enabled) {
        User user = getUserById(id);
        user.setEnabled(enabled);
        return userRepository.save(user);
    }
}
