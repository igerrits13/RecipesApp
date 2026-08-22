// Interface for user
export interface User {
  _id: string;
  username: string;
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
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}
