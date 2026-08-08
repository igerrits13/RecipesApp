import { useEffect, useState } from "react";
import SearchBar from "./SearchBar";
import { Menu, Search } from "lucide-react";

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
      <div className="font-subtitle font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl">
        Logo here
      </div>
      <div className="flex gap-2 items-center justify-end w-1/2">
        {width > 640 ? (
          <div className="w-full md:w-3/4 xl:w-2/3 2xl:w-1/2">
            <SearchBar />
          </div>
        ) : (
          <Search className="size-6 text-sage-olive-500" />
        )}{" "}
        {width > 640 ? (
          <img
            className="rounded-full size-12 md:size-14 lg:size-16 xl:size-18 2xl:size-20"
            src="https://api.dicebear.com/9.x/fun-emoji/svg?seed=admin1&size=64"
            alt="Profile Image"
          />
        ) : (
          <Menu className="size-6 text-sage-olive-500" />
        )}
      </div>
    </nav>
  );
}
