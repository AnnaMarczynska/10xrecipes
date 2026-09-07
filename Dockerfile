# Multi-stage Dockerfile for 10xRecipes
# Stage 1: Build backend JAR
FROM eclipse-temurin:21-jdk-alpine AS backend-builder
WORKDIR /build

# Copy Maven files and download dependencies (layer caching)
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline

# Copy source and build JAR
COPY src src
RUN ./mvnw clean package -DskipTests -q

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY src src
COPY tsconfig.json eslint.config.js index.html ./
RUN npm run build

# Stage 3: Runtime - Spring Boot + Frontend static files
FROM eclipse-temurin:21-jre-alpine

# Metadata
LABEL maintainer="10xRecipes Team"
LABEL description="10xRecipes MVP - Recipe search API with frontend"

# Install curl for health checks
RUN apk add --no-cache curl

# Create app user for security (don't run as root)
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy backend JAR from builder
COPY --from=backend-builder /build/target/*.jar app.jar

# Copy frontend dist to serve as static files
COPY --from=frontend-builder /build/dist ./public/

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port (Cloud Run reads LISTEN_PORT or defaults to 8080)
EXPOSE 8080

# Health check (Spring Boot actuator endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Start Spring Boot with optimized flags for containers
# Cloud Run passes environment variables at runtime
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:InitialRAMPercentage=50.0", \
  "-Dspring.profiles.active=cloud", \
  "-jar", "app.jar"]
