import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/AuthUser";
import ValidationError from "./ValidationError";

export default function LoginForm() {
  const [loginString, setLoginString] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Access the login function from the auth store
  const { login, authError, clearAuthError } = useAuthStore();

  // Allow navigation
  const navigate = useNavigate();

  // Clear all errors when focusing on an input field
  const handleInputFocus = () => {
    setLoginError("");
    clearAuthError();
  };

  // Handle user login logic when the login button is clicked
  const handleLoginUser = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (loginString === "" || password === "") {
        setLoginError("Login information required");
        return;
      }
      await login({ login: loginString, password });
      navigate("/");
    } catch {
      // Error is handled in the auth store and displayed to the user
    }
  };

  return (
    <form
      className="flex flex-col gap-2 sm:gap-4 items-center z-10 w-3/4 sm:w-1/2 lg:w-1/3 2xl:w-1/4 font-body rounded-4xl p-6 bg-antique-parchment-500"
      onSubmit={handleLoginUser}
    >
      <div className="mb-4 font-subtitle font-bold text-center text-ink-black-500 text-xl md:text-2xl">
        Get Back to Cooking!
      </div>
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="w-full grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Username or Email"}
          value={loginString}
          onChange={(e) => setLoginString(e.target.value)}
          onFocus={handleInputFocus}
        />
      </div>
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="w-full grow text-white focus:outline-none"
          type={passwordVisible ? "text" : "password"}
          placeholder={"Password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={handleInputFocus}
        />
        <button
          type="button"
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          className="cursor-pointer shrink-0"
          onClick={() => setPasswordVisible(!passwordVisible)}
        >
          {passwordVisible ? (
            <Eye className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          ) : (
            <EyeOff className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          )}
        </button>
      </div>
      {authError && <ValidationError message={authError} />}
      {loginError && <ValidationError message={loginError} />}
      <button
        className="w-1/2 mt-4 text-center rounded-full bg-rosewood-500 text-white py-1 px-3 sm:py-2 sm:px-5 cursor-pointer hover:bg-rosewood-300"
        type="submit"
      >
        Login
      </button>
      <div className="text-center text-xs text-ink-black-300">
        Not a member?{" "}
        <Link
          to="/register"
          className="text-sage-olive-500 underline hover:text-sage-olive-300"
        >
          Join The Family
        </Link>
      </div>
    </form>
  );
}
