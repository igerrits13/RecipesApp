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

function App() {
  return (
    <div className="p-4 sm:px-6 sm:py-4 lg:py-6 lg:px-12 mx-auto">
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

// sm	40rem (640px)	@media (width >= 40rem) { ... }
// md	48rem (768px)	@media (width >= 48rem) { ... }
// lg	64rem (1024px)	@media (width >= 64rem) { ... }
// xl	80rem (1280px)	@media (width >= 80rem) { ... }
// 2xl	96rem (1536px)	@media (width >= 96rem) { ... }
