package com.sonnguyen.base.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Data
@Entity
@Table(name = "roles")
public class Role implements GrantedAuthority {
    @Id
    private String id;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "role_permission",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions;

    @Override
    public String getAuthority() {
        return this.id;
    }

    public List<SimpleGrantedAuthority> getSimpleGrantedAuthorities() {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        for (Permission permission : permissions) {
            authorities.add(permission.toSimpleGrantedAuthority());
        }
        authorities.add(new SimpleGrantedAuthority(this.id));
        return authorities;
    }
}

