package com.sonnguyen.base.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Data
@Entity
@Table(name = "permissions")
public class Permission implements GrantedAuthority {
    @Id
    private String id;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Override
    public String getAuthority() {
        return this.getId();
    }

    public SimpleGrantedAuthority toSimpleGrantedAuthority() {
        return new SimpleGrantedAuthority(this.getId());
    }
}

