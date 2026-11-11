package com.sonnguyen.base.controller;

import com.sonnguyen.base.payload.request.AuthRequest;
import com.sonnguyen.base.payload.request.PageRequestDtoIn;
import com.sonnguyen.base.payload.response.ApiResponse;
import com.sonnguyen.base.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAllUsers(PageRequestDtoIn pageRequestDtoIn) {
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("Get all users successfully")
                        .data(new PagedModel<>(userService.getAllBySearchString(pageRequestDtoIn)))
                        .build()
        );
    }

}