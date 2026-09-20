import CreateRecipeForm from "../components/CreateRecipe/CreateRecipeForm";
import Footer from "../components/Footer";
import SecondaryNavBar from "../components/SecondaryNavBar";

// CreateRecipeView component that allows users to create a new recipe
export default function CreateRecipeView() {
  return (
    <div className="flex flex-col text-base px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-12 mx-auto gap-4 min-h-screen">
      <SecondaryNavBar />
      <CreateRecipeForm />
      <Footer />
    </div>
  );
}
