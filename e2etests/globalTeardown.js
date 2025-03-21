import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

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
