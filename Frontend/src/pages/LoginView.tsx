import SecondaryNavBar from "../components/SecondaryNavBar";
import Hero from "../components/Hero";
import LoginForm from "../components/LoginForm";
import Footer from "../components/Footer";

import HeroImage from "../assets/images/heroImg.jpg";

export default function LoginView() {
  return (
    <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-12 mx-auto flex flex-col gap-4 h-screen landscape:h-auto landscape:min-h-screen justify-between">
      <SecondaryNavBar />
      <Hero backgroundImage={HeroImage} children={<LoginForm />} />
      <Footer />
    </div>
  );
}
