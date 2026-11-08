import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecipeSchema } from "../../schemas/RecipeSchema";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import CreateRecipeTitle from "./CreateRecipeTitle";
import CreateRecipeImage from "./CreateRecipeImage";
import { compressRecipeImage } from "../../utils/ImageHelpers";
import CreateRecipeDescription from "./CreateRecipeDescription";
import CreateRecipeIngredients from "./CreateRecipeIngredients";
import CreateRecipeSteps from "./CreateRecipeSteps";
import CreateRecipeChefNotes from "./CreateRecipeChefNotes";
import CreateRecipeLinkedRecipes from "./CreateRecipeLinkedRecipes";
import CreateRecipeMetadata from "./CreateRecipeMetadata";
import { useNavigate } from "react-router-dom";
import { useRecipeStore } from "../../store/RecipeStore";
import ValidationError from "../ValidationError";

export default function CreateRecipeForm() {
  // Alow navigation
  const navigate = useNavigate();

  // Access the create recipe function from the recipe store
  const { createRecipe, createRecipeError } = useRecipeStore();

  // Type for the form values
  type CreateRecipeData = z.infer<typeof createRecipeSchema>;

  // React hook form
  const methods = useForm<CreateRecipeData>({
    defaultValues: {
      title: "",
      description: "",
      ingredientSections: [
        {
          sectionTitle: "",
          ingredients: [
            {
              quantity: null,
              measurement: null,
              ingredient: "",
              additionalInfo: "",
            },
          ],
        },
      ],
      stepSections: [{ sectionTitle: "", steps: [""] }],
      preptime: { hours: 0, minutes: 0 },
      cooktime: { hours: 0, minutes: 0 },
      servings: 0,
      image: null,
      notes: "",
      linkedRecipes: [],
      source: null,
      tags: [],
      cuisines: [],
      meals: [],
      holidays: [],
      seasons: [],
      isPublished: false,
    },
    resolver: zodResolver(createRecipeSchema),
    mode: "onBlur",
  });

  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  // Add an evenet listener to update the width state when the window is resized
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  });

  // Function to handle form submission
  const onSubmit: SubmitHandler<CreateRecipeData> = async (data) => {
    try {
      // Convert all data into a formData object to send to the backend
      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("description", data.description);

      // Convert the ingredient sections into a JSON string and add it to the formData object
      formData.append(
        "ingredientSections",
        JSON.stringify(data.ingredientSections),
      );

      // Convert the step sections into a JSON string and add it to the formData object
      formData.append("stepSections", JSON.stringify(data.stepSections));

      // Convert preptime and cooktime to seconds
      const preptimeSeconds =
        data.preptime.hours * 3600 + data.preptime.minutes * 60;
      formData.append("preptimeSeconds", preptimeSeconds.toString());
      const cooktimeSeconds =
        data.cooktime.hours * 3600 + data.cooktime.minutes * 60;
      formData.append("cooktimeSeconds", cooktimeSeconds.toString());

      formData.append("servings", data.servings.toString());

      // Add the image if one is provided
      if (data.image) {
        const compressedImage = await compressRecipeImage(data.image);

        formData.append("image", compressedImage);
      }

      // Add the notes if one is provided
      if (data.notes) {
        formData.append("notes", data.notes);
      }

      // Add linked recipes if provided
      if (data.linkedRecipes.length > 0) {
        formData.append("linkedRecipes", JSON.stringify(data.linkedRecipes));
      }

      // Add the source if one is provided
      if (data.source) {
        formData.append("source", JSON.stringify(data.source));
      }

      // Add additional metadata if provided
      if (data.tags.length > 0) {
        formData.append("tags", JSON.stringify(data.tags));
      }
      if (data.cuisines.length > 0) {
        formData.append("cuisines", JSON.stringify(data.cuisines));
      }
      if (data.meals.length > 0) {
        formData.append("meals", JSON.stringify(data.meals));
      }
      if (data.holidays.length > 0) {
        formData.append("holidays", JSON.stringify(data.holidays));
      }
      if (data.seasons.length > 0) {
        formData.append("seasons", JSON.stringify(data.seasons));
      }

      formData.append("isPublished", data.isPublished.toString());

      const response = await createRecipe(formData);
      console.log(response);
      navigate("/");
    } catch {
      // Error is handled in the recipe store and displayed to the user
    }
  };

  return (
    <FormProvider {...methods}>
      <form className="flex flex-col" onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="md:grid md:grid-cols-[1fr_4fr]">
          <CreateRecipeTitle width={width} />
          {width <= 768 ? (
            <>
              <CreateRecipeImage /> <CreateRecipeDescription />
            </>
          ) : (
            <>
              <CreateRecipeDescription /> <CreateRecipeImage />
            </>
          )}
          <CreateRecipeIngredients />
          <CreateRecipeSteps />
        </div>
        <div className="flex flex-col pt-8 gap-8">
          <CreateRecipeChefNotes />
          <CreateRecipeLinkedRecipes />
          <CreateRecipeMetadata />
        </div>
        <div className="flex justify-center">
          {createRecipeError && <ValidationError message={createRecipeError} />}
        </div>
        <button
          className={`place-self-center w-1/2 sm:w-1/3 lg:w-1/4 2xl:w-1/6 mt-4 text-center rounded-full ${methods.formState.isSubmitting ? "bg-rosewood-300" : "bg-rosewood-500"} text-white py-1 px-3 sm:py-2 sm:px-5 cursor-pointer hover:bg-rosewood-300`}
          type="submit"
          disabled={methods.formState.isSubmitting}
        >
          {methods.formState.isSubmitting ? "Creating..." : "Create Recipe"}
        </button>
      </form>
    </FormProvider>
  );
}
