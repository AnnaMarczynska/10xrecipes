package com.example._x_recipes.repository;

import com.example._x_recipes.entity.Favorite;
import com.example._x_recipes.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser(User user);
    Optional<Favorite> findByUserAndRecipeId(User user, String recipeId);
    boolean existsByUserAndRecipeId(User user, String recipeId);
}
