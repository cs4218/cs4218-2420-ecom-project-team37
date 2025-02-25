import { jest } from "@jest/globals";
import userModel from "../models/userModel";
import { registerController, loginController } from "./authController";
import { comparePassword, hashPassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";

jest.mock("../helpers/authHelper", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("../models/userModel.js");

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
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("should return error if name is missing during registration", async () => {
    req.body.name = "";
    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  test("should return error if email is missing during registration", async () => {
    req.body.email = "";
    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
  });

  test("should return error if password is missing during registration", async () => {
    req.body.password = "";
    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
  });

  test("should return error if phone number is missing during registration", async () => {
    req.body.phone = "";
    await registerController(req, res);
    expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
  });

  test("should return error if address is missing during registration", async () => {
    req.body.address = "";
    await registerController(req, res);
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
    userModel.findOne = jest.fn().mockResolvedValue(existingUser);

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
    userModel.prototype.save = jest.fn().mockResolvedValue({
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
    userModel.findOne = jest.fn().mockResolvedValue(null);

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
      message: "Invalid Password",
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
