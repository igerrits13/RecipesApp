import { useEffect, useState } from "react";

import { Search } from "lucide-react";

// SearchBar component allows users to input a search query and submit it to perform a search
export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  // Add an event listener to update the width state when the window is resized
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  });

  return (
    <div className="flex items-center gap-1 rounded-full color-sage-olive-500 py-1 px-3 sm:py-2 sm:px-5 font-body text-xs md:text-sm lg:text-base xl:text-lg">
      <input
        className="grow text-white focus:outline-none"
        type="text"
        placeholder={
          width > 480 ? "Search a recipe or ingredient..." : "Search..."
        }
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button
        className="cursor-pointer"
        onClick={() => console.log("Search query:", searchQuery)}
      >
        <Search className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
      </button>
    </div>
  );
}
