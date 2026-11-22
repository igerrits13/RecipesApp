import RecipeCardTemplate from "../RecipeCardTemplate";

// RecipeLinkedRecipes component that displayuses linked recipes
export default function RecipeLinkedRecipes() {
  return (
    <div className="flex flex-col gap-6 px-4">
      <div className="flex flex-col gap-2 mt-6">
        You may need to make a bit of this:{" "}
        <div className="flex flex-col sm:flex-row flex-wrap gap-6">
          <RecipeCardTemplate cardContents={<div>Recipe Card</div>} />
        </div>
      </div>{" "}
      <div className="flex flex-col gap-2 mt-6">
        Some of our favorite additionas to this meal:{" "}
        <div className="flex flex-col sm:flex-row flex-wrap gap-6">
          <RecipeCardTemplate cardContents={<div>Recipe Card</div>} />
        </div>
      </div>{" "}
      <div className="flex flex-col gap-2 mt-6">
        Different ways to make this recipe your own:{" "}
        <div className="flex flex-col sm:flex-row flex-wrap gap-6">
          <RecipeCardTemplate cardContents={<div>Recipe Card</div>} />
        </div>
      </div>
    </div>
  );
}
