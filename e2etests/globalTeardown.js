import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

dotenv.config();

async function globalTeardown() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    await userModel.deleteMany({ email: { $in: ["test-user@example.com", "test-admin@example.com"] } });
    await categoryModel.deleteMany({ name: /^TEST-/ });
    await productModel.deleteMany({ name: /^TEST-/ });

    console.log("Test data removed.");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error in global teardown:", error);
  }
}

export default globalTeardown;
