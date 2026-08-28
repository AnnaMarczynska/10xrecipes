package com.example._x_recipes.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/ingredients")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class IngredientController {

    // Master ingredient list (150+ common ingredients from TheMealDB)
    private static final List<String> COMMON_INGREDIENTS = Arrays.asList(
        // Proteins
        "chicken", "beef", "pork", "lamb", "veal", "turkey", "duck", "goose", "rabbit",
        "salmon", "tuna", "cod", "halibut", "haddock", "bass", "trout", "snapper", "sardine",
        "shrimp", "prawns", "crab", "lobster", "mussels", "clams", "oysters", "scallops", "squid",

        // Grains & Starches
        "rice", "pasta", "noodles", "ramen", "breadcrumbs", "bread", "potatoes", "sweet potatoes",
        "yams", "quinoa", "couscous", "polenta", "bulgur", "farro", "barley", "oats", "cornmeal",

        // Vegetables
        "carrots", "broccoli", "spinach", "lettuce", "cabbage", "red cabbage", "cauliflower",
        "onion", "red onion", "shallot", "garlic", "leek", "celery", "tomato", "sun-dried tomato",
        "cucumber", "zucchini", "eggplant", "asparagus", "artichoke", "okra",
        "green beans", "snap peas", "corn", "peas", "carrots", "beets", "radish",
        "turnip", "parsnip", "rutabaga", "pumpkin", "squash", "butternut squash", "acorn squash",

        // Peppers & Aromatics
        "bell pepper", "red pepper", "yellow pepper", "green pepper", "chili pepper", "jalapeño",
        "habanero", "thai chili", "cayenne pepper", "paprika", "black pepper",

        // Mushrooms & Fungi
        "mushroom", "cremini mushroom", "portobello", "shiitake", "oyster mushroom",
        "porcini", "chanterelle", "truffle",

        // Legumes
        "lentils", "chickpeas", "black beans", "kidney beans", "pinto beans", "navy beans",
        "white beans", "cannellini beans", "split peas", "tofu", "tempeh", "edamame",

        // Oils & Fats
        "olive oil", "vegetable oil", "canola oil", "sunflower oil", "grapeseed oil",
        "coconut oil", "butter", "ghee", "sesame oil", "walnut oil", "truffle oil",

        // Dairy & Proteins
        "milk", "cream", "sour cream", "yogurt", "greek yogurt", "cheese", "cheddar",
        "mozzarella", "parmesan", "feta", "goat cheese", "brie", "camembert", "ricotta",
        "eggs", "egg whites",

        // Grains & Flours
        "flour", "all-purpose flour", "whole wheat flour", "almond flour", "coconut flour",
        "rice flour", "cornstarch", "tapioca starch", "baking powder", "baking soda", "yeast",

        // Sweeteners & Liquids
        "sugar", "brown sugar", "honey", "maple syrup", "agave nectar", "molasses", "corn syrup",
        "vanilla extract", "almond extract",

        // Seasonings & Condiments
        "salt", "sea salt", "himalayan pink salt", "soy sauce", "tamari", "coconut aminos",
        "vinegar", "apple cider vinegar", "balsamic vinegar", "white vinegar", "rice vinegar",
        "worcestershire sauce", "hot sauce", "sriracha", "tabasco", "ketchup", "mustard",
        "dijon mustard", "mayonnaise", "peanut butter", "almond butter", "tahini",

        // Fresh Herbs
        "basil", "oregano", "thyme", "rosemary", "sage", "bay leaves", "marjoram",
        "parsley", "cilantro", "dill", "chives", "scallions", "tarragon", "mint",

        // Spices
        "ginger", "turmeric", "cumin", "coriander", "cinnamon", "nutmeg", "cloves",
        "anise", "fennel", "cardamom", "cinnamon stick", "star anise", "saffron",

        // Fruits & Citrus
        "lemon", "lime", "orange", "grapefruit", "apple", "banana", "strawberry",
        "blueberry", "raspberry", "blackberry", "cranberry", "grape", "raisin", "pineapple",
        "mango", "papaya", "coconut",

        // Nuts & Seeds
        "almonds", "cashews", "walnuts", "peanuts", "pecans", "pine nuts", "macadamia nuts",
        "sesame seeds", "sunflower seeds", "pumpkin seeds",

        // Sauces & Pastes
        "tomato sauce", "tomato paste", "hummus", "pesto", "salsa", "guacamole",
        "miso paste", "fish sauce", "oyster sauce", "hoisin sauce", "teriyaki sauce",

        // Stocks & Broths
        "chicken stock", "beef stock", "vegetable stock", "fish stock", "bone broth",

        // Wines & Spirits
        "white wine", "red wine", "beer", "vodka", "rum", "whiskey"
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
