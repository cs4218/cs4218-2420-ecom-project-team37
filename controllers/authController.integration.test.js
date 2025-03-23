import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "./authController";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";
import productModel from "../models/productModel";
import { comparePassword, hashPassword } from "../helpers/authHelper";
import connectDB from "../config/db";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

require("dotenv").config();
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(userModel, "findByIdAndUpdate");

describe("authController integration tests", () => {
  let mongoServer;

  beforeAll(async () => {
    // start in memory db
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await connectDB();
  });

  afterAll(async () => {
    // drop db and close all connections
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("Register controller", () => {
    let req, res;

    beforeEach(async () => {
      req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          phone: "12344000",
          address: "123 Street",
          answer: "Football",
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    afterEach(async () => {
      // clear all collections before each test
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      jest.clearAllMocks();
    });

    test("should successfully register a new user with valid fields", async () => {
      const hashedPassword = await hashPassword(req.body.password);
      req.body.password = hashedPassword;

      await registerController(req, res);

      const user = await userModel.findOne({ email: req.body.email });

      const responseData = res.send.mock.calls[0][0];

      expect(user).not.toBeNull();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("User Register Successfully");
      expect(responseData.user.name).toBe(req.body.name);
      expect(responseData.user.email).toBe(req.body.email);
      expect(responseData.user.phone).toBe(req.body.phone);
      expect(responseData.user.address).toBe(req.body.address);
      expect(responseData.user.answer).toBe(req.body.answer);
      const isPasswordValid = await comparePassword(
        req.body.password,
        responseData.user.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    test("should not create user if email is missing", async () => {
      delete req.body.email;

      await registerController(req, res);

      const user = await userModel.findOne({ name: req.body.name });

      const responseData = res.send.mock.calls[0][0];

      expect(user).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(responseData.message).toBe("Email is Required");
    });

    test("should not create user if name is missing", async () => {
      delete req.body.name;

      await registerController(req, res);

      const user = await userModel.findOne({ email: req.body.email });

      const responseData = res.send.mock.calls[0][0];

      expect(user).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(responseData.message).toBe("Name is Required");
    });

    test("should not create user if password is missing", async () => {
      delete req.body.password;

      await registerController(req, res);

      const user = await userModel.findOne({ email: req.body.email });

      const responseData = res.send.mock.calls[0][0];

      expect(user).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(responseData.message).toBe("Password is Required");
    });

    test("should not create user if phone number is missing", async () => {
      delete req.body.phone;

      await registerController(req, res);

      const user = await userModel.findOne({ email: req.body.email });

      const responseData = res.send.mock.calls[0][0];

      expect(user).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(responseData.message).toBe("Phone no is Required");
    });

    test("should not create user if address is missing", async () => {
      delete req.body.address;

      await registerController(req, res);

      const user = await userModel.findOne({ email: req.body.email });

      const responseData = res.send.mock.calls[0][0];

      expect(user).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(responseData.message).toBe("Address is Required");
    });

    test("should not create user if answer is missing", async () => {
      delete req.body.answer;

      await registerController(req, res);

      const user = await userModel.findOne({ email: req.body.email });

      const responseData = res.send.mock.calls[0][0];

      expect(user).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(responseData.message).toBe("Answer is Required");
    });

    test("should not create user if user already exists", async () => {
      const hashedPassword = await hashPassword("password123");
      await userModel.create({
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      });

      await registerController(req, res);

      const users = await userModel.find({ email: "john@example.com" });
      const responseData = res.send.mock.calls[0][0];

      expect(users.length).toBe(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Already registered please login");
    });
  });

  describe("Login controller", () => {
    let req, res;
    let user;
    let originalPassword;

    beforeEach(async () => {
      originalPassword = "testpassword";
      const hashedPassword = await hashPassword(originalPassword);

      user = new userModel({
        _id: new mongoose.Types.ObjectId(),
        name: "testuser",
        email: "testuser@gmail.com",
        password: hashedPassword,
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });
      await user.save();

      req = {
        body: {
          email: "testuser@gmail.com",
          password: "testpassword",
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    afterEach(async () => {
      // clear all collections before each test
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      jest.clearAllMocks();
    });

    test("should login successfully with correct credentials", async () => {
      await loginController(req, res);
      const responseData = res.send.mock.calls[0][0];
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("login successfully");
      expect(responseData.user.name).toBe(user.name);
      expect(responseData.user.email).toBe(user.email);
      expect(responseData.user.phone).toBe(user.phone);
      expect(responseData.user.address).toBe(user.address);
    });

    test("should fail if email is missing", async () => {
      req.body.email = "";
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    test("should fail if password is missing", async () => {
      req.body.password = "";
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    test("should return 404 if email is not registered", async () => {
      req.body.email = "notregistered@example.com";
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registered",
      });
    });

    test("should return 401 if passwords do not match", async () => {
      req.body.password = "wrongpassword";
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });
  });

  describe("Forgot password controller", () => {
    let req, res;
    let user;
    let originalPassword;

    beforeEach(async () => {
      originalPassword = "testpassword";
      const hashedPassword = await hashPassword(originalPassword);

      user = new userModel({
        _id: new mongoose.Types.ObjectId(),
        name: "testuser",
        email: "testuser@gmail.com",
        password: hashedPassword,
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });
      await user.save();

      req = {
        body: {
          email: "testuser@gmail.com",
          answer: "test answer",
          newPassword: "newPassword",
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    afterEach(async () => {
      // clear all collections before each test
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      jest.clearAllMocks();
    });

    test("all fields are correct and password successfully resetted", async () => {
      await forgotPasswordController(req, res);
      const updatedUser = await userModel.findById(user._id);
      const isPasswordUpdated = await comparePassword(
        req.body.newPassword,
        updatedUser.password,
      );
      expect(isPasswordUpdated).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });

    test("email provided does not exist", async () => {
      req.body.email = "wrongemail@example.com";
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or answer",
      });
    });

    test("answer provided is incorrect", async () => {
      req.body.answer = "wrong answer";
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or answer",
      });
    });
  });

  // Bypass middleware and mock req, res
  describe("Update profile controller", () => {
    let req, res;
    let originalUser;
    let originalPassword;

    beforeEach(async () => {
      originalPassword = "testpassword";

      const hashedPassword = await hashPassword(originalPassword);
      originalUser = userModel({
        _id: new Types.ObjectId(),
        name: "testuser",
        email: "testuser@gmail.com",
        password: hashedPassword,
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });
      // insert original user
      await originalUser.save();

      // update user
      req = {
        user: {
          _id: originalUser._id,
        },
        body: {
          name: "John Doe",
          password: "password123",
          phone: "12344000",
          address: "123 Street",
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    afterEach(async () => {
      // clear all collections before each test
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      jest.clearAllMocks();
    });

    it("Should update profile if password is valid and all fields are given", async () => {
      const expectedUpdatedUser = {
        _id: originalUser._id,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        email: originalUser.email,
        role: originalUser.role,
        answer: originalUser.answer,
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Profile Updated Successfully");
      expect(responseData.updatedUser.name).toBe(expectedUpdatedUser.name);
      expect(responseData.updatedUser.phone).toBe(expectedUpdatedUser.phone);
      expect(responseData.updatedUser.address).toBe(
        expectedUpdatedUser.address,
      );
      expect(responseData.updatedUser.email).toBe(expectedUpdatedUser.email);
      expect(responseData.updatedUser.role).toBe(expectedUpdatedUser.role);
      expect(responseData.updatedUser.answer).toBe(expectedUpdatedUser.answer);

      // Check password is updated
      const isPasswordValid = await comparePassword(
        req.body.password,
        responseData.updatedUser.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it("Should update profile if password is 6 characters", async () => {
      req.body.password = "123456";
      const expectedUpdatedUser = {
        _id: originalUser._id,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        email: originalUser.email,
        role: originalUser.role,
        answer: originalUser.answer,
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Profile Updated Successfully");
      expect(responseData.updatedUser.name).toBe(expectedUpdatedUser.name);
      expect(responseData.updatedUser.phone).toBe(expectedUpdatedUser.phone);
      expect(responseData.updatedUser.address).toBe(
        expectedUpdatedUser.address,
      );
      expect(responseData.updatedUser.email).toBe(expectedUpdatedUser.email);
      expect(responseData.updatedUser.role).toBe(expectedUpdatedUser.role);
      expect(responseData.updatedUser.answer).toBe(expectedUpdatedUser.answer);

      // Check password is updated
      const isPasswordValid = await comparePassword(
        req.body.password,
        responseData.updatedUser.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it("Should not update password if password is not provided", async () => {
      req.body.password = undefined;
      const expectedUpdatedUser = {
        _id: originalUser._id,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        email: originalUser.email,
        role: originalUser.role,
        answer: originalUser.answer,
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Profile Updated Successfully");
      expect(responseData.updatedUser.name).toBe(expectedUpdatedUser.name);
      expect(responseData.updatedUser.phone).toBe(expectedUpdatedUser.phone);
      expect(responseData.updatedUser.address).toBe(
        expectedUpdatedUser.address,
      );
      expect(responseData.updatedUser.email).toBe(expectedUpdatedUser.email);
      expect(responseData.updatedUser.role).toBe(expectedUpdatedUser.role);
      expect(responseData.updatedUser.answer).toBe(expectedUpdatedUser.answer);

      // Check password is the same as old password
      const isPasswordValid = await comparePassword(
        originalPassword,
        responseData.updatedUser.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it("Should not update name if not provided", async () => {
      req.body.name = undefined;
      const expectedUpdatedUser = {
        _id: originalUser._id,
        name: originalUser.name,
        phone: req.body.phone,
        address: req.body.address,
        email: originalUser.email,
        role: originalUser.role,
        answer: originalUser.answer,
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Profile Updated Successfully");
      expect(responseData.updatedUser.name).toBe(expectedUpdatedUser.name);
      expect(responseData.updatedUser.phone).toBe(expectedUpdatedUser.phone);
      expect(responseData.updatedUser.address).toBe(
        expectedUpdatedUser.address,
      );
      expect(responseData.updatedUser.email).toBe(expectedUpdatedUser.email);
      expect(responseData.updatedUser.role).toBe(expectedUpdatedUser.role);
      expect(responseData.updatedUser.answer).toBe(expectedUpdatedUser.answer);

      // Check password is updated
      const isPasswordValid = await comparePassword(
        req.body.password,
        responseData.updatedUser.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it("Should not update phone if not provided", async () => {
      req.body.phone = undefined;
      const expectedUpdatedUser = {
        _id: originalUser._id,
        name: req.body.name,
        phone: originalUser.phone,
        address: req.body.address,
        email: originalUser.email,
        role: originalUser.role,
        answer: originalUser.answer,
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Profile Updated Successfully");
      expect(responseData.updatedUser.name).toBe(expectedUpdatedUser.name);
      expect(responseData.updatedUser.phone).toBe(expectedUpdatedUser.phone);
      expect(responseData.updatedUser.address).toBe(
        expectedUpdatedUser.address,
      );
      expect(responseData.updatedUser.email).toBe(expectedUpdatedUser.email);
      expect(responseData.updatedUser.role).toBe(expectedUpdatedUser.role);
      expect(responseData.updatedUser.answer).toBe(expectedUpdatedUser.answer);

      // Check password is updated
      const isPasswordValid = await comparePassword(
        req.body.password,
        responseData.updatedUser.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it("Should not update address if not provided", async () => {
      req.body.address = undefined;
      const expectedUpdatedUser = {
        _id: originalUser._id,
        name: req.body.name,
        phone: req.body.phone,
        address: originalUser.address,
        email: originalUser.email,
        role: originalUser.role,
        answer: originalUser.answer,
      };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Profile Updated Successfully");
      expect(responseData.updatedUser.name).toBe(expectedUpdatedUser.name);
      expect(responseData.updatedUser.phone).toBe(expectedUpdatedUser.phone);
      expect(responseData.updatedUser.address).toBe(
        expectedUpdatedUser.address,
      );
      expect(responseData.updatedUser.email).toBe(expectedUpdatedUser.email);
      expect(responseData.updatedUser.role).toBe(expectedUpdatedUser.role);
      expect(responseData.updatedUser.answer).toBe(expectedUpdatedUser.answer);

      // Check password is updated
      const isPasswordValid = await comparePassword(
        req.body.password,
        responseData.updatedUser.password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it("Should not update profile if password is 2 character", async () => {
      req.body.password = "12";

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe(
        "Password is required and at least 6 characters long",
      );
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("Should not update profile if password is 5 character", async () => {
      req.body.password = "12345";

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe(
        "Password is required and at least 6 characters long",
      );
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("Should return 400 error if name, password, address, phone is empty", async () => {
      req.body.name = "";
      req.body.phone = "";
      req.body.address = "";
      req.body.password = "";

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("No fields to update");
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("Should return 404 error if user not found", async () => {
      // fake user id
      req.user._id = new Types.ObjectId();

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("User not found");
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("Should return 500 error if something went wrong", async () => {
      req.user = undefined;

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      const responseData = res.send.mock.calls[0][0];
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe("Error While Update Profile");
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("getOrdersController integration tests", () => {
    let user1, user2, user3, product1, product2, order1, order2, order3;
    let req, res;

    beforeEach(async () => {
      jest.clearAllMocks();
      user1 = await userModel.create({
        _id: new Types.ObjectId(),
        name: "testuser",
        email: "testuser@gmail.com",
        password: await hashPassword("testpassword"),
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });

      user2 = await userModel.create({
        _id: new Types.ObjectId(),
        name: "testuser2",
        email: "testuser2@gmail.com",
        password: await hashPassword("testpassword"),
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });

      user3 = await userModel.create({
        _id: new Types.ObjectId(),
        name: "testuser3",
        email: "testuser3@gmail.com",
        password: await hashPassword("testpassword"),
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });

      product1 = await productModel.create({
        _id: new Types.ObjectId(),
        name: "Test Product 1",
        slug: "test-product-1",
        description: "A test product 1",
        price: 100,
        category: new Types.ObjectId(), // categories not needed for test, can assume it exist
        quantity: 10,
        photo: {
          data: Buffer.from("fakeimage", "utf-8"), // photo won't be used in test
          contentType: "image/png",
        },
        shipping: true,
      });

      product2 = await productModel.create({
        _id: new Types.ObjectId(),
        name: "Test Product 2",
        slug: "test-product-2",
        description: "A test product 2",
        price: 200,
        category: new Types.ObjectId(),
        quantity: 5,
        photo: {
          data: Buffer.from("fakeimage", "utf-8"), // photo won't be used in test
          contentType: "image/png",
        },
        shipping: false,
      });

      order1 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product1._id, product2._id],
        payment: product1.price + product2.price,
        buyer: user1._id,
        status: "Not Processed",
      });

      order2 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product1._id],
        payment: product1.price,
        buyer: user1._id,
        status: "Processing",
      });

      order3 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product2._id],
        payment: product2.price,
        buyer: user2._id,
        status: "Processing",
      });

      req = {
        user: {
          _id: user1._id,
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    afterEach(async () => {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      jest.clearAllMocks();
    });

    it("Should return all orders for user1 with all products and buyer populated correctly", async () => {
      req.user._id = user1._id;

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders.length).toBe(2);

      const firstOrder = returnedOrders[0];
      expect(firstOrder._id.toString()).toBe(order1._id.toString());

      expect(firstOrder.buyer).toBeDefined();
      expect(firstOrder.buyer.name).toBe(user1.name);
      expect(Object.keys(firstOrder.buyer).length).toBe(2);

      expect(firstOrder.products).toHaveLength(2);
      expect(firstOrder.products[0]._id.toString()).toBe(
        product1._id.toString(),
      );
      expect(firstOrder.products[1]._id.toString()).toBe(
        product2._id.toString(),
      );
      expect(firstOrder.products[0].photo).toBeUndefined();
      expect(firstOrder.products[1].photo).toBeUndefined();

      const secondOrder = returnedOrders[1];
      expect(secondOrder._id.toString()).toBe(order2._id.toString());

      expect(secondOrder.buyer).toBeDefined();
      expect(secondOrder.buyer.name).toBe(user1.name);
      expect(Object.keys(secondOrder.buyer).length).toBe(2);

      expect(secondOrder.products).toHaveLength(1);
      expect(secondOrder.products[0]._id.toString()).toBe(
        product1._id.toString(),
      );
      expect(firstOrder.products[1].photo).toBeUndefined();
    });

    it("Should return all orders for user2 with all products and buyer populated correctly", async () => {
      req.user._id = user2._id;

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders.length).toBe(1);

      const firstOrder = returnedOrders[0];
      expect(firstOrder._id.toString()).toBe(order3._id.toString());

      expect(firstOrder.buyer).toBeDefined();
      expect(firstOrder.buyer.name).toBe(user2.name);
      expect(Object.keys(firstOrder.buyer).length).toBe(2);

      expect(firstOrder.products).toHaveLength(1);
      expect(firstOrder.products[0]._id.toString()).toBe(
        product2._id.toString(),
      );
      expect(firstOrder.products[0].photo).toBeUndefined();
    });

    it("should return no orders if user does not have order", async () => {
      req.user._id = user3._id;

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders.length).toBe(0);
    });

    it("should handle invalid user ID", async () => {
      req.user._id = "invalid_id";

      await getOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: expect.any(Error),
      });
    });
  });

  describe("getAllOrdersController integration tests", () => {
    let user1, user2, product1, product2, order1, order2, order3;
    let req, res;

    beforeEach(async () => {
      jest.clearAllMocks();
      user1 = await userModel.create({
        _id: new Types.ObjectId(),
        name: "testuser",
        email: "testuser@gmail.com",
        password: await hashPassword("testpassword"),
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });

      user2 = await userModel.create({
        _id: new Types.ObjectId(),
        name: "testuser2",
        email: "testuser2@gmail.com",
        password: await hashPassword("testpassword"),
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });

      product1 = await productModel.create({
        _id: new Types.ObjectId(),
        name: "Test Product 1",
        slug: "test-product-1",
        description: "A test product 1",
        price: 100,
        category: new Types.ObjectId(), // categories not needed for test, can assume it exist
        quantity: 10,
        photo: {
          data: Buffer.from("fakeimage", "utf-8"), // photo won't be used in test
          contentType: "image/png",
        },
        shipping: true,
      });

      product2 = await productModel.create({
        _id: new Types.ObjectId(),
        name: "Test Product 2",
        slug: "test-product-2",
        description: "A test product 2",
        price: 200,
        category: new Types.ObjectId(),
        quantity: 5,
        photo: {
          data: Buffer.from("fakeimage", "utf-8"), // photo won't be used in test
          contentType: "image/png",
        },
        shipping: false,
      });

      order1 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product1._id, product2._id],
        payment: product1.price + product2.price,
        buyer: user1._id,
        status: "Not Processed",
        createdAt: new Date(Date.now() + 300),
      });

      order2 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product1._id],
        payment: product1.price,
        buyer: user1._id,
        status: "Processing",
        createdAt: new Date(Date.now() + 4000),
      });

      order3 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product2._id],
        payment: product2.price,
        buyer: user2._id,
        status: "Processing",
        createdAt: new Date(Date.now() + 8000),
      });

      req = {};

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    afterEach(async () => {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      jest.clearAllMocks();
    });

    it("get all orders sorted by time", async () => {
      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders.length).toBe(3);

      // Check the order of orders
      const firstOrder = returnedOrders[0];
      expect(firstOrder._id.toString()).toBe(order3._id.toString());

      const secondOrder = returnedOrders[1];
      expect(secondOrder._id.toString()).toBe(order2._id.toString());

      const thirdOrder = returnedOrders[2];
      expect(thirdOrder._id.toString()).toBe(order1._id.toString());

      // ensure time is sorted
      expect(new Date(firstOrder.createdAt).getTime()).toBeGreaterThan(
        new Date(secondOrder.createdAt).getTime(),
      );
      expect(new Date(secondOrder.createdAt).getTime()).toBeGreaterThan(
        new Date(thirdOrder.createdAt).getTime(),
      );
    });

    it("check if products and buyers are populated correctly", async () => {
      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders.length).toBe(3);

      const firstOrder = returnedOrders[0];
      expect(firstOrder.buyer).toBeDefined();
      expect(firstOrder.buyer.name).toBe(user2.name);
      expect(Object.keys(firstOrder.buyer).length).toBe(2);

      const firstOrderProducts = firstOrder.products;
      expect(firstOrderProducts).toHaveLength(1);
      expect(firstOrderProducts[0]._id.toString()).toBe(
        product2._id.toString(),
      );
      expect(firstOrderProducts[0].photo).toBeUndefined();

      const secondOrder = returnedOrders[1];
      expect(secondOrder.buyer).toBeDefined();
      expect(secondOrder.buyer.name).toBe(user1.name);
      expect(Object.keys(secondOrder.buyer).length).toBe(2);

      const secondOrderProducts = secondOrder.products;
      expect(secondOrderProducts).toHaveLength(1);
      expect(secondOrderProducts[0]._id.toString()).toBe(
        product1._id.toString(),
      );
      expect(secondOrderProducts[0].photo).toBeUndefined();

      const thirdOrder = returnedOrders[2];
      expect(thirdOrder.buyer).toBeDefined();
      expect(thirdOrder.buyer.name).toBe(user1.name);
      expect(Object.keys(thirdOrder.buyer).length).toBe(2);

      const thirdOrderProducts = thirdOrder.products;
      expect(thirdOrderProducts).toHaveLength(2);
      expect(thirdOrderProducts[0]._id.toString()).toBe(
        product1._id.toString(),
      );
      expect(thirdOrderProducts[1]._id.toString()).toBe(
        product2._id.toString(),
      );
      expect(thirdOrderProducts[0].photo).toBeUndefined();
      expect(thirdOrderProducts[1].photo).toBeUndefined();
    });

    it("return empty array if no orders", async () => {
      await orderModel.deleteMany({});
      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrders = res.json.mock.calls[0][0];
      expect(returnedOrders.length).toBe(0);
    });
  });

  describe("orderStatuscontroller integration tests", () => {
    let user1, user2, product1, product2, order1, order2, order3;
    let req, res;

    beforeEach(async () => {
      jest.clearAllMocks();
      user1 = await userModel.create({
        _id: new Types.ObjectId(),
        name: "testuser",
        email: "testuser@gmail.com",
        password: await hashPassword("testpassword"),
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });

      user2 = await userModel.create({
        _id: new Types.ObjectId(),
        name: "testuser2",
        email: "testuser2@gmail.com",
        password: await hashPassword("testpassword"),
        phone: "123456789",
        address: "test address",
        answer: "test answer",
        role: 0,
      });

      product1 = await productModel.create({
        _id: new Types.ObjectId(),
        name: "Test Product 1",
        slug: "test-product-1",
        description: "A test product 1",
        price: 100,
        category: new Types.ObjectId(), // categories not needed for test, can assume it exist
        quantity: 10,
        photo: {
          data: Buffer.from("fakeimage", "utf-8"), // photo won't be used in test
          contentType: "image/png",
        },
        shipping: true,
      });

      product2 = await productModel.create({
        _id: new Types.ObjectId(),
        name: "Test Product 2",
        slug: "test-product-2",
        description: "A test product 2",
        price: 200,
        category: new Types.ObjectId(),
        quantity: 5,
        photo: {
          data: Buffer.from("fakeimage", "utf-8"), // photo won't be used in test
          contentType: "image/png",
        },
        shipping: false,
      });

      order1 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product1._id, product2._id],
        payment: product1.price + product2.price,
        buyer: user1._id,
        status: "Not Processed",
      });

      order2 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product1._id],
        payment: product1.price,
        buyer: user1._id,
        status: "Processing",
      });

      order3 = await orderModel.create({
        _id: new Types.ObjectId(),
        products: [product2._id],
        payment: product2.price,
        buyer: user2._id,
        status: "Processing",
      });

      req = {
        params: {
          orderId: order1._id,
        },
        body: {
          status: "Shipped",
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    afterEach(async () => {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      jest.clearAllMocks();
    });

    it("update existing order status to shipped", async () => {
      req.params.orderId = order1._id;
      req.body.status = "Shipped";

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrder = res.json.mock.calls[0][0];
      expect(returnedOrder._id.toString()).toBe(order1._id.toString());
      expect(returnedOrder.status).toBe(req.body.status);
    });

    it("update existing order to same status", async () => {
      req.params.orderId = order1._id;
      req.body.status = order1.status;

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedOrder = res.json.mock.calls[0][0];
      expect(returnedOrder._id.toString()).toBe(order1._id.toString());
      expect(returnedOrder.status).toBe(req.body.status);
    });

    it("verify database was actually updated", async () => {
      req.params.orderId = order1._id;
      req.body.status = "Delivered";

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalled();
      const updatedOrder = await orderModel.findById(order1._id);
      expect(updatedOrder.status).toBe("Delivered");
    });

    it("return 404 if order not found", async () => {
      req.params.orderId = new Types.ObjectId();

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order not found",
      });
    });

    it("should handle invalid objectId format", async () => {
      req.params.orderId = "invalid_id";
      req.body.status = "Shipped";

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Order",
        error: expect.any(Error),
      });
    });

    it("should handle missing orderId in req", async () => {
      req.params = {};

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order Id and Status is required",
      });
    });

    it("should handle error when update with missing status", async () => {
      req.params.orderId = order1._id;
      req.body = {};

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order Id and Status is required",
      });
    });

    it("invalid status in req", async () => {
      req.params.orderId = order1._id;
      req.body.status = "invalidStatus";

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Status",
      });
    });

    it("should preserve other order fields when updating status", async () => {
      req.params.orderId = order1._id;
      req.body.status = "Shipped";

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalled();

      const returnedOrder = res.json.mock.calls[0][0];
      expect(returnedOrder.buyer.toString()).toBe(order1.buyer.toString());
      expect(returnedOrder.payment).toBe(order1.payment);

      expect(returnedOrder.products.length).toBe(order1.products.length);
      returnedOrder.products.forEach((product, index) => {
        expect(product.toString()).toBe(order1.products[index].toString());
      });
    });
  });
});
