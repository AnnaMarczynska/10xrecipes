package com.example._x_recipes.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/ingredients")
@CrossOrigin(origins = "*")
public class IngredientController {

    // Master ingredient list (common ingredients from TheMealDB)
    private static final List<String> COMMON_INGREDIENTS = Arrays.asList(
        "chicken", "beef", "pork", "lamb", "salmon", "tuna", "cod", "shrimp", "prawns",
        "rice", "pasta", "noodles", "bread", "potatoes", "sweet potatoes", "carrots", "broccoli",
        "spinach", "lettuce", "cabbage", "cauliflower", "onion", "garlic", "tomato", "cucumber",
        "bell pepper", "chili pepper", "mushroom", "zucchini", "eggplant", "asparagus",
        "green beans", "corn", "peas", "lentils", "chickpeas", "beans", "tofu",
        "olive oil", "vegetable oil", "butter", "milk", "cheese", "yogurt", "cream",
        "eggs", "flour", "sugar", "salt", "pepper", "soy sauce", "vinegar", "lemon",
        "lime", "orange", "apple", "banana", "strawberry", "blueberry", "coconut milk",
        "peanut butter", "almonds", "cashews", "walnuts", "sesame oil", "fish sauce",
        "ginger", "turmeric", "cumin", "coriander", "basil", "oregano", "thyme",
        "rosemary", "parsley", "cilantro", "dill", "chives", "saffron", "vanilla",
        "cinnamon", "nutmeg", "cloves", "anise", "fennel", "mustard", "honey",
        "maple syrup", "balsamic vinegar", "white wine", "red wine", "beer", "chicken stock",
        "beef stock", "vegetable stock", "worcestershire sauce", "hot sauce", "sriracha",
        "wasabi", "miso", "tahini", "hummus", "pesto", "tomato sauce", "salsa"
    );

    @GetMapping
    public ResponseEntity<?> getIngredients() {
        Map<String, Object> response = new HashMap<>();
        response.put("ingredients", COMMON_INGREDIENTS);

        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
            .body(response);
    }
}
