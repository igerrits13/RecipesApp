import SearchBar from "../components/SearchBar";

export default function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      <SearchBar />
    </div>
  );
}
