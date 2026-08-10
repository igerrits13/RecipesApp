import SecondaryNavBar from "../components/SecondaryNavBar";
import Hero from "../components/Hero";
import HeroImage from "../assets/images/heroImg.jpg";
import RegistrationForm from "../components/RegistrationForm";
import Footer from "../components/Footer";

// RegisterView component that allows users to register an account by providing their username, display name, email, password, and confirming their password
export default function RegisterView() {
  return (
    <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-12 mx-auto flex flex-col gap-4 h-screen landscape:h-auto landscape:min-h-screen justify-between">
      <SecondaryNavBar />
      <Hero backgroundImage={HeroImage} children={<RegistrationForm />} />
      <Footer />
    </div>
  );
}
