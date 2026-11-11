package com.sonnguyen.base.config.initializr;

import com.sonnguyen.base.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
}
