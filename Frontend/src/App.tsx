import { Routes, Route, Navigate } from "react-router-dom";

import HomeView from "./pages/HomeView";
import RecipeView from "./pages/RecipeView";
import CreateRecipeView from "./pages/CreateRecipeView";
import UserProfileView from "./pages/UserProfileView";
import OtherProfileView from "./pages/OtherProfileView";
import RegisterView from "./pages/RegisterView";
import LoginView from "./pages/LoginView";
import IndexView from "./pages/IndexView";
import SearchView from "./pages/SearchView";
import AdminView from "./pages/AdminView";
import NotFoundView from "./pages/NotFoundView";
import { useAuthStore } from "./store/AuthStore";
import { useEffect } from "react";
import Loading from "./components/Loading";

function App() {
  // Check if there is an authenticated user
  const { user, authCheck, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    authCheck();
  }, [authCheck]);

  // If the authentication check is in progress, show a loading spinner
  if (isCheckingAuth) return <Loading />;

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/recipe/:recipeSlug" element={<RecipeView />} />
        <Route
          path="/create-recipe"
          element={!user ? <Navigate to="/login" /> : <CreateRecipeView />}
        />
        <Route path="/user-profile" element={<UserProfileView />} />
        <Route path="/other-profile/:username" element={<OtherProfileView />} />
        <Route
          path="/register"
          element={!user ? <RegisterView /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!user ? <LoginView /> : <Navigate to="/" />}
        />
        <Route path="/index" element={<IndexView />} />
        <Route path="/search" element={<SearchView />} />
        <Route
          path="/admin"
          element={
            user && (user.role === "moderator" || user.role === "admin") ? (
              <AdminView />
            ) : (
              <NotFoundView />
            )
          }
        />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </div>
  );
}

export default App;
