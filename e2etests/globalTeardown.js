import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function globalTeardown() {
  try {
    await mongoose.connect(process.env.MONGO_URL.replace(/\/[^/]*$/, '/e2e_test'));
    await mongoose.connection.dropDatabase();
    console.log("Test database dropped.");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error in global teardown:", error);
    throw error;
  }
}

export default globalTeardown;
