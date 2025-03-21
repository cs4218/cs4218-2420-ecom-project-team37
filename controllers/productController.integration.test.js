import {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  updateProductController,
  deleteProductController,
  productCountController,
  searchProductController,
  productListController,
  productCategoryController,
  realtedProductController,
} from "./productController.js";
import mongoose, { Types } from "mongoose";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import {
  brainTreeTokenController,
  brainTreePaymentController,
} from "./productController.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "../config/db";
import request from "supertest";
import { app, server } from "../server.js";
import { hashPassword } from "../helpers/authHelper.js";
import dotenv from "dotenv";

dotenv.config();

jest.spyOn(console, "log").mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Braintree Token and Payment Integration Tests", () => {
  let mongoServer;
  let testUser;
  let product1, product2;
  let authToken;
  const password = "password";

  beforeAll(async () => {
    // Start up in memory db
    await mongoose.connection.close();
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await connectDB();

    const hash_password = await hashPassword(password);

    testUser = await userModel.create({
      name: "Test User",
      email: "testuser@gmail.com",
      password: hash_password,
      phone: "1234567890",
      address: "123 Test Street",
      answer: "Test Answer",
      role: "0",
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "testuser@gmail.com",
      password: password,
    });

    expect(loginRes.body).toBeDefined();
    expect(loginRes.body.token).toBeDefined();
    authToken = loginRes.body.token;

    // Create test products
    product1 = await productModel.create({
      name: "Test Product 1",
      slug: "test-product-1",
      description: "Sample product",
      price: 100,
      category: new Types.ObjectId(),
      quantity: 10,
      shipping: true,
    });

    product2 = await productModel.create({
      name: "Test Product 2",
      slug: "test-product-2",
      description: "Sample product",
      price: 50,
      category: new Types.ObjectId(),
      quantity: 5,
      shipping: false,
    });
  });

  afterAll(async () => {
    // drop db and close all connections
    server.close();
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await orderModel.deleteMany({});
  });

  it("should return a token from braintree", async () => {
    const response = await request(app).get(`/api/v1/product/braintree/token`);

    expect(response.status).toBe(200);
    expect(response.body.clientToken).toBeDefined();
  });

  it("should process a valid payment and create an order", async () => {
    const tokenRes = await request(app)
      .get("/api/v1/product/braintree/token")
      .set("Authorization", authToken);

    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.clientToken).toBeDefined();

    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", authToken)
      .send({
        nonce: "fake-valid-nonce",
        cart: [
          { _id: product1._id.toString(), price: 100 },
          { _id: product2._id.toString(), price: 50 },
        ],
      });

    expect(paymentRes.status).toBe(200);
    expect(paymentRes.body).toStrictEqual({ ok: true });

    // check new order saved
    const savedOrders = await orderModel.find({});
    expect(savedOrders.length).toBe(1);
    expect(savedOrders[0].buyer.toString()).toBe(testUser._id.toString());
    expect(savedOrders[0].products.length).toBe(2);
  });

  it("should fail if no nounce", async () => {
    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", authToken)
      .send({
        cart: [{ _id: product1._id.toString(), price: 100 }],
      });

    expect(paymentRes.status).toBe(400);
    expect(paymentRes.body.success).toBe(false);
    expect(paymentRes.body.message).toBe("Nounce is required");

    // Ensure no order was created
    const savedOrders = await orderModel.find({});
    expect(savedOrders.length).toBe(0);
  });

  it("should fail if nounce is empty string", async () => {
    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", authToken)
      .send({
        nonce: "",
        cart: [{ _id: product1._id.toString(), price: 100 }],
      });

    expect(paymentRes.status).toBe(400);
    expect(paymentRes.body.success).toBe(false);
    expect(paymentRes.body.message).toBe("Nounce is required");

    // check no order was created
    const savedOrders = await orderModel.find({});
    expect(savedOrders.length).toBe(0);
  });

  it("should fail if cart is empty", async () => {
    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", authToken)
      .send({
        nonce: "fake-valid-nonce",
        cart: [],
      });

    expect(paymentRes.status).toBe(400);
    expect(paymentRes.body.success).toBe(false);
    expect(paymentRes.body.message).toBe(
      "Cart is required and cannot be empty",
    );

    // check no order was created
    const savedOrders = await orderModel.find({});
    expect(savedOrders.length).toBe(0);
  });

  it("should fail if cart is missing from req", async () => {
    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", authToken)
      .send({
        nonce: "fake-valid-nonce",
      });

    expect(paymentRes.status).toBe(400);
    expect(paymentRes.body.success).toBe(false);
    expect(paymentRes.body.message).toBe(
      "Cart is required and cannot be empty",
    );

    // check no order was created
    const savedOrders = await orderModel.find({});
    expect(savedOrders.length).toBe(0);
  });
});
