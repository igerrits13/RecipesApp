import { useAuthStore } from "../store/AuthStore";
import ValidationError from "./ValidationError";
import { Link, useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

export default function UserDropdown() {
  // Get the user from global state
  const { user, logout, logoutError } = useAuthStore();

  // Allow navigation
  const navigate = useNavigate();

  // Handle logout logic and navigation when logout button is clicked
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      // Error is handled in the auth store and displayed to the user
    }
  };

  return (
    <Menu>
      <MenuButton
        aria-label={user ? "Open profile menu" : "Open account menu"}
        className="inline-flex items-center focus:not-data-focus:outline-none cursor-pointer"
      >
        <img
          className="rounded-full size-8 sm:size-12 md:size-14 lg:size-16 xl:size-18 2xl:size-20"
          src={
            user
              ? user.profileImage
              : "https://api.dicebear.com/9.x/fun-emoji/svg?seed=admin1&size=64"
          }
          alt=""
        />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className="z-20 w-52 origin-top-right rounded-xl border border-ink-black-300 bg-antique-parchment-500 py-2 px-1 text-base text-ink-black-500 transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        {user ? (
          <>
            <MenuItem>
              <Link
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300"
                to="/user-profile"
              >
                Profile
              </Link>
            </MenuItem>
            <MenuItem>
              <Link
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300"
                to="/create-recipe"
              >
                Create a recipe
              </Link>
            </MenuItem>
            <MenuItem>
              <button
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300"
                onClick={handleLogout}
              >
                Logout
              </button>
            </MenuItem>
            {logoutError && <ValidationError message={logoutError} />}
          </>
        ) : (
          // <div className="my-1 h-px bg-ink-black-300" />
          <>
            <MenuItem>
              <Link
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300"
                to="/login"
              >
                Login
              </Link>
            </MenuItem>
            <MenuItem>
              <Link
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-antique-parchment-300"
                to="/register"
              >
                Register
              </Link>
            </MenuItem>
          </>
        )}
      </MenuItems>
    </Menu>
  );
}
