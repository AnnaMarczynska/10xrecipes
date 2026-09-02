package com.example._x_recipes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		String profiles = System.getenv("SPRING_PROFILES_ACTIVE");
		if (profiles == null || profiles.isBlank()) {
			System.setProperty("spring.profiles.active", "dev");
		}
		SpringApplication.run(Application.class, args);
	}

}
