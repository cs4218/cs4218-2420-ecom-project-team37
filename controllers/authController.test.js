import { expect, jest } from "@jest/globals";
import { registerController, updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from "./authController";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js", () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock("../helpers/authHelper");

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
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });
});

describe("Update Profile Controller Test", () => {
  let req, res, user;

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

    user = {
      _id: "123",
      name: "John Doe",
      email: "test@gmail.com",
      password: "original-hashed-password",
      phone: "23344000",
      address: "122 Street",
      role: "0"
    }
  });

  it("should not update password if password is not provided", async () => {
    req.body.password = undefined;
    userModel.findOne = jest.fn().mockResolvedValue(user);
    hashPassword = jest.fn().mockResolvedValue("hashed-password");
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);
    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(req.user._id, {
      name: req.body.name,
      password: user.password,
      phone: req.body.phone,
      address: req.body.address,
    }, { new: true});
  })

  it("should not update profile if password is less than 6 characters", async () => {
    req.body.password = "123";
    userModel.findOne = jest.fn().mockResolvedValue(user);
    hashPassword = jest.fn().mockResolvedValue("hashed-password");
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({error: expect.any(String)})
  })

  it("should update profile if password is valid", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(user);
    hashPassword = jest.fn().mockResolvedValue("hashed-password");
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);

    await updateProfileController(req, res);

    expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({success: true, message: expect.any(String), updatedUser: expect.any(Object) })
  })

  it("should return error if something went wrong", async () => {
    userModel.findById = jest.fn().mockRejectedValue(new Error("Something went wrong"));
    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({success: false, message: expect.any(String), error: expect.any(Object) })
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
    orderModel.find = jest.fn();
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
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  })


  it("should return error if something went wrong", async () => {
    const error = new Error("Something went wrong");
    orderModel.find = jest.fn().mockImplementation(() => {
      throw error;
    });

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({success: false, message: expect.any(String), error: error })
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
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should return error if something went wrong", async () => {
    const error = new Error("Database error");
    orderModel.find = jest.fn().mockImplementation(() => {
      throw error;
    });

    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({success: false, message: expect.any(String), error: error })
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
    orderModel.findByIdAndUpdate = jest.fn();  
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

