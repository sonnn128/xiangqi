package com.sonnguyen.base.repository;

import com.sonnguyen.base.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
    public User findByUsername(String username);
    Page<User> findAllByUsernameContaining(String search, Pageable pageable);
}