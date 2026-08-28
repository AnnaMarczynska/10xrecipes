package com.example._x_recipes.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Recipe {
    @JsonProperty("idMeal")
    private String id;

    @JsonProperty("strMeal")
    private String name;

    @JsonProperty("strMealThumb")
    private String image;

    @JsonProperty("strIngredient1")
    private String ingredient1;
    @JsonProperty("strIngredient2")
    private String ingredient2;
    @JsonProperty("strIngredient3")
    private String ingredient3;
    @JsonProperty("strIngredient4")
    private String ingredient4;
    @JsonProperty("strIngredient5")
    private String ingredient5;
    @JsonProperty("strIngredient6")
    private String ingredient6;
    @JsonProperty("strIngredient7")
    private String ingredient7;
    @JsonProperty("strIngredient8")
    private String ingredient8;
    @JsonProperty("strIngredient9")
    private String ingredient9;
    @JsonProperty("strIngredient10")
    private String ingredient10;
    @JsonProperty("strIngredient11")
    private String ingredient11;
    @JsonProperty("strIngredient12")
    private String ingredient12;
    @JsonProperty("strIngredient13")
    private String ingredient13;
    @JsonProperty("strIngredient14")
    private String ingredient14;
    @JsonProperty("strIngredient15")
    private String ingredient15;
    @JsonProperty("strIngredient16")
    private String ingredient16;
    @JsonProperty("strIngredient17")
    private String ingredient17;
    @JsonProperty("strIngredient18")
    private String ingredient18;
    @JsonProperty("strIngredient19")
    private String ingredient19;
    @JsonProperty("strIngredient20")
    private String ingredient20;

    @JsonProperty("strInstructions")
    private String instructions;

    @JsonProperty("strCookTime")
    private Integer cookTime;

    @JsonProperty("strYield")
    private String yield;

    public List<String> getIngredients() {
        List<String> ingredients = new java.util.ArrayList<>();
        if (ingredient1 != null && !ingredient1.isEmpty()) ingredients.add(ingredient1);
        if (ingredient2 != null && !ingredient2.isEmpty()) ingredients.add(ingredient2);
        if (ingredient3 != null && !ingredient3.isEmpty()) ingredients.add(ingredient3);
        if (ingredient4 != null && !ingredient4.isEmpty()) ingredients.add(ingredient4);
        if (ingredient5 != null && !ingredient5.isEmpty()) ingredients.add(ingredient5);
        if (ingredient6 != null && !ingredient6.isEmpty()) ingredients.add(ingredient6);
        if (ingredient7 != null && !ingredient7.isEmpty()) ingredients.add(ingredient7);
        if (ingredient8 != null && !ingredient8.isEmpty()) ingredients.add(ingredient8);
        if (ingredient9 != null && !ingredient9.isEmpty()) ingredients.add(ingredient9);
        if (ingredient10 != null && !ingredient10.isEmpty()) ingredients.add(ingredient10);
        if (ingredient11 != null && !ingredient11.isEmpty()) ingredients.add(ingredient11);
        if (ingredient12 != null && !ingredient12.isEmpty()) ingredients.add(ingredient12);
        if (ingredient13 != null && !ingredient13.isEmpty()) ingredients.add(ingredient13);
        if (ingredient14 != null && !ingredient14.isEmpty()) ingredients.add(ingredient14);
        if (ingredient15 != null && !ingredient15.isEmpty()) ingredients.add(ingredient15);
        if (ingredient16 != null && !ingredient16.isEmpty()) ingredients.add(ingredient16);
        if (ingredient17 != null && !ingredient17.isEmpty()) ingredients.add(ingredient17);
        if (ingredient18 != null && !ingredient18.isEmpty()) ingredients.add(ingredient18);
        if (ingredient19 != null && !ingredient19.isEmpty()) ingredients.add(ingredient19);
        if (ingredient20 != null && !ingredient20.isEmpty()) ingredients.add(ingredient20);
        return ingredients;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public Integer getCookTime() { return cookTime; }
    public void setCookTime(Integer cookTime) { this.cookTime = cookTime; }
    public String getYield() { return yield; }
    public void setYield(String yield) { this.yield = yield; }

    public void setIngredient1(String ingredient1) { this.ingredient1 = ingredient1; }
    public void setIngredient2(String ingredient2) { this.ingredient2 = ingredient2; }
    public void setIngredient3(String ingredient3) { this.ingredient3 = ingredient3; }
    public void setIngredient4(String ingredient4) { this.ingredient4 = ingredient4; }
    public void setIngredient5(String ingredient5) { this.ingredient5 = ingredient5; }
    public void setIngredient6(String ingredient6) { this.ingredient6 = ingredient6; }
    public void setIngredient7(String ingredient7) { this.ingredient7 = ingredient7; }
    public void setIngredient8(String ingredient8) { this.ingredient8 = ingredient8; }
    public void setIngredient9(String ingredient9) { this.ingredient9 = ingredient9; }
    public void setIngredient10(String ingredient10) { this.ingredient10 = ingredient10; }
    public void setIngredient11(String ingredient11) { this.ingredient11 = ingredient11; }
    public void setIngredient12(String ingredient12) { this.ingredient12 = ingredient12; }
    public void setIngredient13(String ingredient13) { this.ingredient13 = ingredient13; }
    public void setIngredient14(String ingredient14) { this.ingredient14 = ingredient14; }
    public void setIngredient15(String ingredient15) { this.ingredient15 = ingredient15; }
    public void setIngredient16(String ingredient16) { this.ingredient16 = ingredient16; }
    public void setIngredient17(String ingredient17) { this.ingredient17 = ingredient17; }
    public void setIngredient18(String ingredient18) { this.ingredient18 = ingredient18; }
    public void setIngredient19(String ingredient19) { this.ingredient19 = ingredient19; }
    public void setIngredient20(String ingredient20) { this.ingredient20 = ingredient20; }
}
