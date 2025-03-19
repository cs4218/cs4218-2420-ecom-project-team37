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
import mongoose from "mongoose";
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
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel");
jest.mock("slugify", () => jest.fn());
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

jest.spyOn(console, "log").mockImplementation(() => {});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn();
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

describe("getProductController", () => {
  it("should retrieve all products successfully", async () => {
    const req = {};
    const res = mockResponse();

    const mockProducts = [
      {
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
      },
    ];
    const findMock = jest.fn().mockReturnThis(); // This will return 'this' so that we can chain methods
    const populateMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockResolvedValue(mockProducts); // Finally resolve the products

    // Mock the model's find method to return an object with all the chainable methods
    productModel.find = findMock.mockReturnValue({
      populate: populateMock,
      select: selectMock,
      limit: limitMock,
      sort: sortMock,
    });

    await getProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      counTotal: mockProducts.length,
      message: "ALlProducts ",
      products: mockProducts,
    });
  });

  it("should return 500 if an error occurs during retrieval", async () => {
    const req = {};
    const res = mockResponse();

    // Mock findOne to throw an error
    const findMock = jest.fn().mockImplementation(() => {
      throw new Error("Database Error");
    });

    productModel.find = findMock;

    await getProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting products",
      error: expect.any(String),
    });
  });
});

describe("getSingleProductController", () => {
  it("should retrieve requested product successfully", async () => {
    const req = { params: { slug: "novel" } };
    const res = mockResponse();

    const mockProducts = [
      {
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
      },
    ];
    const findOneMock = jest.fn().mockReturnThis(); // This will return 'this' so that we can chain methods
    const selectMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue(mockProducts);

    // Mock the model's find method to return an object with all the chainable methods
    productModel.findOne = findOneMock.mockReturnValue({
      select: selectMock,
      populate: populateMock,
    });

    await getSingleProductController(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ slug: "novel" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: mockProducts,
    });
  });

  it("should return 500 if an error occurs during retrieval", async () => {
    const req = { params: { slug: "novel" } };
    const res = mockResponse();

    // Mock findOne to throw an error
    const findOneMock = jest.fn().mockImplementation(() => {
      throw new Error("Database Error");
    });

    productModel.findOne = findOneMock;

    await getSingleProductController(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ slug: "novel" });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting single product",
      error: expect.any(Error),
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

    productModel.findById = jest.fn().mockResolvedValue({
      _id: "123",
      name: "Old Product Name",
    });

    productModel.findOne = jest.fn().mockResolvedValue(null);

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

describe("productPhotoController", () => {
  it("should retrieve the product photo successfully", async () => {
    const req = { params: { pid: "12345" } };
    const res = mockResponse();

    // Select photo details only
    const mockProduct = {
      photo: {
        data: Buffer.from("mock-image-data"),
        contentType: "image/jpeg",
      },
    };

    // Mock findById method to return mockProduct
    const findByIdMock = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct)
    });
    productModel.findById = findByIdMock;

    await productPhotoController(req, res);

    expect(findByIdMock).toHaveBeenCalledWith("12345");
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
  });
});

describe("productFiltersController", () => {
  it("should filter products successfully", async () => {
    const req = {
      body: {
        checked: [],
        radio: [100, 200],
      }
    };
    const res = mockResponse();

    const mockProducts = [
      {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 150,
          category: "Test Category",
          quantity: 10,
          shipping: true,
        },
      },
      {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 250,
          category: "Test Category",
          quantity: 10,
          shipping: true,
        },
      },
    ];

    const findMock = jest.fn().mockResolvedValue(mockProducts);
    productModel.find = findMock;

    await productFiltersController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      price: { $gte: 100, $lte: 200 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should return 500 if an error occurs during filtering", async () => {
    const req = {
      body: {
        checked: [],
        radio: [100, 200],
      }
    };
    const res = mockResponse();

    // Mock findOne to throw an error
    const findMock = jest.fn().mockImplementation(() => {
      throw new Error("Database Error");
    });

    productModel.find = findMock;

    await productFiltersController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      price: { $gte: 100, $lte: 200 },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Filtering Products",
      error: expect.any(Error),
    });
  });
});

describe("productListCOntroller", () => {
  it("should retrieve all products per page successfully", async () => {
    const req = { params: { page: 1 } };
    const res = mockResponse();

    const mockProducts = [
      {
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
      },
    ];
    const findMock = jest.fn().mockReturnThis(); // This will return 'this' so that we can chain methods
    const selectMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockResolvedValue(mockProducts); // Finally resolve the products

    // Mock the model's find method to return an object with all the chainable methods
    productModel.find = findMock.mockReturnValue({
      select: selectMock,
      skip: skipMock,
      limit: limitMock,
      sort: sortMock,
    });

    await productListController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should return 500 if an error occurs during retrieval", async () => {
    const req = { params: { page: 1 } };
    const res = mockResponse();

    // Mock findOne to throw an error
    const findMock = jest.fn().mockImplementation(() => {
      throw new Error("Database Error");
    });

    productModel.find = findMock;

    await productListController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error in per page ctrl",
      error: expect.any(Error),
    });
  });
});

describe("searchProductController", () => {
  const mockProducts = [
    {
      _id: "64b8f1a1e4b0a1a2b3c4d5e6",
      name: "Test Product 1",
      description: "This is a test product",
      price: 100,
      category: "64b8f1a1e4b0a1a2b3c4d5e6",
      quantity: 10,
      shipping: true,
    },
    {
      _id: "64b8f1a1e4b0a1a2b3c4d5e7",
      name: "Another Product",
      description: "This is another product",
      price: 200,
      category: "64b8f1a1e4b0a1a2b3c4d5e7",
      quantity: 5,
      shipping: false,
    },
    {
      _id: "64b8f1a1e4b0a1a2b3c4d5e8",
      name: "Test Product 2",
      description: "This is also a test product",
      price: 150,
      category: "64b8f1a1e4b0a1a2b3c4d5e6",
      quantity: 8,
      shipping: true,
    },
  ];

  it("should search products by keyword successfully and return matching products", async () => {
    const req = {
      params: {
        keyword: "test", // Mock keyword
      },
    };
    const res = mockResponse();

    // Mock the find method to return search results
    const findMock = jest.fn().mockImplementation((query) => {
      // Simulate MongoDB's $regex and $options: "i" functionality
      const keyword = req.params.keyword;
      const regex = new RegExp(keyword, "i");
      const filteredProducts = mockProducts.filter(
        (product) =>
          regex.test(product.name) || regex.test(product.description),
      );
      return {
        select: jest.fn().mockResolvedValue(filteredProducts),
      };
    });

    productModel.find = findMock;

    await searchProductController(req, res);

    // Verify the find method was called with the correct arguments
    expect(findMock).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "test", $options: "i" } },
        { description: { $regex: "test", $options: "i" } },
      ],
    });

    // Verify the response
    expect(res.json).toHaveBeenCalledWith([
      {
        _id: "64b8f1a1e4b0a1a2b3c4d5e6",
        name: "Test Product 1",
        description: "This is a test product",
        price: 100,
        category: "64b8f1a1e4b0a1a2b3c4d5e6",
        quantity: 10,
        shipping: true,
      },
      {
        _id: "64b8f1a1e4b0a1a2b3c4d5e8",
        name: "Test Product 2",
        description: "This is also a test product",
        price: 150,
        category: "64b8f1a1e4b0a1a2b3c4d5e6",
        quantity: 8,
        shipping: true,
      },
    ]);
  });

  it("should return an empty array if no products match the keyword", async () => {
    const req = {
      params: {
        keyword: "nonexistent", // Mock keyword that doesn't match any product
      },
    };
    const res = mockResponse();

    // Mock the find method to return an empty array
    const findMock = jest.fn().mockImplementation((query) => {
      // Simulate MongoDB's $regex and $options: "i" functionality
      const keyword = req.params.keyword;
      const regex = new RegExp(keyword, "i");
      const filteredProducts = mockProducts.filter(
        (product) =>
          regex.test(product.name) || regex.test(product.description),
      );
      return {
        select: jest.fn().mockResolvedValue(filteredProducts),
      };
    });

    productModel.find = findMock;

    await searchProductController(req, res);

    // Verify the find method was called with the correct arguments
    expect(findMock).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "nonexistent", $options: "i" } },
        { description: { $regex: "nonexistent", $options: "i" } },
      ],
    });

    // Verify the response
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("should return 400 if an error occurs during search", async () => {
    const req = {
      params: {
        keyword: "test", // Mock keyword
      },
    };
    const res = mockResponse();

    // Mock the find method to throw an error
    const findMock = jest.fn().mockImplementation(() => {
      throw new Error("Database Error");
    });
    productModel.find = findMock;

    await searchProductController(req, res);

    // Verify the find method was called with the correct arguments
    expect(findMock).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "test", $options: "i" } },
        { description: { $regex: "test", $options: "i" } },
      ],
    });

    // Verify the error response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error In Search Product API",
      error: expect.any(Error),
    });
  });
});

describe("realtedProductController", () => {
  it("should retrieve all related products successfully", async () => {
    const pid = new mongoose.Types.ObjectId().toHexString(); // Mock product ID
    const cid = new mongoose.Types.ObjectId().toHexString(); // Mock category ID as ObjectId
    const pidtest1 = new mongoose.Types.ObjectId().toHexString();
    const pidtest2 = new mongoose.Types.ObjectId().toHexString();

    const req = { params: { pid, cid } };
    const res = mockResponse();

    const mockProducts = [
      {
        _id: pidtest1,
        name: "Test Novel",
        slug: "slug",
        description: "Test description",
        price: 100,
        category: {
          _id: cid,
          name: "name",
          slug: "slug",
        },
        quantity: 10,
        shipping: true,
      },
      {
        _id: pidtest2,
        name: "Test Novel",
        slug: "slug",
        description: "Test description",
        price: 100,
        category: {
          _id: new mongoose.Types.ObjectId().toHexString(),
          name: "name",
          slug: "slug",
        },
        quantity: 10,
        shipping: true,
      },
    ];
    const findMock = jest.fn().mockReturnThis(); // This will return 'this' so that we can chain methods
    const selectMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest
      .fn()
      .mockResolvedValue(
        mockProducts.filter((product) => product.category._id === cid),
      );

    // Mock the model's find method to return an object with all the chainable methods
    productModel.find = findMock.mockReturnValue({
      select: selectMock,
      limit: limitMock,
      populate: populateMock,
    });

    await realtedProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      category: cid,
      _id: { $ne: pid },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: [mockProducts[0]], //only returns the first one since the function should ideally return products with same category
    });
  });

  it("should return 500 if an error occurs during retrieval of related products", async () => {
    const req = { params: { pid: "123", cid: "Novel" } };
    const res = mockResponse();

    // Mock findOne to throw an error
    const findMock = jest.fn().mockImplementation(() => {
      throw new Error("Database Error");
    });

    productModel.find = findMock;

    await realtedProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      category: "Novel",
      _id: { $ne: "123" },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error while geting related product",
      error: expect.any(Error),
    });
  });
});

describe("productCountController", () => {
  it("Returns the current count of products", async () => {
    const req = {};
    const res = mockResponse();

    const mockValue = 10;

    const findMock = jest.fn().mockReturnThis(); // This will return 'this' so that we can chain methods
    const countMock = jest.fn().mockResolvedValue(mockValue); // Finally resolve the products

    // Mock the model's find method to return an object with all the chainable methods
    productModel.find = findMock.mockReturnValue({
      estimatedDocumentCount: countMock,
    });

    await productCountController(req, res);
    expect(findMock).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200); 
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: mockValue, // Verify the total count
    });
  });
});

describe("productCategoryController", () => {
  it("should return products for the given category", async () => {
    const req = { params: { slug: "electronics" } };
    const res = mockResponse();

    const mockCategory = [
      {
        name: "electronics",
        slug: "electronics",
      },
    ];
    const mockProducts = [
      {
        name: "Test electronic",
        description: "Test description",
        price: 150,
        category: "electronics",
        quantity: 10,
        shipping: true,
      },
      {
        name: "Test book",
        description: "Test description",
        price: 150,
        category: "book",
        quantity: 10,
        shipping: true,
      },
    ];

    categoryModel.findOne.mockResolvedValue(mockCategory);

    const findMock = jest.fn().mockReturnThis();
    const populateMock = jest
      .fn()
      .mockResolvedValue(
        mockProducts.filter((product) => product.category === "electronics"),
      );

    productModel.find = findMock.mockReturnValue({
      populate: populateMock,
    });

    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
    expect(findMock).toHaveBeenCalledWith({ category: mockCategory });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: [mockProducts[0]], //only returns first product since 2nd one doesnt match category name
    });
  });

  it("should return 400 if an error occurs", async () => {
    const req = { params: { slug: "electronics" } };
    const res = mockResponse();

    const findOneMock = jest.fn().mockImplementation(() => {
      throw new Error("Database Error");
    });

    categoryModel.findOne = findOneMock;
    await productCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
      message: "Error While Getting products",
    });
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
