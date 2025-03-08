import {
  createProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/productController.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import {
  brainTreeTokenController,
  brainTreePaymentController,
} from "./productController";

jest.mock("braintree", () => {
  const mockGenerate = jest.fn();
  const mockSale = jest.fn().mockResolvedValue({ success: true });
  const mockBraintreeGateway = jest.fn().mockImplementation(() => {
    return {
      clientToken: {
        generate: mockGenerate,
      },
      transaction: {
        sale: mockSale,
      },
    };
  });

  return {
    BraintreeGateway: mockBraintreeGateway,
    Environment: {
      Sandbox: "sandbox",
    },
  };
});
jest.mock("../models/productModel.js");
jest.mock("../models/orderModel");
jest.mock("slugify", () => jest.fn());
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

jest.spyOn(console, "log").mockImplementation(() => {});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createProductController", () => {
  it("should create a product successfully", async () => {
    const req = {
      fields: {
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: "Test Category",
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: "dummy/path/to/photo.jpg",
          size: 500000,
          type: "image/jpeg",
        },
      },
    };
    const res = mockResponse();

    slugify.mockReturnValue("test-product");

    fs.readFileSync.mockReturnValue("dummy image data");

    // Create a fake product instance
    const fakeSave = jest.fn().mockResolvedValue(true);
    const productInstance = { photo: {}, save: fakeSave };
    productModel.mockImplementation(() => productInstance);

    await createProductController(req, res);

    expect(productModel).toHaveBeenCalledWith({
      ...req.fields,
      slug: "test-product",
    });
    expect(fs.readFileSync).toHaveBeenCalledWith(req.files.photo.path);
    expect(fakeSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product created successfully",
      product: productInstance,
    });
  });

  it("should return error when fields are missing", async () => {
    const req = {
      fields: {
        // Missing name
        description: "Test description",
        price: 100,
        category: "Test Category",
        quantity: 10,
        shipping: true,
      },
      files: {},
    };
    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
  });

  it("should reject negative price", async () => {
    const req = {
      fields: {
        name: "Test Product",
        description: "Test description",
        price: -100,
        category: "Test Category",
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: "dummy/path.jpg",
          size: 500000,
          type: "image/jpeg",
        },
      },
    };
    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "Price must be positive",
    });
  });

  it("should reject negative quantity", async () => {
    const req = {
      fields: {
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: "Test Category",
        quantity: -10,
        shipping: true,
      },
      files: {
        photo: {
          path: "dummy/path.jpg",
          size: 500000,
          type: "image/jpeg",
        },
      },
    };
    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "Quantity must be more than zero",
    });
  });

  it("should reject large photo size", async () => {
    const req = {
      fields: {
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: "Test Category",
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: "dummy/path.jpg",
          size: 2000000,
          type: "image/jpeg",
        },
      },
    };
    const res = mockResponse();

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "Photo size must be less than 1MB.",
    });
  });
});

describe("updateProductController", () => {
  it("Update a product successfully with valid data", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        category: "Updated Category",
        quantity: 5,
        shipping: false,
      },
      files: {
        photo: {
          path: "dummy/path/to/newphoto.jpg",
          size: 500000,
          type: "image/jpeg",
        },
      },
    };
    const res = mockResponse();

    slugify.mockReturnValue("updated-product");
    fs.readFileSync.mockReturnValue("new dummy image data");

    const fakeSave = jest.fn().mockResolvedValue(true);
    const productInstance = { photo: {}, save: fakeSave };
    productModel.findByIdAndUpdate = jest
      .fn()
      .mockResolvedValue(productInstance);

    await updateProductController(req, res);

    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.params.pid,
      { ...req.fields, slug: "updated-product" },
      { new: true },
    );
    expect(fs.readFileSync).toHaveBeenCalledWith(req.files.photo.path);
    expect(fakeSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product updated successfully",
      product: productInstance,
    });
  });

  it("Return an error if the product is not found during update", async () => {
    const req = {
      params: { pid: "nonexistent" },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: 150,
        category: "Updated Category",
        quantity: 5,
        shipping: false,
      },
      files: {},
    };
    const res = mockResponse();

    slugify.mockReturnValue("updated-product");
    productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "Product not found" });
  });

  it("Return an error if a required field is missing for update", async () => {
    const req = {
      params: { pid: "123" },
      fields: {
        // Missing name
        description: "Updated description",
        price: 150,
        category: "Updated Category",
        quantity: 5,
        shipping: false,
      },
      files: {},
    };
    const res = mockResponse();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
  });
});

describe("deleteProductController", () => {
  it("Delete a product successfully when the product exists", async () => {
    const req = {
      params: { pid: "123" },
    };
    const res = mockResponse();

    productModel.findByIdAndDelete = jest
      .fn()
      .mockResolvedValue({ _id: "123" });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(req.params.pid);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product deleted successfully",
    });
  });

  it("Return error if product not found for deletion", async () => {
    const req = {
      params: { pid: "nonexistent" },
    };
    const res = mockResponse();

    productModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ error: "Product not found" });
  });
});

describe("brainTreeTokenController unit tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should generate and return a token if no errors", async () => {
    const mockTokenResponse = {
      clientToken: "mock-client-token",
    };

    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.clientToken.generate.mockImplementation((options, callback) => {
      callback(null, mockTokenResponse);
    });

    await brainTreeTokenController(req, res);

    expect(mockGateway.clientToken.generate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockTokenResponse);
  });

  it("should handle error when gateway client token throws error", async () => {
    const mockError = new Error("error");

    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.clientToken.generate.mockImplementation((options, callback) => {
      callback(mockError, null);
    });

    await brainTreeTokenController(req, res);

    expect(mockGateway.clientToken.generate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });

  it("should handle error if callback function has error", async () => {
    const mockError = new Error("error");
    const mockCallBack = jest.fn().mockImplementation(() => {
      throw mockError;
    });
    const mockTokenResponse = {
      clientToken: "mock-client-token",
    };

    const mockGateway = new braintree.BraintreeGateway();
    mockGateway.clientToken.generate.mockImplementation((options, callBack) => {
      mockCallBack(null, mockTokenResponse);
    });

    await brainTreeTokenController(req, res);

    expect(mockGateway.clientToken.generate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });
});

describe("brainTreePaymentController unit tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        nonce: "test-nonce",
        cart: [
          { name: "Product 1", price: 100 },
          { name: "Product 2", price: 200 },
        ],
      },
      user: {
        _id: "user123",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  it("should save order and return ok:true if no error", async () => {
    const mockResult = {
      success: true,
      transaction: {
        id: "transaction1",
        amount: "300.00",
      },
    };
    const mockGateway = new braintree.BraintreeGateway();

    mockGateway.transaction.sale.mockImplementation(
      (transactionDetails, callback) => {
        callback(null, mockResult);
      },
    );
    orderModel.prototype.save = jest.fn();

    await brainTreePaymentController(req, res);

    expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
      {
        amount: 300,
        paymentMethodNonce: "test-nonce",
        options: {
          submitForSettlement: true,
        },
      },
      expect.any(Function),
    );
    expect(orderModel).toHaveBeenCalledWith({
      products: req.body.cart,
      payment: mockResult,
      buyer: req.user._id,
    });
    expect(orderModel.prototype.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("should handle error when gateway transaction sale throws error", async () => {
    const mockError = new Error("error");
    const mockGateway = new braintree.BraintreeGateway();

    mockGateway.transaction.sale.mockImplementation(
      (transactionDetails, callback) => {
        callback(mockError, null);
      },
    );

    await brainTreePaymentController(req, res);

    expect(mockGateway.transaction.sale).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });

  it("should handle error if callback function has error", async () => {
    const mockError = new Error("error");
    const mockCallBack = jest.fn().mockImplementation(() => {
      throw mockError;
    });
    const mockResult = {
      success: true,
      transaction: {
        id: "transaction1",
        amount: "300.00",
      },
    };
    const mockGateway = new braintree.BraintreeGateway();

    mockGateway.transaction.sale.mockImplementation(
      (transactionDetails, callback) => {
        mockCallBack(null, mockResult);
      },
    );

    await brainTreePaymentController(req, res);

    expect(mockGateway.transaction.sale).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });
});
