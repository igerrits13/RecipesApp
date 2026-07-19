// Backfill a given collection with new basic field data
export async function backfillCollectionData({
  collectionModel,
  newFieldName,
  defaultValue,
}) {
  if (!collectionModel) {
    const error = new Error("Invalid collection name");
    error.statusCode = 400;
    throw error;
  }

  // Remove invalid characters from field name and ensure it doesn't contain spaces
  if (
    newFieldName.includes("$") ||
    newFieldName.includes(".") ||
    newFieldName.includes(" ")
  ) {
    const error = new Error("Invalid field name");
    error.statusCode = 400;
    throw error;
  }

  await collectionModel.updateMany(
    { [newFieldName.trim()]: { $exists: false } },
    { $set: { [newFieldName.trim()]: defaultValue } },
  );
}
