import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/AuthStore";
import ValidationError from "./ValidationError";

// Registration form with input fields for username, display name, email, password, and confirm password, along with a register button
export default function RegistrationForm() {
  const navigate = useNavigate();
  // Auth error to display and register user function
  const { authError, registerUser } = useAuthStore();

  // State for password and confirm password visibility
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Zod schema for the form values and errors
  const registrationSchema = z
    .object({
      username: z
        .string()
        .trim()
        .min(1, "Username is required")
        .min(3, "Username must be at least 3 characters")
        .max(32, "Username must be at most 32 characters")
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers, and underscores",
        ),
      displayName: z
        .string()
        .trim()
        .min(1, "Display name is required")
        .min(3, "Display name must be at least 3 characters")
        .max(32, "Display name must be at most 32 characters"),
      email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Invalid email"),
      password: z
        .string()
        .min(1, "Password is required")
        .min(6, "Password must be at least 6 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(
          /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
          "Password must contain at least one uppercase letter, one number, and one special character",
        ),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  // Type for the form values
  type RegistrationCredentials = z.infer<typeof registrationSchema>;

  // React hook form
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationCredentials>({
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
  });

  // Function to handle form submission
  const onSubmit: SubmitHandler<RegistrationCredentials> = async (data) => {
    try {
      await registerUser(data);
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
        Join the Family!
      </div>
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          id="username"
          autoComplete="username"
          className="w-full grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Username*"}
          {...register("username")}
          onBlur={(e) => {
            const trimmedUsername = e.target.value.trim();
            setValue("username", trimmedUsername, { shouldValidate: true });
          }}
        />
      </div>
      {errors.username?.message && (
        <ValidationError message={errors.username.message} />
      )}
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          id="displayName"
          autoComplete="name"
          className="w-full grow text-white focus:outline-none"
          type={"text"}
          placeholder={"Displayname*"}
          {...register("displayName")}
          onBlur={(e) => {
            const trimmedDisplayName = e.target.value.trim();
            setValue("displayName", trimmedDisplayName, {
              shouldValidate: true,
            });
          }}
        />
      </div>
      {errors.displayName?.message && (
        <ValidationError message={errors.displayName.message} />
      )}
      <div className="flex w-full rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          id="email"
          autoComplete="email"
          className="w-full grow text-white focus:outline-none"
          type={"email"}
          placeholder={"Email*"}
          {...register("email")}
          onBlur={(e) => {
            const trimmedEmail = e.target.value.trim();
            setValue("email", trimmedEmail, { shouldValidate: true });
          }}
        />
      </div>
      {errors.email?.message && (
        <ValidationError message={errors.email.message} />
      )}
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          id="password"
          autoComplete="new-password"
          className="w-full grow text-white focus:outline-none"
          type={passwordVisible ? "text" : "password"}
          placeholder={"Password*"}
          {...register("password")}
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
      {errors.password?.message && (
        <ValidationError message={errors.password.message} />
      )}
      <div className="flex w-full gap-1 rounded-full bg-sage-olive-500 py-1 px-3">
        <input
          id="confirmPassword"
          autoComplete="new-password"
          className="w-full grow text-white focus:outline-none"
          type={confirmPasswordVisible ? "text" : "password"}
          placeholder={"Confirm Password*"}
          {...register("confirmPassword")}
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
      {errors.confirmPassword?.message && (
        <ValidationError message={errors.confirmPassword.message} />
      )}
      {authError && <ValidationError message={authError} />}
      <button
        className="w-1/2 mt-4 text-center rounded-full bg-rosewood-500 text-white py-1 px-3 sm:py-2 sm:px-5 cursor-pointer hover:bg-rosewood-300"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Registering..." : "Register"}
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
