import mongoose from "mongoose";
import { connectDB } from "../src/lib/db.js";
import "dotenv/config";

const clearDatabase = () => {
  return Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({}),
    ),
  );
};

beforeAll(async () => {
  // Wait for connection to be established
  await connectDB();
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await mongoose.connection.close();
}, 30000); // Increase timeout to 30 seconds for closing the connection
