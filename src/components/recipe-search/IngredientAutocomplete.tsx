import React, { useState, useEffect, useRef } from 'react';
import { getIngredients } from '../../api/recipeClient';
import './IngredientAutocomplete.css';

interface IngredientAutocompleteProps {
  onSelectIngredients: (selected: string[]) => void;
}

export default function IngredientAutocomplete({
  onSelectIngredients,
}: IngredientAutocompleteProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getIngredients().then(setAllIngredients);
  }, []);

  useEffect(() => {
    onSelectIngredients(selected);
  }, [selected, onSelectIngredients]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim()) {
      const filtered = allIngredients
        .filter(
          (ing) =>
            ing.toLowerCase().includes(value.toLowerCase()) &&
            !selected.includes(ing)
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (ingredient: string) => {
    if (selected.length < 10) {
      setSelected([...selected, ingredient]);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const handleDelete = (ingredient: string) => {
    setSelected(selected.filter((ing) => ing !== ingredient));
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(e.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(e.target as Node)
    ) {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="ingredient-autocomplete" onClick={handleClickOutside}>
      <label>Ingredients</label>
      <div className="selected-chips">
        {selected.map((ing) => (
          <div key={ing} className="chip">
            {ing}
            <button
              type="button"
              onClick={() => handleDelete(ing)}
              className="chip-delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          placeholder="e.g., chicken, garlic..."
          value={input}
          onChange={handleInput}
          onFocus={() => input && setShowSuggestions(true)}
          className="autocomplete-input"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionsRef} className="suggestions">
            {suggestions.map((ing) => (
              <div
                key={ing}
                className="suggestion-item"
                onClick={() => handleSelect(ing)}
              >
                {ing}
              </div>
            ))}
          </div>
        )}
        {showSuggestions && suggestions.length === 0 && input && (
          <div ref={suggestionsRef} className="suggestions">
            <div className="suggestion-item no-match">No matches</div>
          </div>
        )}
      </div>
    </div>
  );
}
