import mongoose from "mongoose";

// Create a connection to the MongoDB database
export const connectDB = async () => {
  try {
    // Determine the environment and corresponding database name
    const ENV = process.env.NODE_ENV || "development";

    const DB_BY_ENV = {
      test: "recipes_test",
      development: "recipes_dev",
      production: "recipes_prod",
    };

    const dbName = DB_BY_ENV[ENV] || "recipes_dev";

    const conn = await mongoose.connect(process.env.MONGO_URI, { dbName });
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};
