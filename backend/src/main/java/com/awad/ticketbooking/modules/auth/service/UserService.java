package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.modules.auth.dto.ChangePasswordRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateAvatarRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateProfileRequest;
import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User updateProfile(User user, UpdateProfileRequest request) {
        // Validate phone uniqueness if changed
        if (!request.phone().equals(user.getPhone())) {
            userRepository.findByPhone(request.phone())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(user.getId())) {
                            throw new IllegalArgumentException("Phone number already in use");
                        }
                    });
        }

        user.setFullName(request.fullName());
        user.setPhone(request.phone());

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        // Only LOCAL auth provider users can change password
        if (user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new IllegalArgumentException("Password cannot be changed for OAuth accounts");
        }

        // Verify old password
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        // Check if new password is same as old password
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from old password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getEmail());
    }

    @Transactional
    public User updateAvatar(User user, UpdateAvatarRequest request) {
        // If old avatar exists and new one is provided, we could delete the old one
        // For now, we'll just update the URL
        // Note: Deleting old avatar would require extracting publicId from URL
        user.setAvatarUrl(request.avatarUrl());
        return userRepository.save(user);
    }
}
