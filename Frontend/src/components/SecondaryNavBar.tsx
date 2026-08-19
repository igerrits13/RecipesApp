import { useEffect, useState } from "react";
import SearchBar from "./SearchBar";
import { Search } from "lucide-react";
import UserDropdown from "./UserDropdown";

export default function SecondaryNavBar() {
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  // Add an evenet listener to update the width state when the window is resized
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  });

  return (
    <nav className="w-full flex items-center justify-between">
      <div className="font-title text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl">
        Recipe Website
      </div>
      <div className="flex gap-2 items-center justify-end w-1/2">
        {width > 640 ? (
          <div className="w-full md:w-3/4 xl:w-2/3 2xl:w-1/2">
            <SearchBar />
          </div>
        ) : (
          <Search className="size-6 text-sage-olive-500" />
        )}
        <UserDropdown />
      </div>
    </nav>
  );
}
