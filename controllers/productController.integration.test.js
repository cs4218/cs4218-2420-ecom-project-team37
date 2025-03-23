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
  brainTreeTokenController,
  brainTreePaymentController,
} from "./productController.js";
import mongoose, { Types } from "mongoose";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
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

describe("Product Controller Integration Tests", () => {
  let mongoServer;
  let testCategory;
  let adminUser;
  let adminAuthToken;
  const password = "testpassword123";
  const testImageBuffer = Buffer.from("fake-image-data");

  beforeAll(async () => {
    // Start up in memory db
    await mongoose.connection.close();
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await connectDB();

    // Create admin user
    const hash_password = await hashPassword(password);
    adminUser = await userModel.create({
      name: "Admin User",
      email: "admin@test.com",
      password: hash_password,
      phone: "1234567890",
      address: "123 Admin Street",
      answer: "Test Answer",
      role: 1,
    });

    // Login to get admin token
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@test.com",
      password: password,
    });

    adminAuthToken = loginRes.body.token;

    // Create test category
    testCategory = await categoryModel.create({
      name: "Test Category",
      slug: "test-category",
    });
  });

  afterAll(async () => {
    server.close();
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await productModel.deleteMany({});
  });

  describe("Create Product Controller", () => {
    it("should create a product successfully with valid data", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        price: "99.99",
        category: testCategory._id.toString(),
        quantity: "10",
        shipping: "true",
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Product created successfully",
      );
      expect(response.body.product).toMatchObject({
        name: productData.name,
        description: productData.description,
        price: Number(productData.price),
      });
    });

    it("should fail to create product with missing required fields", async () => {
      const invalidData = {
        // missing name
        description: "Test Description",
        price: "99.99",
        category: testCategory._id.toString(),
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Name is required");
    });

    it("should fail to create product with duplicate name", async () => {
      const productData = {
        name: "Unique Product",
        description: "Test Description",
        price: "99.99",
        category: testCategory._id.toString(),
        quantity: "10",
        shipping: "true",
      };

      // Create first product
      await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Product with this name already exists",
      );
    });
  });

  describe("Create Product Controller - Field Validation", () => {
    it("should return error if category is missing", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        price: "100",
        quantity: "10",
        shipping: "true",
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Category is required");
    });

    it("should return error if quantity is missing", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        price: "100",
        category: testCategory._id.toString(),
        shipping: "true",
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Quantity is required");
    });

    it("should return error if description is missing", async () => {
      const productData = {
        name: "Test Product",
        price: "100",
        category: testCategory._id.toString(),
        quantity: "10",
        shipping: "true",
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Description is required");
    });

    it("should return error if price is missing", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        category: testCategory._id.toString(),
        quantity: "10",
        shipping: "true",
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Price is required");
    });

    it("should return error if shipping option is undefined", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        price: "100",
        category: testCategory._id.toString(),
        quantity: "10",
        // Shipping is omitted
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData)
        .attach("photo", testImageBuffer, "test-image.jpg");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Shipping option is required");
    });

    it("should return error if photo is missing", async () => {
      const productData = {
        name: "Test Product",
        description: "Test Description",
        price: "100",
        category: testCategory._id.toString(),
        quantity: "10",
        shipping: "true",
      };

      const response = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminAuthToken)
        .field(productData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Photo is required");
    });
  });

  describe("Get All Products Controller", () => {
    beforeEach(async () => {
      await productModel.create([
        {
          name: "Product 1",
          slug: "product-1",
          description: "Description 1",
          price: 100,
          category: testCategory._id,
          quantity: 10,
          shipping: true,
          createdAt: new Date("2024-01-01"),
        },
        {
          name: "Product 2",
          slug: "product-2",
          description: "Description 2",
          price: 200,
          category: testCategory._id,
          quantity: 20,
          shipping: false,
          createdAt: new Date("2024-01-02"),
        },
      ]);
    });

    it("should return all products successfully", async () => {
      const response = await request(app).get("/api/v1/product/get-product");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.products).toHaveLength(2);

      const productNames = response.body.products.map((p) => p.name).sort();
      expect(productNames).toEqual(["Product 1", "Product 2"].sort());
    });

    it("should return products without photo data", async () => {
      const response = await request(app).get("/api/v1/product/get-product");

      expect(response.status).toBe(200);
      expect(response.body.products[0]).not.toHaveProperty("photo");
    });
  });

  describe("Get Single Product Controller", () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await productModel.create({
        name: "Single Test Product",
        slug: "single-test-product",
        description: "Test Description",
        price: 150,
        category: testCategory._id,
        quantity: 15,
        shipping: true,
      });
    });

    it("should return a single product by slug", async () => {
      const response = await request(app).get(
        `/api/v1/product/get-product/${testProduct.slug}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Single Product Fetched");
      expect(response.body.product).toMatchObject({
        name: testProduct.name,
        slug: testProduct.slug,
        price: testProduct.price,
      });
    });

    it("should handle non-existent product slug", async () => {
      const response = await request(app).get(
        "/api/v1/product/get-product/non-existent-slug",
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Product not found");
    });
  });

  describe("Delete Product Controller", () => {
    let testProduct;
    let regularUserToken;

    beforeEach(async () => {
      testProduct = await productModel.create({
        name: "Product To Delete",
        slug: "product-to-delete",
        description: "Test Description",
        price: 150,
        category: testCategory._id,
        quantity: 15,
        shipping: true,
      });

      const regularUser = await userModel.create({
        name: "Regular User",
        email: "regular@test.com",
        password: await hashPassword(password),
        phone: "1234567890",
        address: "123 Test St",
        answer: "Test Answer",
        role: 0,
      });

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "regular@test.com",
        password: password,
      });

      regularUserToken = loginRes.body.token;
    });

    it("should delete product with admin authorization", async () => {
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set("Authorization", `Bearer ${adminAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Product deleted successfully",
      );

      const deletedProduct = await productModel.findById(testProduct._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe("Update Product Controller", () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await productModel.create({
        name: "Original Product",
        slug: "original-product",
        description: "Original Description",
        price: 100,
        category: testCategory._id,
        quantity: 10,
        shipping: true,
      });
    });

    it("should update a product successfully", async () => {
      const updateData = {
        name: "Updated Product",
        description: "Updated Description",
        price: "150",
        category: testCategory._id.toString(),
        quantity: "15",
        shipping: "false",
      };

      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData)
        .attach("photo", testImageBuffer, "updated-image.jpg");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Product updated successfully",
      );
      expect(response.body.product).toMatchObject({
        name: updateData.name,
        description: updateData.description,
        price: Number(updateData.price),
        quantity: Number(updateData.quantity),
      });

      const updatedProduct = await productModel.findById(testProduct._id);
      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(Number(updateData.price));
    });

    it("should prevent update with duplicate product name", async () => {
      await productModel.create({
        name: "Existing Product",
        slug: "existing-product",
        description: "Another product",
        price: 200,
        category: testCategory._id,
        quantity: 20,
        shipping: true,
      });

      const updateData = {
        name: "Existing Product",
        description: "Updated Description",
        price: "150",
        category: testCategory._id.toString(),
        quantity: "15",
        shipping: "false",
      };

      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Another product with this name already exists",
      );
    });

    it("should return 404 when updating non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        name: "Updated Product",
        description: "Updated Description",
        price: "150",
        category: testCategory._id.toString(),
        quantity: "15",
        shipping: "false",
      };

      const response = await request(app)
        .put(`/api/v1/product/update-product/${fakeId}`)
        .set("Authorization", adminAuthToken)
        .field(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Product not found");
    });
  });

  describe("Update Product Controller - Field Validations", () => {
    let testProduct;
  
    beforeEach(async () => {
      testProduct = await productModel.create({
        name: "Original Product",
        slug: "original-product",
        description: "Original Description",
        price: 100,
        category: testCategory._id,
        quantity: 10,
        shipping: true,
      });
    });
  
    it("should return error if description is missing", async () => {
      const updateData = {
        name: "Updated Product",
        // description omitted
        price: "150",
        category: testCategory._id.toString(),
        quantity: "15",
        shipping: "false",
      };
  
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData);
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Description is required");
    });
  
    it("should return error if price is missing", async () => {
      const updateData = {
        name: "Updated Product",
        description: "Updated Description",
        // price omitted
        category: testCategory._id.toString(),
        quantity: "15",
        shipping: "false",
      };
  
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData);
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Price is required");
    });
  
    it("should return error if category is missing", async () => {
      const updateData = {
        name: "Updated Product",
        description: "Updated Description",
        price: "150",
        // category omitted
        quantity: "15",
        shipping: "false",
      };
  
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData);
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Category is required");
    });
  
    it("should return error if quantity is missing", async () => {
      const updateData = {
        name: "Updated Product",
        description: "Updated Description",
        price: "150",
        category: testCategory._id.toString(),
        // quantity omitted
        shipping: "false",
      };
  
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData);
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Quantity is required");
    });
  
    it("should return error if shipping option is undefined", async () => {
      const updateData = {
        name: "Updated Product",
        description: "Updated Description",
        price: "150",
        category: testCategory._id.toString(),
        quantity: "15",
        // shipping omitted on purpose
      };
  
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData);
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Shipping option is required");
    });
  
    it("should return error if photo size exceeds 1MB", async () => {
      const updateData = {
        name: "Updated Product",
        description: "Updated Description",
        price: "150",
        category: testCategory._id.toString(),
        quantity: "15",
        shipping: "false",
      };
  
      // Create a fake file buffer larger than 1MB
      const largeBuffer = Buffer.alloc(1000001); // 1,000,001 bytes
  
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set("Authorization", adminAuthToken)
        .field(updateData)
        .attach("photo", largeBuffer, "large-image.jpg");
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Photo is required and should be less than 1MB"
      );
    });
  });

  describe("Product Count Controller", () => {
    beforeEach(async () => {
      await productModel.create([
        {
          name: "Product 1",
          slug: "product-1",
          description: "Description 1",
          price: 100,
          category: testCategory._id,
          quantity: 10,
          shipping: true,
        },
        {
          name: "Product 2",
          slug: "product-2",
          description: "Description 2",
          price: 200,
          category: testCategory._id,
          quantity: 20,
          shipping: false,
        },
        {
          name: "Product 3",
          slug: "product-3",
          description: "Description 3",
          price: 300,
          category: testCategory._id,
          quantity: 30,
          shipping: true,
        },
      ]);
    });

    it("should return correct total product count", async () => {
      const response = await request(app).get("/api/v1/product/product-count");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("total", 3);
    });

    it("should return zero when no products exist", async () => {
      // Delete all products first
      await productModel.deleteMany({});

      const response = await request(app).get("/api/v1/product/product-count");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("total", 0);
    });

    it("should handle database errors gracefully", async () => {
      await mongoose.connection.close();

      const response = await request(app).get("/api/v1/product/product-count");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Error in product count");

      await connectDB();
    });
  });
});
