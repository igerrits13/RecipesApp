// Helper function to sanitize user data before sending it in API responses
export function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    profileImage: user.profileImage,
    profileBackgroundImage: user.profileBackgroundImage,
    favoriteRecipes: user.favoriteRecipes,
    favoriteCuisines: user.favoriteCuisines,
    allergies: user.allergies,
    shoppingList: user.shoppingList,
    preferences: user.preferences,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Helper function to sanitize user data for public display
export function sanitizeUserForPublic(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    displayName: user.displayName,
    profileImage: user.profileImage,
    profileBackgroundImage: user.profileBackgroundImage,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}
