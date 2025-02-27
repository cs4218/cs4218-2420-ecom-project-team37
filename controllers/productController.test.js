import {
    createProductController,
    updateProductController,
    deleteProductController,
  } from "../controllers/productController.js";
  import productModel from "../models/productModel.js";
  import fs from "fs";
  import slugify from "slugify";
  
  jest.mock("slugify", () => jest.fn());
  jest.mock("fs", () => ({
    readFileSync: jest.fn(),
  }));
  jest.mock("../models/productModel.js");
  
  jest.mock("braintree", () => ({
    BraintreeGateway: jest.fn().mockImplementation(() => ({
      transaction: {
        sale: jest.fn().mockResolvedValue({ success: true }),
      },
    })),
    Environment: {
      Sandbox: "Sandbox",
    },
  }));
  
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
    it("Create a product successfully", async () => {
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
  
    it("Return error when fields are missing", async () => {
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
        { new: true }
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
  