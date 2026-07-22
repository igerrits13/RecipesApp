import SearchBar from "../components/SearchBar";

export default function AdminView() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Admin Page</h1>
      <SearchBar />
    </div>
  );
}
