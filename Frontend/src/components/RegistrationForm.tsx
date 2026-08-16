import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ValidationError from "./ValidationError";
import { useAuthStore } from "../store/AuthUser";

// Registration form with input fields for username, display name, email, password, and confirm password, along with a register button
export default function RegistrationForm() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    passwordMatch: "",
    general: "",
  });

  // Access the register function from the auth store
  const { register, authError, clearAuthError } = useAuthStore();

  // Allow navigation
  const navigate = useNavigate();

  // Regex for username and email, matching with backend logic
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Handle username validation on blur event
  const handleUsernameBlur = () => {
    // Trim any whitespace added to the username
    const trimmedUsername = username.trim();
    setUsername(trimmedUsername);

    if (trimmedUsername) {
      // Ensure the username is in a valid format
      if (!usernameRegex.test(trimmedUsername)) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          username:
            "Username can only contain letters, numbers, and underscores",
        }));
        return;
      } else if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          username: "Username must be between 3 and 32 characters",
        }));
        return;
      }
    }

    // Otherwise clear the validation error
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      username: "",
    }));
  };

  // Handle display name validation on blur event
  const handleDisplayNameBlur = () => {
    // Trim any whitespace added to the display name
    const trimmedDisplayName = displayName.trim();
    setDisplayName(trimmedDisplayName);

    if (trimmedDisplayName) {
      // Ensure the display name is in a valid format
      if (trimmedDisplayName.length < 3 || trimmedDisplayName.length > 32) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          displayName: "Display name must be between 3 and 32 characters",
        }));
        return;
      }
    }
    // Otherwise, clear the validation error
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      displayName: "",
    }));
  };

  // Handle email validation on blur event
  const handleEmailBlur = () => {
    // Trim any whitespace added to the email
    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);

    console.log(trimmedEmail);

    if (trimmedEmail) {
      // Ensure the email is in a valid format
      if (!emailRegex.test(trimmedEmail)) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          email: "Please enter a valid email address",
        }));
        return;
      }
    }
    // Otherwise, clear the validation error
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      email: "",
    }));
  };

  // Handle password validation on blur event
  const handlePasswordBlur = () => {
    if (password) {
      // If the confirm password field is not empty, check if the passwords match
      if (confirmPassword) {
        if (password !== confirmPassword) {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            confirmPassword: "Passwords do not match",
          }));
        } else {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            confirmPassword: "",
          }));
        }
      }
      // Ensure the password is in a valid format
      if (password.length < 6 || password.length > 128) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must be between 6 and 128 characters",
        }));
        return;
      }
    }
    // Otherwise, clear the validation error
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      password: "",
    }));
  };

  // Handle confirm password validation on blur event
  const handleConfirmPasswordBlur = () => {
    if (confirmPassword) {
      // Ensure the passwords match
      if (password !== confirmPassword) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: "Passwords do not match",
        }));
        return;
      }
    }
    // Otherwise, clear the validation error
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      confirmPassword: "",
    }));
  };

  // Clear all validation errors when focusing on an input field
  const handleInputFocus = () => {
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      general: "",
    }));
    clearAuthError();
  };

  // Handle user registration logic when the register button is clicked
  const handleRegisterUser = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (
        username === "" ||
        displayName === "" ||
        email === "" ||
        password === "" ||
        confirmPassword === ""
      ) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          general: "All fields are required",
        }));
        return;
      } else if (password !== confirmPassword) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: "Passwords do not match",
        }));
        return;
      } else {
        await register({ username, displayName, email, password });
        navigate("/");
      }
    } catch {
      // Error is handled in the auth store and displayed to the user
    }
  };

  return (
    <form
      className="flex flex-col gap-2 sm:gap-4 items-center z-10 w-3/4 sm:w-1/2 lg:w-1/3 2xl:w-1/4 font-body rounded-4xl p-6 bg-antique-parchment-500"
      onSubmit={handleRegisterUser}
    >
      <div className="mb-4 font-subtitle font-bold text-center text-ink-black-500 text-xl md:text-2xl">
        Join the Family!
      </div>
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="w-full grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Username*"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleUsernameBlur}
        />
      </div>
      {validationErrors.username && (
        <ValidationError message={validationErrors.username} />
      )}
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="w-full grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Displayname*"}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleDisplayNameBlur}
        />
      </div>
      {validationErrors.displayName && (
        <ValidationError message={validationErrors.displayName} />
      )}
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="w-full grow text-white focus:outline-none"
          type={"email"}
          placeholder={"Email*"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleEmailBlur}
        />
      </div>
      {validationErrors.email && (
        <ValidationError message={validationErrors.email} />
      )}
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="w-full grow text-white focus:outline-none"
          type={passwordVisible ? "text" : "password"}
          placeholder={"Password*"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handlePasswordBlur}
        />
        <button
          type="button"
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          className="cursor-pointer"
          onClick={() => setPasswordVisible(!passwordVisible)}
        >
          {passwordVisible ? (
            <Eye className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          ) : (
            <EyeOff className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          )}
        </button>
      </div>
      {validationErrors.password && (
        <ValidationError message={validationErrors.password} />
      )}
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          className="w-full grow text-white focus:outline-none"
          type={confirmPasswordVisible ? "text" : "password"}
          placeholder={"Confirm Password*"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleConfirmPasswordBlur}
        />
        <button
          type="button"
          aria-label={
            confirmPasswordVisible ? "Hide password" : "Show password"
          }
          className="cursor-pointer shrink-0"
          onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
        >
          {confirmPasswordVisible ? (
            <Eye className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          ) : (
            <EyeOff className="h-4 w-4 lg:h-6 lg:w-6 text-white " />
          )}
        </button>
      </div>
      {validationErrors.confirmPassword && (
        <ValidationError message={validationErrors.confirmPassword} />
      )}
      {authError && <ValidationError message={authError} />}
      {validationErrors.general && (
        <ValidationError message={validationErrors.general} />
      )}
      <button
        className="w-1/2 mt-4 text-center rounded-full bg-rosewood-500 text-white py-1 px-3 sm:py-2 sm:px-5 cursor-pointer hover:bg-rosewood-300"
        type="submit"
      >
        Register
      </button>
      <div className="text-center text-xs text-ink-black-300">
        Already a member?{" "}
        <Link
          to="/login"
          className="text-sage-olive-500 underline hover:text-sage-olive-300"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
