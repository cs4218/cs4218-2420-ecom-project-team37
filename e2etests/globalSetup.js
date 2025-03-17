import mongoose from "mongoose";
import dotenv from "dotenv";
import { hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

dotenv.config();

async function globalSetup() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    // Create users
    const testUsers = [
      {
        email: "test-user@example.com",
        name: "Test User",
        answer: "Volleyball",
        address: "Test Address",
        phone: "12345678",
        password: await hashPassword("test123"),
        role: 0,
      },
      {
        email: "test-admin@example.com",
        name: "Test Admin",
        answer: "Volleyball",
        address: "Test Address",
        phone: "12345678",
        password: await hashPassword("test123"),
        role: 1,
      },
    ];

    const createdUsers = await userModel.insertMany(testUsers);

    // Create categories
    const categories = await categoryModel.insertMany([
      { name: "TEST-Category One", slug: "test-category-one" },
      { name: "TEST-Category Two", slug: "test-category-two" },
    ]);

    // Create products
    const products = await productModel.insertMany([
      {
        name: "TEST-Product One",
        slug: "test-product-one",
        price: 100,
        quantity: 100,
        category: categories[0]._id,
        description: "Test Product One Description",
      },
      {
        name: "TEST-Product Two",
        slug: "test-product-two",
        price: 200,
        quantity: 100,
        category: categories[0]._id,
        description: "Test Product Two Description",
      },
    ]);


    console.log("Test data inserted.");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error in global setup:", error);
  }
}

export default globalSetup;
