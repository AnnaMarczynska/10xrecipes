package com.example._x_recipes.repository;

import com.example._x_recipes.entity.UserAllergen;
import com.example._x_recipes.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserAllergenRepository extends JpaRepository<UserAllergen, Long> {
    List<UserAllergen> findByUser(User user);
    boolean existsByUserAndAllergen(User user, String allergen);
}
