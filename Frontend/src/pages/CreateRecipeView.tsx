import SearchBar from "../components/SearchBar";

export default function CreateRecipeView() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Create a New Recipe</h1>
      <SearchBar />
    </div>
  );
}
