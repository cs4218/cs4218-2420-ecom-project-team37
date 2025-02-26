import { expect, jest } from "@jest/globals";
import { registerController, updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from "./authController";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";
import { hashPassword } from "../helpers/authHelper";

jest.mock("../models/userModel.js", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
}));
jest.mock("../models/orderModel.js", () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock("../helpers/authHelper", () => ({
  hashPassword: jest.fn(),
}));

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
  });

  test("user model is not saved for invalid email", async () => {
    // specify mock functionality
    userModel.findOne.mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });
});

describe("Update Profile Controller Test", () => {
  let req, res, originalUser;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123"
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
      role: "0"
    }
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
      role: originalUser.role
    };

    userModel.findById.mockResolvedValue(originalUser);
    hashPassword.mockResolvedValue(newHashedPassword);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(req.user._id, {
      name: req.body.name,
      password: newHashedPassword,
      phone: req.body.phone,
      address: req.body.address,
    }, { new: true});
    expect(hashPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: expect.any(String), 
      updatedUser: updatedUser 
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
      role: originalUser.role
    }
    req.body.password = undefined;
    userModel.findById.mockResolvedValue(originalUser);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);
    
    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(req.user._id, {
      name: req.body.name,
      password: originalUser.password,
      phone: req.body.phone,
      address: req.body.address,
    }, { new: true});
    expect(hashPassword).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true, 
      message: expect.any(String), 
      updatedUser: updatedUser
    })
  })

  it("should not update name, phone, address if not provided", async () => {
    const newHashedPassword = "new-hashed-password";
    const updatedUser = {
      _id: originalUser._id,
      name: originalUser.name,
      email: originalUser.email,
      password: newHashedPassword,
      phone: originalUser.phone,
      address: originalUser.address,
      role: originalUser.role
    }
    req.body.name = undefined;
    req.body.phone = undefined;
    req.body.address = undefined;
    userModel.findById.mockResolvedValue(originalUser);
    hashPassword.mockResolvedValue(newHashedPassword);
    userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);
    
    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(req.user._id, {
      name: originalUser.name,
      password: newHashedPassword,
      phone: originalUser.phone,
      address: originalUser.address,
    }, { new: true});
    expect(hashPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true, 
      message: expect.any(String), 
      updatedUser: updatedUser
    })
  })


  it("should not update profile if password is less than 6 characters", async () => {
    req.body.password = "123";
    userModel.findById.mockResolvedValue(originalUser);
 
    await updateProfileController(req, res);

    expect(hashPassword).not.toHaveBeenCalled();
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false, 
      message: expect.any(String) 
    })
  })

  it("should return 400 error if name, password, address, phone is empty", async () => {
    req.body.name = "";
    req.body.password = "";
    req.body.address = "";
    req.body.phone = "";

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: expect.any(String)
    })
  })

  it("should return 404 error if no user found", async () => {
    userModel.findById.mockResolvedValue(null);

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false, 
      message: expect.any(String), 
    })
  })

  it("should return 500 error if something went wrong", async () => {
    const error = new Error("Something went wrong");
    userModel.findById.mockRejectedValue(error);

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false, 
      message: expect.any(String), 
      error: error
    })
  })
})


describe("Get Orders Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123"
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
          createdAt: new Date("2025-02-25T13:10:00Z")
        }
      ],
      payment: 100,
      buyer: "test",
      status: "Processing"
    };

    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockResolvedValue(mockOrder);
  
    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer
    });

    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({buyer: req.user._id});
    expect(mockPopulateProducts).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulateBuyer).toHaveBeenCalledWith("buyer", "name");
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  })


  it("should return error if something went wrong", async () => {
    const error = new Error("Something went wrong");
    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockRejectedValue(error);
    
    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer
    });

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false, 
      message: expect.any(String),
      error: error 
    })
  })
})

describe("Get All Orders Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123"
      },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };  
  });

  it('should return all orders successfully if exist', async () => {
    const mockOrders = {
      products: [ {
        name: "product2",
        createdAt: new Date("2025-02-25T13:10:00Z")
      }, {
        name: "product3",
        createdAt: new Date("2025-02-25T13:20:00Z")
      }, {
        name: "product1",
        createdAt: new Date("2025-02-25T13:30:00Z")
      },
    ],
      payment: 100,
      buyer: "test",
      status: "Processing"
    };

    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockReturnThis();
    const mockSort = jest.fn().mockResolvedValue(mockOrders);
    
    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer
    });
    mockPopulateBuyer.mockReturnValue({
      sort: mockSort
    });
    
    await getAllOrdersController(req, res);
    
    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(mockPopulateProducts).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulateBuyer).toHaveBeenCalledWith("buyer", "name");
    expect(mockSort).toHaveBeenCalledWith({ createdAt: "-1" });
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should return error if something went wrong", async () => {
    const error = new Error("Database error");
    const mockPopulateProducts = jest.fn().mockReturnThis();
    const mockPopulateBuyer = jest.fn().mockReturnThis();
    const mockSort = jest.fn().mockRejectedValue(error);
    
    orderModel.find.mockReturnValue({
      populate: mockPopulateProducts
    });
    mockPopulateProducts.mockReturnValue({
      populate: mockPopulateBuyer
    });
    mockPopulateBuyer.mockReturnValue({
      sort: mockSort
    });

    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false, 
      message: expect.any(String), 
      error: error 
    })
  });
})

describe("Order Status Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: "123"
      },
      params: {
        orderId: "123"
      },
      body: {
        status: "Processing"
      }
    }

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  it("should update order status successfully", async () => {
    const mockOrder = {
      products: [ 
        "productId1",
        "productId2"
      ],
      payment: 100,
      buyer: "userId1",
      status: "Processing"
    };

    orderModel.findByIdAndUpdate.mockResolvedValue(mockOrder);

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(req.params.orderId, { status: req.body.status }, { new: true });
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });

  it("should return error if something went wrong", async () => {
    const mockError = new Error('Database error');
    orderModel.findByIdAndUpdate.mockRejectedValue(mockError);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: expect.any(String),
      error: mockError,
    });
  });
})

