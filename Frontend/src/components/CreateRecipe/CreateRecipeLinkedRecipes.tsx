import { useFieldArray, useFormContext } from "react-hook-form";
import CreateRecipeLinkedRecipeAdd from "./CreateRecipeLinkedRecipeAdd";
import type { CreateRecipeData } from "../../types/Recipe";
import CreateRecipeLinkedRecipeCard from "./CreateRecipeLinkedRecipeCard";
import ValidationError from "../ValidationError";

const MAX_LINKED_RECIPES = 3;

// CreateRecipeLinkedRecipes component that allows users to add linked recipes to a recipe they are createing
export default function CreateRecipeLinkedRecipes() {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateRecipeData>();

  const {
    fields: linkedRecipeFields,
    append: appendLinkedRecipe,
    remove: removeLinkedRecipe,
  } = useFieldArray({ control, name: "linkedRecipes" });

  return (
    <div className="flex flex-col gap-6 px-4">
      Add any linked recipes here (3 max):
      <div className="flex flex-col gap-2 mt-6">
        You may need to make a bit of this (components):{" "}
        <div className="flex flex-col sm:flex-row gap-6 overflow-hidden scroll-auto">
          {linkedRecipeFields.map((field, linkedRecipeIndex) => {
            if (field.role !== "component") return null;

            return (
              <CreateRecipeLinkedRecipeCard
                key={field.id}
                recipe={field}
                linkedRecipeIndex={linkedRecipeIndex}
                removeLinkedRecipe={removeLinkedRecipe}
              />
            );
          })}
          <CreateRecipeLinkedRecipeAdd
            maxLinkedRecipes={MAX_LINKED_RECIPES}
            totalLinkedRecipes={linkedRecipeFields.length}
            linkedRecipeType="component"
            appendLinkedRecipe={appendLinkedRecipe}
          />
        </div>
      </div>{" "}
      <div className="flex flex-col gap-2 mt-6">
        Some of our favorite additionas to this meal (pairings):{" "}
        <div className="flex flex-col sm:flex-row gap-6 overflow-hidden scroll-auto">
          {linkedRecipeFields.map((field, linkedRecipeIndex) => {
            if (field.role !== "pairing") return null;

            return (
              <CreateRecipeLinkedRecipeCard
                key={field.id}
                recipe={field}
                linkedRecipeIndex={linkedRecipeIndex}
                removeLinkedRecipe={removeLinkedRecipe}
              />
            );
          })}
          <CreateRecipeLinkedRecipeAdd
            maxLinkedRecipes={MAX_LINKED_RECIPES}
            totalLinkedRecipes={linkedRecipeFields.length}
            linkedRecipeType="pairing"
            appendLinkedRecipe={appendLinkedRecipe}
          />
        </div>
      </div>{" "}
      <div className="flex flex-col gap-2 mt-6">
        Different ways to make this recipe your own (variations):{" "}
        <div className="flex flex-col sm:flex-row gap-6 overflow-hidden scroll-auto">
          {linkedRecipeFields.map((field, linkedRecipeIndex) => {
            if (field.role !== "variation") return null;

            return (
              <CreateRecipeLinkedRecipeCard
                key={field.id}
                recipe={field}
                linkedRecipeIndex={linkedRecipeIndex}
                removeLinkedRecipe={removeLinkedRecipe}
              />
            );
          })}
          <CreateRecipeLinkedRecipeAdd
            maxLinkedRecipes={MAX_LINKED_RECIPES}
            totalLinkedRecipes={linkedRecipeFields.length}
            linkedRecipeType="variation"
            appendLinkedRecipe={appendLinkedRecipe}
          />
        </div>
      </div>
      {errors.linkedRecipes?.message && (
        <ValidationError message={errors.linkedRecipes.message} />
      )}
    </div>
  );
}
