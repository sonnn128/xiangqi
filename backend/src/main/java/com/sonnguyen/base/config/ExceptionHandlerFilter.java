package com.sonnguyen.base.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonnguyen.base.exception.CommonException;
import com.sonnguyen.base.payload.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExceptionHandlerFilter extends OncePerRequestFilter {
    private final ObjectMapper objectMapper;
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws IOException {

        try {
            filterChain.doFilter(request, response);
        } catch (CommonException e) {
            handleException(response, e, e.getHttpStatus().value());
        } catch (Exception e) {
            handleException(response, e, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void handleException(HttpServletResponse response, Exception e, int httpStatus) throws IOException {
        log.error("{}", e.getMessage());
        response.setStatus(httpStatus);
        response.setContentType("application/json");
        response.getWriter().write(
                objectMapper.writeValueAsString(
                        ApiResponse.builder()
                                .success(false)
                                .message(e.getMessage())
                                .build()
                )
        );
    }
}

