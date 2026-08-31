package com.example._x_recipes.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OpenApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OpenApiConfig openApiConfig;

    @Test
    void testOpenAPIBeanExists() {
        OpenAPI openAPI = openApiConfig.customOpenAPI();
        assertNotNull(openAPI);
        assertNotNull(openAPI.getInfo());
        assertEquals("10x Recipes API", openAPI.getInfo().getTitle());
    }

    @Test
    void testOpenAPIHasSecurity() {
        OpenAPI openAPI = openApiConfig.customOpenAPI();
        assertNotNull(openAPI.getComponents());
        assertNotNull(openAPI.getComponents().getSecuritySchemes());
        assertTrue(openAPI.getComponents().getSecuritySchemes().containsKey("Bearer"));
    }

    @Test
    void testSwaggerUIEndpoint() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
            .andExpect(status().is3xxRedirection());
    }

    @Test
    void testOpenAPIDocsEndpoint() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk());
    }
}
