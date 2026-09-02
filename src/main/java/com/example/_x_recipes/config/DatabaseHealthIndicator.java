package com.example._x_recipes.config;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHealthIndicator extends AbstractHealthIndicator {
  private final DataSource dataSource;

  public DatabaseHealthIndicator(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @Override
  protected void doHealthCheck(Health.Builder builder) throws Exception {
    try (Connection conn = dataSource.getConnection();
         Statement stmt = conn.createStatement()) {
      stmt.executeQuery("SELECT 1");
      builder.up().withDetail("database", "Connected to database");
    } catch (Exception e) {
      builder.down().withDetail("error", e.getMessage());
    }
  }
}
