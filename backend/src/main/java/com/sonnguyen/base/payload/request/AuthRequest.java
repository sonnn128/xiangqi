package com.sonnguyen.base.payload.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class AuthRequest {
    @NotEmpty(message = "username can not empty")
    private String username;
    @NotEmpty(message = "password can not empty")
    private String password;
}

