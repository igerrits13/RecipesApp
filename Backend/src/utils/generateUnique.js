const NAME_CONFIG = {
  user: {
    limit: 32,
    prefix: "deleted_",
  },
  recipe: {
    limit: 100,
    prefix: "[Deleted] ",
  },
};

// Generate a unique name for a deleted user by appending the last 6 characters of the user ID while keeping under the specified limit
export async function generateUniqueDeletedName(baseName, userId, type) {
  const prefix = NAME_CONFIG[type]?.prefix || "deleted_";
  const suffix = `_${userId.toString().slice(-6)}`;

  const limit = NAME_CONFIG[type]?.limit || 32;

  const maxBaseLength = Math.max(0, limit - suffix.length - prefix.length);
  const truncatedBaseName = baseName.slice(0, maxBaseLength);

  return `${prefix}${truncatedBaseName}${suffix}`;
}

// Generate a unique email for a deleted user by appending the last 6 characters of the user ID
export async function generateUniqueDeletedEmail(baseEmail, userId) {
  const prefix = "deleted.";
  const suffix = `.${userId.toString().slice(-6)}`;

  return `${prefix}${baseEmail}${suffix}`;
}
