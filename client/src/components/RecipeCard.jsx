export function RecipeCard({ recipe, isFavorite, onAddFavorite }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {recipe.image && (
        <img src={recipe.image} alt={recipe.name} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{recipe.name}</h3>

        {recipe.matchPercentage && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Ingredient Match</span>
              <span className="font-medium text-orange-600">{recipe.matchPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${recipe.matchPercentage}%` }}
              />
            </div>
          </div>
        )}

        {recipe.cookTime && (
          <p className="text-sm text-gray-600 mb-4">
            ⏱️ {recipe.cookTime} minutes
          </p>
        )}

        <button
          onClick={onAddFavorite}
          disabled={isFavorite}
          className={`w-full py-2 rounded-lg font-medium transition ${
            isFavorite
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          {isFavorite ? '★ Favorited' : '☆ Add to Favorites'}
        </button>
      </div>
    </div>
  );
}
