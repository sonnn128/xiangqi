package com.sonnguyen.base.config.initializr;

import com.sonnguyen.base.model.Role;
import com.sonnguyen.base.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements ApplicationListener<ContextRefreshedEvent> {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) {
        // Kiểm tra và tạo Role ADMIN nếu chưa tồn tại
        Role adminRole = entityManager.find(Role.class, "ADMIN");
        if (adminRole == null) {
            adminRole = new Role();
            adminRole.setId("ADMIN");
            adminRole.setPermissions(new HashSet<>());
            entityManager.persist(adminRole);
            entityManager.flush(); // Đảm bảo role được lưu trước khi dùng
        }

        // Kiểm tra và tạo User admin nếu chưa tồn tại
        String query = "SELECT u FROM User u WHERE u.username = :username";
        try {
            User existingUser = entityManager.createQuery(query, User.class)
                    .setParameter("username", "admin")
                    .getSingleResult();
            // Nếu user đã tồn tại, không làm gì cả
        } catch (Exception e) {
            // Nếu không tìm thấy user, tạo mới
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("admin"));

            // Gán role cho user
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            adminUser.setRoles(roles);

            // Lưu user vào database
            entityManager.persist(adminUser);
            entityManager.flush(); // Đảm bảo dữ liệu được ghi vào DB
        }
    }
}