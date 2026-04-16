package com.innovhub.repository;

import com.innovhub.entity.User;
import com.innovhub.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(UserRole role);

    List<User> findTop10ByOrderByPointsDesc();

    List<User> findByRole(UserRole role);

    Optional<User> findFirstByRole(UserRole role);
}
