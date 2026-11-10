// Generates a URL-friendly slug from the given text and ensures its uniqueness within the specified collection
export async function slugify(text, Collection) {
  let baseSlug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const existingSlug = await Collection.find({
    slug: new RegExp(`^${baseSlug}(-[0-9]+)?$`),
  }).distinct("slug");

  let slug = baseSlug;
  let counter = 1;

  while (existingSlug.includes(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
}
