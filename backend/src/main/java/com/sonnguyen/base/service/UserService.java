// UserService.java
package com.sonnguyen.base.service;

import com.sonnguyen.base.model.User;
import com.sonnguyen.base.payload.request.PageRequestDtoIn;
import com.sonnguyen.base.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public Page<User> getAllBySearchString(PageRequestDtoIn pageRequestDtoIn) {
        Sort sort = Sort.by(pageRequestDtoIn.getSortBy());
        if (pageRequestDtoIn.getOrder().equals("acs")) {
            sort = sort.descending();
        }
        Pageable pageable = PageRequest.of(pageRequestDtoIn.getPage() - 1, pageRequestDtoIn.getSize(), sort);
        return userRepository.findAllByUsernameContaining(pageRequestDtoIn.getSearch(), pageable);
    }
}