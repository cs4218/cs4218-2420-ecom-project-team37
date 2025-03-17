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
        email: "user@example.com",
        name: "User",
        answer: "Volleyball",
        address: "Test Address",
        phone: "12345678",
        password: await hashPassword("test123"),
        role: 0,
      },
      {
        email: "admin@example.com",
        name: "Admin",
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
      { name: "Category One", slug: "category-one" },
      { name: "Category Two", slug: "category-two" },
    ]);

    // Create products
    const products = await productModel.insertMany([
      {
        name: "Product One",
        slug: "product-one",
        price: 100,
        quantity: 100,
        category: categories[0]._id,
        description: "Product One Description",
      },
      {
        name: "Product Two",
        slug: "product-two",
        price: 200,
        quantity: 100,
        category: categories[0]._id,
        description: "Product Two Description",
      },
    ]);

    // Create an order
    await orderModel.insertMany([
      {
        buyer: createdUsers[0]._id,
        status: "Not Processed",
        payment: 100,
        products: [products[0]._id],
      },
    ]);

    console.log("Test data inserted.");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error in global setup:", error);
  }
}

export default globalSetup;
