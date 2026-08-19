import { Routes, Route } from "react-router-dom";

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

function App() {
  // Check if there is an authenticated user
  const { authCheck } = useAuthStore();

  useEffect(() => {
    authCheck();
  }, []);

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/recipe" element={<RecipeView />} />
        <Route path="/create-recipe" element={<CreateRecipeView />} />
        <Route path="/user-profile" element={<UserProfileView />} />
        <Route path="/other-profile" element={<OtherProfileView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/index" element={<IndexView />} />
        <Route path="/search" element={<SearchView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </div>
  );
}

export default App;
