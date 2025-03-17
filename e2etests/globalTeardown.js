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

    await userModel.deleteMany({ email: { $in: ["user@example.com", "admin@example.com"] } });
    await categoryModel.deleteMany({ 
      $or: [
        { slug: { $in: ["category-one", "category-two"] } },
        { name: /^TEST-/ }
      ],
    });
    await productModel.deleteMany({
      $or: [
        { slug: { $in: ["product-one", "product-two"] } }, 
        { name: /^TEST-/ }, 
      ],
    });
    await orderModel.deleteMany({});

    console.log("Test data removed.");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error in global teardown:", error);
  }
}

export default globalTeardown;
