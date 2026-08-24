import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecipeSchema } from "../schemas/RecipeSchema";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import CreateRecipeTitle from "./CreateRecipeTitle";

export default function CreateRecipeForm() {
  // Type for the form values
  type CreateRecipeData = z.infer<typeof createRecipeSchema>;

  // React hook form
  const methods = useForm<CreateRecipeData>({
    defaultValues: {
      title: "",
      description: "",
      ingredientSections: [],
      stepSections: [],
      preptimeSeconds: 0,
      cooktimeSeconds: 0,
      servings: 0,
      image: "",
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

  // Function to handle form submission
  const onSubmit: SubmitHandler<CreateRecipeData> = (data) => {
    console.log("submitting");
    try {
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form className="flex flex-col" onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="grid sm:grid-cols-[1fr_3fr]">
          {/* Keep a blank div for spacing on larger screens */}
          <div></div>
          <CreateRecipeTitle />
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
