import SecondaryNavBar from "../components/SecondaryNavBar";
import SearchBar from "../components/SearchBar";
import Hero from "../components/Hero";
import HeroImage from "../assets/images/heroImg.jpg";
import Footer from "../components/Footer";

export default function HomeView() {
  const children = (
    <div className="z-10 min-w-1/2 md:min-w-1/3 xl:min-w-1/4">
      {<SearchBar />}
    </div>
  );

  return (
    <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-12 mx-auto flex flex-col">
      <SecondaryNavBar />
      <Hero backgroundImage={HeroImage} children={children} />
      <Footer />
    </div>
  );
}
