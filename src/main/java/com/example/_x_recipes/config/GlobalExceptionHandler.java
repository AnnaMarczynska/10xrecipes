package com.example._x_recipes.config;

import java.io.Serializable;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ErrorResponse> handleDatabaseError(
      DataAccessException ex,
      WebRequest request) {
    String correlationId = extractCorrelationId(request);
    logger.error("Database error [correlationId:{}]: {}", correlationId, ex.getMessage());
    return ResponseEntity.status(503).body(
        new ErrorResponse("Database unavailable, please try again later", correlationId)
    );
  }

  private String extractCorrelationId(WebRequest request) {
    String correlationId = request.getHeader("X-Correlation-ID");
    if (correlationId == null || correlationId.isBlank()) {
      correlationId = "unknown";
    }
    return correlationId;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ErrorResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    public String message;
    public String correlationId;

    public ErrorResponse(String message, String correlationId) {
      this.message = message;
      this.correlationId = correlationId;
    }

    public String getMessage() {
      return message;
    }

    public String getCorrelationId() {
      return correlationId;
    }
  }
}
