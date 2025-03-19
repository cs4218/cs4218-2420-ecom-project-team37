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
  import mongoose,  { Types } from "mongoose";
  import userModel from "../models/userModel.js";
  import productModel from "../models/productModel.js";
  import categoryModel from "../models/categoryModel.js";
  import orderModel from "../models/orderModel.js";
  import fs from "fs";
  import { MongoMemoryServer } from "mongodb-memory-server";
  import request from "supertest";
  import { app, server } from '../server.js';
  import { hashPassword } from "../helpers/authHelper.js";
  import dotenv from "dotenv";
  
  dotenv.config();
  
  jest.spyOn(console, "log").mockImplementation(() => {});
  
  
  beforeEach(() => {
      jest.clearAllMocks();
  });
  
  describe("Product Controller and Braintree Integration Tests", () => {
      let mongoServer;
      let testUser;
      let product1, product2;
      let authToken;
      let categoryId;
      const password = "password";
      
      beforeAll(async () => {
          // Start up in memory db
          mongoServer = await MongoMemoryServer.create();
          process.env.MONGO_URL = mongoServer.getUri();
  
          const hash_password = await hashPassword(password);
  
          // Create test category
          categoryId = new Types.ObjectId();
          await categoryModel.create({ _id: categoryId, name: "Test Category" });
  
          // Create test user
          testUser = await userModel.create({
              name: "Test User",
              email: "testuser@gmail.com",
              password: hash_password,
              phone: "1234567890",
              address: "123 Test Street",
              answer: "Test Answer",
              role: "0"
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
              category: categoryId,
              quantity: 10,
              shipping: true,
          });
      
          product2 = await productModel.create({
              name: "Test Product 2",
              slug: "test-product-2",
              description: "Sample product",
              price: 50,
              category: categoryId,
              quantity: 5,
              shipping: false,
          });
      });
    
      afterAll(async () => {
          // drop db and close all connections
          await mongoose.connection.dropDatabase();
          await mongoose.connection.close();
          await mongoServer.stop();
        
          // Close the HTTP server to resolve PORT being used
          await new Promise((resolve, reject) =>
            server.close(err => (err ? reject(err) : resolve()))
          );
        });
        

  
      describe("Product Controller Tests", () => {
          beforeEach(async () => {
              // Clean up test products before each product test
              await productModel.deleteMany({
                  _id: { $nin: [product1._id, product2._id] }
              });
          });
   
          describe("Create Product Controller", () => {
              test("should create a new product successfully", async () => {
                  const req = {
                      fields: {
                          name: "New Test Product",
                          description: "Test description",
                          price: "100", 
                          category: categoryId.toString(),
                          quantity: "10",
                          shipping: "true",
                      },
                      files: {
                          photo: {
                              path: "test/path", 
                              name: "test.jpg",
                              size: 50000,
                              type: "image/jpeg",
                              lastModifiedDate: new Date(),
                          }
                      }
                  };
  
                  const mockPhotoBuffer = Buffer.from("mock image data");
                  jest.spyOn(fs, "readFileSync").mockReturnValue(mockPhotoBuffer);
  
                  const res = {
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
  
                  await createProductController(req, res);
  
                  expect(res.status).toHaveBeenCalledWith(201);
                  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                      success: true,
                      message: "Product created successfully",
                  }));
  
                  const product = await productModel.findOne({ name: "New Test Product" });
                  expect(product).not.toBeNull();
                  expect(product.price).toBe(100);
                  expect(product.quantity).toBe(10);
              });
  
              test("should return error if required fields are missing", async () => {
                  const req = {
                      fields: { name: "Incomplete Product" }, 
                      files: {}
                  };
  
                  const res = {
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
  
                  await createProductController(req, res);
  
                  expect(res.status).toHaveBeenCalledWith(400);
                  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                      error: expect.any(String),
                  }));
              });
          });
  
          describe("Get All Products Controller", () => {
              test("should retrieve all products", async () => {
                  const req = {};
                  const res = {
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
                  
                  await getProductController(req, res);
  
                  expect(res.status).toHaveBeenCalledWith(200);
                  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                      success: true,
                      products: expect.any(Array),
                  }));
              });
          });
  
          describe("Get Single Product Controller", () => {
              test("should retrieve a single product", async () => {
                  const req = { params: { slug: "test-product-1" } };
                  const res = {
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
                  
                  await getSingleProductController(req, res);
  
                  expect(res.status).toHaveBeenCalledWith(200);
                  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                      success: true,
                      product: expect.any(Object),
                  }));
              });
          });
  
          describe("Product Photo Controller", () => {
              test("should return product photo", async () => {
                  const mockPhotoBuffer = Buffer.from("mock image data");
                  await productModel.findByIdAndUpdate(product1._id, {
                      photo: {
                          data: mockPhotoBuffer, 
                          contentType: "image/jpeg",
                      }
                  });
  
                  const req = { params: { pid: product1._id.toString() } };
                  const res = {
                      set: jest.fn(),
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
                  
                  await productPhotoController(req, res);
                  
                  expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
                  expect(res.status).toHaveBeenCalledWith(200);
                  expect(res.send).toHaveBeenCalled();
              });
          });
  
          describe("Delete Product Controller", () => {
              test("should delete a product", async () => {
                  const productToDelete = await productModel.create({
                      name: "Product To Delete",
                      description: "Will be deleted",
                      price: 100,
                      category: categoryId,
                      quantity: 10,
                      shipping: true,
                      slug: "product-to-delete",
                  });
  
                  const req = { params: { pid: productToDelete._id.toString() } };
                  const res = {
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
                  
                  await deleteProductController(req, res);
  
                  expect(res.status).toHaveBeenCalledWith(200);
                  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                      success: true,
                      message: "Product deleted successfully",
                  }));
  
                  const deletedProduct = await productModel.findById(productToDelete._id);
                  expect(deletedProduct).toBeNull();
              });
  
              test("should return error if product does not exist", async () => {
                  const nonExistentId = new Types.ObjectId().toString();
                  const req = { params: { pid: nonExistentId } };
                  const res = {
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
                  
                  await deleteProductController(req, res);
  
                  expect(res.status).toHaveBeenCalledWith(404);
                  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                      error: "Product not found",
                  }));
              });
          });
  
          describe("Update Product Controller", () => {
              test("should update a product successfully", async () => {
                  const req = {
                      params: { pid: product1._id.toString() },
                      fields: {
                          name: "Updated Product",
                          description: "Updated description",
                          price: "200",
                          category: categoryId.toString(),
                          quantity: "20",
                          shipping: "false",
                      },
                      files: {} 
                  };
  
                  const res = {
                      status: jest.fn().mockReturnThis(),
                      send: jest.fn(),
                  };
                  
                  await updateProductController(req, res);
  
                  expect(res.status).toHaveBeenCalledWith(200);
                  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                      success: true,
                      message: "Product updated successfully",
                  }));
  
                  const updatedProduct = await productModel.findById(product1._id);
                  expect(updatedProduct.name).toBe("Updated Product");
                  expect(updatedProduct.price).toBe(200);
              });
          });
      });
  
      describe("Braintree Token and Payment Integration Tests", () => {
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
              expect(paymentRes.body).toStrictEqual({ok: true});
          
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
              expect(paymentRes.body.message).toBe("Cart is required and cannot be empty");
  
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
              expect(paymentRes.body.message).toBe("Cart is required and cannot be empty");
  
              // check no order was created
              const savedOrders = await orderModel.find({});
              expect(savedOrders.length).toBe(0);
          });
      });
  });