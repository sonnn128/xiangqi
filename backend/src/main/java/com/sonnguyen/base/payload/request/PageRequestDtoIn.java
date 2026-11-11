package com.sonnguyen.base.payload.request;

import lombok.Data;

@Data
public class PageRequestDtoIn {
    private int page;
    private int size;
    private String search;
    private String order;
    private String sortBy;
}

