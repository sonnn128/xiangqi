package com.sonnguyen.base.exception;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Getter
@Setter
public class CommonException extends RuntimeException{
    private String message;
    private HttpStatus httpStatus;

    public CommonException(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }
}

