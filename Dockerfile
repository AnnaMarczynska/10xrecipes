# Multi-stage Dockerfile for 10xRecipes
# Stage 1: Build backend JAR
FROM maven:3.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /build
COPY pom.xml ./
COPY src src
RUN mvn clean package -DskipTests -e

# Stage 2: Runtime - Spring Boot + Frontend static files
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="10xRecipes Team"
LABEL description="10xRecipes MVP - Recipe search API with frontend"

RUN apk add --no-cache curl

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy backend JAR
COPY --from=backend-builder /build/target/*.jar app.jar

# Copy pre-built frontend dist
COPY dist ./public/

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:InitialRAMPercentage=50.0", \
  "-Dspring.profiles.active=cloud", \
  "-jar", "app.jar"]
