import { jest } from "@jest/globals";
import userModel from "../models/userModel";
import { registerController, loginController, forgotPasswordController, testController } from "./authController";
import { comparePassword, hashPassword } from "../helpers/authHelper";
import JWT from "jsonwebtoken";

jest.mock("../helpers/authHelper", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("../models/userModel.js");

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
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

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
    expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
  });

  test("should return 404 if user is not found (wrong email)", async () => {
    userModel.findOne.mockResolvedValue(null);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registered",
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
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Incorrect security answer",
    });
  });
  

  test("should return 200 if password reset is successful", async () => {
    const mockUser = { _id: "123", email: "test@example.com", answer: "sports" };
  
    userModel.findOne.mockResolvedValue(mockUser);
    hashPassword.mockResolvedValue("hashedNewPassword"); 
    userModel.findByIdAndUpdate.mockResolvedValue({});
  
    await forgotPasswordController(req, res);
  
    expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(hashPassword).toHaveBeenCalledWith(req.body.newPassword);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUser._id, { password: "hashedNewPassword" });
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
    const failingController = () => {
      throw error;
    };

    try {
      failingController();
    } catch (e) {
      res.send({ error: e });
    }
    expect(res.send).toHaveBeenCalledWith({ error });
  });
});
