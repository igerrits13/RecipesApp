import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";

import SecondaryNavBar from "../components/SecondaryNavBar";
import Hero from "../components/Hero";
import HeroImage from "../assets/images/heroImg.jpg";
import Footer from "../components/Footer";

// RegisterView component that allows users to register an account by providing their username, display name, email, password, and confirming their password
export default function RegisterView() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Handle the visibility of the password field
  const handleSetPasswordVisible = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPasswordVisible(!passwordVisible);
  };

  // Handle the visibility of the confirm password field
  const handleSetConfirmPasswordVisible = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  // Handle user registration logic when the register button is clicked
  const handleRegisterUser = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Handle user registration logic here
    if (
      username === "" ||
      displayName === "" ||
      email === "" ||
      password === "" ||
      confirmPassword === ""
    ) {
      console.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    } else {
      console.log("Registering user with the following details:");
      console.log("Username:", username);
      console.log("Display Name:", displayName);
      console.log("Email:", email);
      console.log("Password:", password);
    }
  };

  // Registration form with input fields for username, display name, email, password, and confirm password, along with a register button
  const children = (
    <form className="flex flex-col gap-2 sm:gap-4 items-center z-10 w-3/4 sm:w-1/2 lg:w-1/3 2xl:w-1/4 font-body rounded-4xl p-6 color-antique-parchment-500">
      <div className="mb-4 font-subtitle font-bold text-center text-xl md:text-2xl">
        Join the Family!
      </div>
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Username*"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Displayname*"}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="grow text-white focus:outline-none"
          type={"email"}
          placeholder={"Email*"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="grow text-white focus:outline-none"
          type={passwordVisible ? "text" : "password"}
          placeholder={"Password*"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="cursor-pointer" onClick={handleSetPasswordVisible}>
          {passwordVisible ? (
            <Eye className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          ) : (
            <EyeOff className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          )}
        </button>
      </div>
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="grow text-white focus:outline-none"
          type={confirmPasswordVisible ? "text" : "password"}
          placeholder={"Confirm Password*"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          className="cursor-pointer"
          onClick={handleSetConfirmPasswordVisible}
        >
          {confirmPasswordVisible ? (
            <Eye className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          ) : (
            <EyeOff className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          )}
        </button>
      </div>
      <button
        className="w-1/2 mt-4 text-center rounded-full bg-rosewood-500 text-white py-1 px-3 sm:py-2 sm:px-5"
        onClick={handleRegisterUser}
      >
        Register
      </button>
    </form>
  );

  return (
    <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-12 mx-auto flex flex-col gap-4 h-screen landscape:h-auto landscape:min-h-screen justify-between">
      <SecondaryNavBar />
      <Hero backgroundImage={HeroImage} children={children} />
      <Footer />
    </div>
  );
}
