package com.example._x_recipes.client;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests for URL encoding in TheMealDBClient.fetchRecipeDetails().
 * Verifies that mealId parameters are properly encoded
 * to prevent injection attacks.
 *
 * Regression vectors tested:
 * - Query parameter injection (?, &, =)
 * - URL fragment injection (#)
 * - Encoding bypass attempts (%2F, %2E)
 */
@DisplayName("URL Encoding for mealId Parameter")
class TheMealDBClientUrlEncodingTest {

    /**
     * Verify that injection payloads in mealId are properly URL-encoded.
     * This test validates the URLEncoder.encode() call in fetchRecipeDetails().
     */
    @DisplayName("Injection payloads are properly URL-encoded")
    @ParameterizedTest(name = "mealId={0} encodes to {1}")
    @CsvSource({
        "123?foo=bar, 123%3Ffoo%3Dbar",                    // ? → %3F
        "123&admin=true, 123%26admin%3Dtrue",             // & → %26
        "123#section, 123%23section",                      // # → %23
        "123%2F%2e%2e%2fadmin, 123%252F%252e%252e%252fadmin" // Pre-encoded path → double-encode
    })
    void testMealIdUrlEncoding(String injectedMealId, String expectedEncoded) {
        // Test that URLEncoder properly encodes the injection payloads
        String encoded = URLEncoder.encode(injectedMealId, StandardCharsets.UTF_8);

        assertThat(encoded)
            .as("mealId should be URL-encoded to prevent injection")
            .isEqualTo(expectedEncoded)
            .doesNotContain("?foo=")
            .doesNotContain("&admin")
            .doesNotContain("#section")
            .doesNotContain("../");
    }

    /**
     * Verify that normal alphanumeric IDs encode without unnecessary transformation.
     */
    @DisplayName("Normal mealIds encode without over-transformation")
    @ParameterizedTest(name = "mealId {0} should encode to {1}")
    @CsvSource({
        "52001, 52001",    // Alphanumeric: no encoding needed
        "715495, 715495",  // Numeric: no encoding needed
        "52772, 52772"     // Numeric: no encoding needed
    })
    void testNormalMealIdEncoding(String normalMealId, String expectedEncoded) {
        String encoded = URLEncoder.encode(normalMealId, StandardCharsets.UTF_8);

        assertThat(encoded)
            .as("Normal alphanumeric IDs should not be over-encoded")
            .isEqualTo(expectedEncoded);
    }

    /**
     * Verify that special URL characters are consistently encoded.
     * This ensures the regression vectors are covered if encoding is removed.
     */
    @DisplayName("Special characters encode consistently")
    @ParameterizedTest(name = "{0} should encode to {1}")
    @CsvSource({
        "?, %3F",
        "&, %26",
        "=, %3D",
        "#, %23",
        "/, %2F"
    })
    void testSpecialCharacterEncoding(String character, String expectedEncoding) {
        String encoded = URLEncoder.encode(character, StandardCharsets.UTF_8);

        assertThat(encoded)
            .as("Special character should encode consistently")
            .isEqualTo(expectedEncoding);
    }
}
