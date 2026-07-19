import User from "../../models/user.model.js";

const validRoles = ["user", "moderator", "admin"];

// Get all user's roles and ban, deletion and verified status with pagination and search query
export async function getAllUsersWithRoleStatus(page, limit, offset) {
  const totalUsers = await User.countDocuments();

  const users = await User.find()
    .select(
      "displayName email profileImage role isBanned isDeleted isEmailVerified",
    )
    .sort({ role: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    users,
    currentPage: page,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
  };
}

// Get all the soft deleted users with pagination and search query
export async function getAllDeletedUsers(page, limit, offset) {
  const totalDeletedUsers = await User.countDocuments({ isDeleted: true });

  const deletedUsers = await User.find({ isDeleted: true })
    .select(
      "displayName email profileImage role isBanned isDeleted isEmailVerified",
    )
    .sort({ role: 1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return {
    deletedUsers,
    currentPage: page,
    totalDeletedUsers,
    totalPages: Math.ceil(totalDeletedUsers / limit),
  };
}

// Get all required information for a specific user by id
export async function getUserDetailsById(userId) {
  const user = await User.findById(userId).select(
    "username displayName email profileImage profileBackgroundImage role previousDisplayName lastDisplayNameChange previousEmail lastEmailChange emailChangeCount lastLogin lastFailedLogin failedLoginAttempts isBanned isDeleted deletedAt isEmailVerified",
  );

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
}

// Update a users role by id
export async function updateUserRole(userId, newRole) {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!validRoles.includes(newRole.toLowerCase())) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  user.role = newRole.toLowerCase();
  await user.save();

  return user;
}

// Update the ban status of a user by id
export async function updateUserBanStatus(userId, isBanned) {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.isBanned = isBanned;
  await user.save();
}
