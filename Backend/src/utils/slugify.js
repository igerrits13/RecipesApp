// Generates a URL-friendly slug from the given text and ensures its uniqueness within the specified collection
export async function slugify(text, Collection) {
  let baseSlug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -

  const existingSlug = await Collection.find({
    slug: new RegExp(`^${baseSlug}(-[0-9]+)?$`),
  }).select("slug");

  const slug =
    existingSlug.length === 0 ? baseSlug : `${baseSlug}-${existingSlug.length}`;

  return slug;
}
