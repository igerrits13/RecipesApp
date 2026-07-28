import SearchBar from "../components/SearchBar";
import Hero from "../components/Hero";

import HeroImage from "../assets/images/heroImg.jpg";

export default function HomeView() {
  const children = (
    <div className="absolute min-w-1/2 md:min-w-1/3 xl:min-w-1/4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      {<SearchBar />}
    </div>
  );

  return (
    <div className="flex flex-col">
      <Hero backgroundImage={HeroImage} children={children} />
    </div>
  );
}
