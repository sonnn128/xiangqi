package com.sonnguyen.base.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private Long coins;
    private String displayName;
    private String birthDate;
    private String avatar;

    public AuthResponse(String token) {
        this.token = token;
    }
}
