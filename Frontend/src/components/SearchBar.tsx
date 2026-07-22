import { useState } from "react";

import { Search } from "lucide-react";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex items-center gap-1 rounded-full color-sage-olive-500 py-2 px-5">
      <input
        className="grow text-white font-body-18 focus:outline-none"
        type="text"
        placeholder="Search a recipe or ingredient..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={() => console.log("Search query:", searchQuery)}>
        <Search className="h-7 w-7 text-white " />
      </button>
    </div>
  );
}
