package com.example._x_recipes.model;

public class RecipeResult {
    private String id;
    private String name;
    private String image;
    private Integer cookTime;
    private Integer matchedIngredientCount;
    private Integer matchPercentage;
    private Double score;

    public RecipeResult(String id, String name, String image, Integer cookTime,
                        Integer matchedIngredientCount, Integer matchPercentage, Double score) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.cookTime = cookTime;
        this.matchedIngredientCount = matchedIngredientCount;
        this.matchPercentage = matchPercentage;
        this.score = score;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getImage() { return image; }
    public Integer getCookTime() { return cookTime; }
    public Integer getMatchedIngredientCount() { return matchedIngredientCount; }
    public Integer getMatchPercentage() { return matchPercentage; }
    public Double getScore() { return score; }
}
