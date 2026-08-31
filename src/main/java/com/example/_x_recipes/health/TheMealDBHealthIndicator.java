package com.example._x_recipes.health;

import com.example._x_recipes.client.TheMealDBClient;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class TheMealDBHealthIndicator implements HealthIndicator {
    private final TheMealDBClient theMealDBClient;

    public TheMealDBHealthIndicator(TheMealDBClient theMealDBClient) {
        this.theMealDBClient = theMealDBClient;
    }

    @Override
    public Health health() {
        try {
            theMealDBClient.fetchRecipeDetails("52772");
            return Health.up()
                .withDetail("service", "TheMealDB API")
                .withDetail("status", "responsive")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("service", "TheMealDB API")
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
