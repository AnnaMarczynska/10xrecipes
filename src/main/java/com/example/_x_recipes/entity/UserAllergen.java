package com.example._x_recipes.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_allergens", uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "allergen"})})
public class UserAllergen {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String allergen;

    public UserAllergen() {}

    public UserAllergen(User user, String allergen) {
        this.user = user;
        this.allergen = allergen;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getAllergen() { return allergen; }
    public void setAllergen(String allergen) { this.allergen = allergen; }
}
