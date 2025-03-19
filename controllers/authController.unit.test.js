import { expect, jest } from "@jest/globals";
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
import { comparePassword, hashPassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";

jest.mock("../helpers/authHelper", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));
jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.spyOn(console, "log").mockImplementation(() => {});

describe("Register Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        name: "John Doe",
        email: "invalid-email",
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

    jest.clearAllMocks();
  });

  test("user model is not saved for invalid email", async () => {
    // specify mock functionality
    userModel.findOne.mockResolvedValue(null);

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("should return 400 if name is missing during registration", async () => {
    req.body.name = "";
    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is Required" });
  });

  test("should return 400 if email is missing during registration", async () => {
    req.body.email = "";
    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
  });

  test("should return 400 if password is missing during registration", async () => {
    req.body.password = "";
    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
  });

  test("should return 400 if phone number is missing during registration", async () => {
    req.body.phone = "";
    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
  });

  test("should return 400 if address is missing during registration", async () => {
    req.body.address = "";
    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
  });

  test("should return error if answer is missing during registration", async () => {
    req.body.answer = "";
    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
  });

  test("should return error if user already exists", async () => {
    const existingUser = {
      _id: "123",
    };

    // Make email valid first
    req.body.email = "test@example.com";
    userModel.findOne.mockResolvedValue(existingUser);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already registered please login",
    });
  });

  test("should successfully register a new user with valid fields", async () => {
    userModel.findOne.mockResolvedValue(null);
    // Make email valid first
    req.body.email = "john@example.com";
    userModel.prototype.save.mockResolvedValue({
      email: "john@example.com",
    });

    hashPassword.mockResolvedValue("hashedpassword");

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "User Register Successfully",
      user: expect.objectContaining({ email: "john@example.com" }),
    });
  });

  test("should return registration error when server has an error", async () => {
    // Make email valid first
    req.body.email = "john@example.com";
    // Mock a database error
    userModel.findOne.mockRejectedValue(new Error("Database error"));
    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in Registration",
      error: expect.any(Error),
    });
  });
});

describe("Login Controller Test", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 400 if email is missing", async () => {
    req.body.email = "";

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  test("should return 400 if password is missing", async () => {
    req.body.password = "";

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  test("should return 404 if email is not registered", async () => {
    userModel.findOne.mockResolvedValue(null);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registered",
    });
  });

  test("should return 401 with an error message if password does not match", async () => {
    userModel.findOne.mockResolvedValue({
      email: "test@example.com",
      password: "hashedpassword",
    });
    comparePassword.mockResolvedValue(false);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  test("should return 200 if password matches and login is successful", async () => {
    const mockUser = {
      _id: "123",
      name: "John Doe",
      email: "test@example.com",
      phone: "99999999",
      address: "Test Address",
      role: 0,
      password: "hashedpassword",
    };

    userModel.findOne.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(true);
    jest.spyOn(JWT, "sign").mockReturnValue("mockedToken");

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "login successfully",
      user: {
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        address: mockUser.address,
        role: mockUser.role,
      },
      token: "mockedToken",
    });
  });

  test("should return login error when server has an error", async () => {
    // Mock a database error
    userModel.findOne.mockRejectedValue(new Error("Database error"));

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in login",
      error: expect.any(Error),
    });
  });
});

describe("Forgot Password Controller Test", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: "test@example.com",
        answer: "sports",
        newPassword: "newPassword",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 400 if email is missing", async () => {
    req.body.email = "";

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
  });

  test("should return 400 if answer is missing", async () => {
    req.body.answer = "";

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Answer is required" });
  });

  test("should return 400 if new password is missing", async () => {
    req.body.newPassword = "";

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "New Password is required",
    });
  });

  test("should return 404 if user is not found (wrong email)", async () => {
    userModel.findOne.mockResolvedValue(null);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or answer",
    });
  });

  test("should return 400 if user is found but wrong answer", async () => {
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      answer: "correctAnswer",
    };

    userModel.findOne.mockResolvedValue(mockUser);
    req.body.answer = "wrongAnswer";

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or answer",
    });
  });

  test("should return 200 if password reset is successful", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      answer: "sports",
    };

    userModel.findOne.mockResolvedValue(mockUser);
    hashPassword.mockResolvedValue("hashedNewPassword");
    userModel.findByIdAndUpdate.mockResolvedValue({});

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(hashPassword).toHaveBeenCalledWith(req.body.newPassword);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, {
      password: "hashedNewPassword",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password Reset Successfully",
    });
  });
});

describe("Test Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("should return 'Protected Routes' on success", () => {
    testController(req, res);
    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });

  test("should return an error response if an exception occurs", () => {
    const error = new Error("Server Error");

    res.send
      .mockImplementationOnce(() => {
        throw error;
      })
      .mockReturnThis();
    testController(req, res);

    expect(res.send).toHaveBeenCalledWith({ error });
    expect(console.log).toHaveBeenCalledWith(error);
  });
});

describe("Update Profile Controller Test", () => {
  let req, res, originalUser;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123",
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

    originalUser = {
      _id: "123",
      name: "John Doe",
      email: "test@gmail.com",
      password: "original-hashed-password",
      phone: "23344000",
      address: "122 Street",
      role: "0",
    };
  });

  it("should update profile if password is valid and all fields are given", async () => {
    const newHashedPassword = "new-hashed-password";
    const updatedUser = {
      _id: originalUser._id,
      name: req.body.name,
      email: originalUser.email,
      password: newHashedPassword,
      phone: req.body.phone,
      address: req.body.address,
      role: originalUser.role,
    };

    userModel.findById.mockResolvedValue(originalUser);
    hashPassword.mockResolvedValue(newHashedPassword);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.user._id,
      {
        name: req.body.name,
        password: newHashedPassword,
        phone: req.body.phone,
        address: req.body.address,
      },
      { new: true },
    );
    expect(hashPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser: updatedUser,
    });
  });

  
  it("should update profile if password is 6 characters", async () => {
    req.body.password = "123456";
    const newHashedPassword = "new-hashed-password";
    const updatedUser = {
      _id: originalUser._id,
      name: req.body.name,
      email: originalUser.email,
      password: newHashedPassword,
      phone: req.body.phone,
      address: req.body.address,
      role: originalUser.role,
    };

    userModel.findById.mockResolvedValue(originalUser);
    hashPassword.mockResolvedValue(newHashedPassword);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.user._id,
      {
        name: req.body.name,
        password: newHashedPassword,
        phone: req.body.phone,
        address: req.body.address,
      },
      { new: true },
    );
    expect(hashPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser: updatedUser,
    });
  });

  it("should not update password if password is not provided", async () => {
    const updatedUser = {
      _id: originalUser._id,
      name: req.body.name,
      email: originalUser.email,
      password: originalUser.password,
      phone: req.body.phone,
      address: req.body.address,
      role: originalUser.role,
    };
    req.body.password = undefined;
    userModel.findById.mockResolvedValue(originalUser);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.user._id,
      {
        name: req.body.name,
        password: originalUser.password,
        phone: req.body.phone,
        address: req.body.address,
      },
      { new: true },
    );
    expect(hashPassword).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser: updatedUser,
    });
  });

  it("should not update name if not provided", async () => {
    const newHashedPassword = "new-hashed-password";
    const updatedUser = {
      _id: originalUser._id,
      name: originalUser.name,
      email: originalUser.email,
      password: newHashedPassword,
      phone: req.body.phone,
      address: req.body.address,
      role: originalUser.role,
    };
    req.body.name = undefined;
    userModel.findById.mockResolvedValue(originalUser);
    hashPassword.mockResolvedValue(newHashedPassword);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.user._id,
      {
        name: originalUser.name,
        password: newHashedPassword,
        phone: req.body.phone,
        address: req.body.address,
      },
      { new: true },
    );
    expect(hashPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser: updatedUser,
    });
  });

  it("should not update phone if not provided", async () => {
    const newHashedPassword = "new-hashed-password";
    const updatedUser = {
      _id: originalUser._id,
      name: req.body.name,
      email: originalUser.email,
      password: newHashedPassword,
      phone: originalUser.phone,
      address: req.body.address,
      role: originalUser.role,
    };
    req.body.phone = undefined;
    userModel.findById.mockResolvedValue(originalUser);
    hashPassword.mockResolvedValue(newHashedPassword);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.user._id,
      {
        name: req.body.name,
        password: newHashedPassword,
        phone: originalUser.phone,
        address: req.body.address,
      },
      { new: true },
    );
    expect(hashPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser: updatedUser,
    });
  });

  
  it("should not update address if not provided", async () => {
    const newHashedPassword = "new-hashed-password";
    const updatedUser = {
      _id: originalUser._id,
      name: req.body.name,
      email: originalUser.email,
      password: newHashedPassword,
      phone: originalUser.phone,
      address: originalUser.address,
      role: originalUser.role,
    };
    req.body.address = undefined;
    userModel.findById.mockResolvedValue(originalUser);
    hashPassword.mockResolvedValue(newHashedPassword);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.user._id,
      {
        name: req.body.name,
        password: newHashedPassword,
        phone: req.body.phone,
        address: originalUser.address,
      },
      { new: true },
    );
    expect(hashPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser: updatedUser,
    });
  });

  it("should not update profile if password is 2 characters", async () => {
    req.body.password = "12";
    userModel.findById.mockResolvedValue(originalUser);

    await updateProfileController(req, res);

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Password is required and at least 6 characters long",
    });
  });

  it("should not update profile if password is 5 characters", async () => {
    req.body.password = "12345";
    userModel.findById.mockResolvedValue(originalUser);

    await updateProfileController(req, res);

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Password is required and at least 6 characters long",
    });
  });

  it("should return 400 error if name, password, address, phone is empty", async () => {
    req.body.name = "";
    req.body.password = "";
    req.body.address = "";
    req.body.phone = "";

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "No fields to update",
    });
  });

  it("should return 404 error if no user found", async () => {
    userModel.findById.mockResolvedValue(null);

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "User not found",
    });
  });

  it("should return 500 error if something went wrong", async () => {
    const error = new Error("Something went wrong");
    userModel.findById.mockRejectedValue(error);

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Update Profile",
      error: error,
    });
  });
});

describe("Get Orders Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123",
      },
      body: {
        name: "John Doe",
        email: "test@gmail.com",
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

  it("should return orders for a user", async () => {
    const mockOrder = {
      products: [
        {
          name: "product2",
          createdAt: new Date("2025-02-25T13:10:00Z"),
        },
      ],
      payment: 100,
      buyer: "test",
      status: "Processing",
    };

    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockReturnThis();
    const mockLean = jest.fn().mockResolvedValue(mockOrder);
  
    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts,
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer,
    });
    mockPopulateBuyer.mockReturnValue({
      lean: mockLean,
    });

    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({ buyer: req.user._id });
    expect(mockPopulateProducts).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulateBuyer).toHaveBeenCalledWith("buyer", "name");
    expect(mockLean).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });

  it("should return error if something went wrong", async () => {
    const error = new Error("Something went wrong");
    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockReturnThis();
    const mockLean = jest.fn().mockRejectedValue(error)
    

    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts,
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer,
    });
    mockPopulateBuyer.mockReturnValue({
      lean: mockLean,
    });

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Getting Orders",
      error: error,
    });
  });
});

describe("Get All Orders Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  it("should return all orders successfully if exist", async () => {
    const mockOrders = {
      products: [
        {
          name: "product2",
          createdAt: new Date("2025-02-25T13:10:00Z"),
        },
        {
          name: "product3",
          createdAt: new Date("2025-02-25T13:20:00Z"),
        },
        {
          name: "product1",
          createdAt: new Date("2025-02-25T13:30:00Z"),
        },
      ],
      payment: 100,
      buyer: "test",
      status: "Processing",
    };

    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockReturnThis();
    const mockSort = jest.fn().mockReturnThis();
    const mockLean = jest.fn().mockResolvedValue(mockOrders);

    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts,
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer,
    });
    mockPopulateBuyer.mockReturnValue({
      sort: mockSort,
    });
    mockSort.mockReturnValue({
      lean: mockLean,
    })

    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(mockPopulateProducts).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulateBuyer).toHaveBeenCalledWith("buyer", "name");
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockLean).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should return error if something went wrong", async () => {
    const error = new Error("Database error");
    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockReturnThis();
    const mockSort = jest.fn().mockReturnThis();
    const mockLean = jest.fn().mockRejectedValue(error)
    
    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts,
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer,
    });
    mockPopulateBuyer.mockReturnValue({
      sort: mockSort,
    });
    mockSort.mockReturnValue({
      lean: mockLean,
    })

    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Getting Orders",
      error: error,
    });
  });
});

describe("Order Status Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123",
      },
      params: {
        orderId: "123",
      },
      body: {
        status: "Processing",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  it("should update order status successfully", async () => {
    const mockOrder = {
      products: ["productId1", "productId2"],
      payment: 100,
      buyer: "userId1",
      status: "Processing",
    };

    orderModel.findByIdAndUpdate.mockResolvedValue(mockOrder);

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.params.orderId,
      { status: req.body.status },
      { new: true },
    );
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });

  it("should return error if something went wrong", async () => {
    const mockError = new Error("Database error");
    orderModel.findByIdAndUpdate.mockRejectedValue(mockError);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Updating Order",
      error: mockError,
    });
  });
});
