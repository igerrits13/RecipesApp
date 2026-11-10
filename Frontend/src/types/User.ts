// Interface for user
export interface User {
  _id: string;
  username: string;
  slug: string;
  displayName: string;
  email: string;
  profileImage: string;
  profileBackgroundImage: string;
  favoriteRecipes: string[];
  favoriteCuisines: string[];
  allergies: string[];
  shoppingList: string[];
  preferences: {
    measurementSystem: string; // Metric or Imperial
  };
  role: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}
