import SecondaryNavBar from "../components/SecondaryNavBar";
import RecipeViewContainer from "../components/Recipe/RecipeViewContainer";
import Footer from "../components/Footer";

export default function RecipeView() {
  return (
    <div className="flex flex-col text-base px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-12 mx-auto gap-4 min-h-screen">
      <SecondaryNavBar />
      <RecipeViewContainer />
      <Footer />
    </div>
  );
}
