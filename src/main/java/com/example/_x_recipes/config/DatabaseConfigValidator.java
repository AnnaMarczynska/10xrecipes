package com.example._x_recipes.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConfigValidator implements ApplicationRunner {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseConfigValidator.class);

  private final Environment environment;

  public DatabaseConfigValidator(Environment environment) {
    this.environment = environment;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    String[] activeProfiles = environment.getActiveProfiles();
    boolean isProdProfile = false;

    for (String profile : activeProfiles) {
      if ("prod".equals(profile)) {
        isProdProfile = true;
        break;
      }
    }

    if (isProdProfile) {
      validateProductionConfig();
    } else {
      validateDevelopmentConfig();
    }
  }

  private void validateProductionConfig() {
    String databaseUrl = environment.getProperty("spring.datasource.url");
    String databaseUser = environment.getProperty("spring.datasource.username");
    String databasePassword = environment.getProperty("spring.datasource.password");
    String jwtSecret = environment.getProperty("jwt.secret");

    if (isEmpty(databaseUrl)) {
      logErrorAndThrow("DATABASE_URL / spring.datasource.url environment variable not set");
    }
    if (isEmpty(databaseUser)) {
      logErrorAndThrow("DATABASE_USER / spring.datasource.username environment variable not set");
    }
    if (isEmpty(databasePassword)) {
      logErrorAndThrow("DATABASE_PASSWORD / spring.datasource.password environment variable not set");
    }
    if (isEmpty(jwtSecret)) {
      logErrorAndThrow("JWT_SECRET / jwt.secret environment variable not set");
    }

    logger.info("Production configuration validated successfully");
  }

  private void validateDevelopmentConfig() {
    String jwtSecret = environment.getProperty("jwt.secret");
    if (isEmpty(jwtSecret)) {
      logger.warn("JWT_SECRET not set in development, using default");
    } else {
      logger.info("Development configuration validated successfully");
    }
  }

  private boolean isEmpty(String value) {
    return value == null || value.isBlank();
  }

  private void logErrorAndThrow(String message) {
    logger.error("STARTUP FAILURE: {}", message);
    throw new IllegalStateException("Configuration validation failed: " + message);
  }
}
