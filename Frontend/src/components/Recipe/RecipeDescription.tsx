import { Clock, HandPlatter } from "lucide-react";
import { useRecipeStore } from "../../store/RecipeStore";

// Helper function to convert seconds to hours and minutes
function secondsToTime(seconds: number): { hours: number; minutes: number } {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return { hours, minutes };
}

// RecipeDescription component displays the description of the recipe
export default function RecipeDescription() {
  // Recipe store
  const { recipe } = useRecipeStore();

  if (!recipe) return <div>Loading...</div>;

  // Get the preptime and cooktime in hours and minutes
  const { hours: preptimeHours, minutes: preptimeMinutes } = secondsToTime(
    recipe.preptimeSeconds,
  );
  const { hours: cooktimeHours, minutes: cooktimeMinutes } = secondsToTime(
    recipe.cooktimeSeconds,
  );

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex grow flex-col py-6 items-center gap-2 h-full bg-antique-parchment-500 text-ink-black-500 text-nowrap">
        {/* Prep/Cook time */}
        <div className="flex px-2">
          {(recipe.preptimeSeconds > 0 || recipe.cooktimeSeconds > 0) && (
            <>
              {recipe.preptimeSeconds > 0 && (
                <>
                  {preptimeHours > 0 && `${preptimeHours}h `}
                  {preptimeMinutes > 0 && `${preptimeMinutes}m`}
                  {" Prep"}
                </>
              )}

              {recipe.preptimeSeconds > 0 && recipe.cooktimeSeconds > 0 && " /"}

              {recipe.cooktimeSeconds > 0 && (
                <>
                  {cooktimeHours > 0 && ` ${cooktimeHours}h`}
                  {cooktimeMinutes > 0 && ` ${cooktimeMinutes}m`}
                  {" Cook"}
                </>
              )}

              <Clock className="size-6 text-rosewood-500 ml-2" />
            </>
          )}
        </div>
        {/* Servings */}
        <div className="flex px-2">
          {recipe.servings} Servings{" "}
          <HandPlatter className="size-6 text-rosewood-500 ml-2" />
        </div>
        <hr className="w-full my-2 border-2 border-rosewood-500" />

        {/* Description */}
        <div className="flex w-full h-full px-4 text-start items-center text-wrap overflow-y-auto">
          {recipe.description}
        </div>
      </div>
      <hr className="w-full place-self-end border-2 border-rosewood-500" />
    </div>
  );
}
