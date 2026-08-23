import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecipeSchema } from "../schemas/RecipeSchema";
import { useForm, type SubmitHandler } from "react-hook-form";
import CreateRecipeTitle from "./CreateRecipeTitle";

export default function CreateRecipeForm() {
  // Type for the form values
  type CreateRecipeData = z.infer<typeof createRecipeSchema>;

  // React hook form
  const { handleSubmit } = useForm<CreateRecipeData>({
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
    mode: "onBlur",
    resolver: zodResolver(createRecipeSchema),
  });

  // Function to handle form submission
  const onSubmit: SubmitHandler<CreateRecipeData> = (data) => console.log(data);

  return (
    <form
      className="grid sm:grid-cols-[1fr_3fr]"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Keep a blank div for spacing on larger screens */}
      <div></div>
      <CreateRecipeTitle />
    </form>
  );
}
