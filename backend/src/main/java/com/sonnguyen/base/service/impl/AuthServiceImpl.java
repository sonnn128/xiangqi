package com.sonnguyen.base.service.impl;

import com.sonnguyen.base.config.JwtService;
import com.sonnguyen.base.exception.CommonException;
import com.sonnguyen.base.model.User;
import com.sonnguyen.base.payload.response.AuthResponse;
import com.sonnguyen.base.repository.UserRepository;
import com.sonnguyen.base.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    @Value("${jwt.EXPIRATION_TIME:86400000}")
    private int JWT_EXPIRATION_TIME;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtService.generateToken((UserDetails) authentication.getPrincipal(), JWT_EXPIRATION_TIME);
        
        User user = userRepository.findByUsername(username);
        Long coins = (user != null && user.getCoins() != null) ? user.getCoins() : 20000L;

        return AuthResponse.builder()
                .token(token)
                .username(username)
                .coins(coins)
                .displayName(user != null && user.getDisplayName() != null ? user.getDisplayName() : username)
                .birthDate(user != null && user.getBirthDate() != null ? user.getBirthDate() : "")
                .avatar(user != null && user.getAvatar() != null ? user.getAvatar() : "avatar_1")
                .build();
    }

    @Override
    public void register(String username, String password) {
        User existingUser = userRepository.findByUsername(username);
        if (existingUser != null) {
            throw new CommonException("Tên đăng nhập đã tồn tại", HttpStatus.CONFLICT);
        }
        User user = new User();
        user.setUsername(username);
        user.setDisplayName(username);
        user.setAvatar("avatar_1");
        user.setPassword(passwordEncoder.encode(password));
        user.setCoins(20000L); // Khởi tạo 20k xu
        userRepository.save(user);
    }
}
