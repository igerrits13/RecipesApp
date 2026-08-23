import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/AuthStore";
import ValidationError from "./ValidationError";

// Login form for existing users
export default function LoginForm() {
  // Allow navigation
  const navigate = useNavigate();

  // Access the login function from the auth store
  const { login, authError } = useAuthStore();

  // State for password visibility
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Zod schema for the form values and errors
  const loginSchema = z.object({
    login: z.string().min(1),
    password: z.string().min(1),
  });

  // Type for the form values
  type LoginCredentials = z.infer<typeof loginSchema>;

  // React hook form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    defaultValues: {
      login: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  // Function to handle form submission
  const onSubmit: SubmitHandler<LoginCredentials> = async (data) => {
    try {
      await login(data);
      navigate("/");
    } catch {
      // Error is handled in the auth store and displayed to the user
    }
  };

  return (
    <form
      className="flex flex-col gap-2 sm:gap-4 items-center z-10 w-3/4 sm:w-1/2 lg:w-1/3 2xl:w-1/4 font-body rounded-4xl p-6 bg-antique-parchment-500"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-4 font-subtitle font-bold text-center text-ink-black-500 text-xl md:text-2xl">
        Get Back to Cooking!
      </div>
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          id="login"
          autoComplete="username"
          className="w-full grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Username or Email"}
          {...register("login")}
        />
      </div>
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          id="password"
          autoComplete="current-password"
          className="w-full grow text-white focus:outline-none"
          type={passwordVisible ? "text" : "password"}
          placeholder={"Password"}
          {...register("password")}
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
      {(errors.login?.message || errors.password?.message) && (
        <ValidationError message={"Login information required"} />
      )}
      {authError && <ValidationError message={authError} />}
      <button
        className={`w-1/2 mt-4 text-center rounded-full ${isSubmitting ? "bg-rosewood-300" : "bg-rosewood-500"} text-white py-1 px-3 sm:py-2 sm:px-5 cursor-pointer hover:bg-rosewood-300`}
        type="submit"
        disabled={isSubmitting}
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
