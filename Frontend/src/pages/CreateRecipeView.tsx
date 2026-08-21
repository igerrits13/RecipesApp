import Footer from "../components/Footer";
import SecondaryNavBar from "../components/SecondaryNavBar";
import CreateRecipeTitle from "../components/CreateRecipeTitle";

// CreateRecipeView component that allows users to create a new recipe
export default function CreateRecipeView() {
  return (
    <div className="flex flex-col text-base px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-12 mx-auto gap-4 min-h-screen">
      <SecondaryNavBar />
      <div className="grid sm:grid-cols-[1fr_3fr]">
        {/* Keep a blank div for spacing on larger screens */}
        <div></div>
        <CreateRecipeTitle />
      </div>
      <Footer />
    </div>
  );
}
