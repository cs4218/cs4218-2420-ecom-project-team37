import { jest } from "@jest/globals";
import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "../config/db.js";

// Set timeout to 30 seconds for all tests in this file
jest.setTimeout(30000);

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Category Controller - Integration Tests", () => {
  let mongoServer;
  let req, res;
  let dbCategories;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await connectDB();
  }, 30000); // Add 30 seconds timeout specifically for this hook

  afterAll(async () => {
    // Drop DB and close all connections
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }, 30000); // Add 30 seconds timeout for cleanup as well

  beforeEach(async () => {
    // Reset the database for each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Setup test data
    dbCategories = [
      { _id: new Types.ObjectId(), name: "Electronics", slug: "electronics" },
      { _id: new Types.ObjectId(), name: "Books", slug: "books" },
    ];

    // Create test categories in the database
    await categoryModel.create(dbCategories);

    // Setup request and response objects
    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("creates a category and then fetches all categories including the new one", async () => {
    // Step 1: Create a new category
    req.body = { name: "Fashion" };

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "New category created",
      }),
    );

    // Step 2: Fetch all categories and verify the new one is included
    res.status.mockClear();
    res.send.mockClear();

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.send.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.category).toHaveLength(3);
    expect(response.category.some((c) => c.name === "Fashion")).toBe(true);
  }, 10000); // Add timeout for this test

  it("updates a category and then verifies the update with single category fetch", async () => {
    // Step 1: Update a category
    const firstCategory = await categoryModel.findOne({ name: "Electronics" });
    req.params = { id: firstCategory._id.toString() };
    req.body = { name: "Updated Electronics" };

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Category updated successfully",
      }),
    );

    // Step 2: Fetch the updated category by slug
    res.status.mockClear();
    res.send.mockClear();
    req.params = { slug: "updated-electronics" };

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.send.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.category.name).toBe("Updated Electronics");
  }, 10000); // Add timeout for this test

  it("deletes a category and confirms it no longer appears in the list", async () => {
    // Step 1: Delete a category
    const secondCategory = await categoryModel.findOne({ name: "Books" });
    req.params = { id: secondCategory._id.toString() };

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Category Deleted Successfully",
      }),
    );

    // Step 2: Fetch all categories and verify the deleted one is gone
    res.status.mockClear();
    res.send.mockClear();

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.send.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.category).toHaveLength(1);
    expect(response.category.some((c) => c.name === "Books")).toBe(false);
  }, 10000); // Add timeout for this test

  it("handles error scenarios correctly in a multi-step operation", async () => {
    // Step 1: Try to create a duplicate category
    req.body = { name: "Electronics" };

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Category already exists",
      }),
    );

    // Step 2: Try to update a category to an existing name
    res.status.mockClear();
    res.send.mockClear();

    const secondCategory = await categoryModel.findOne({ name: "Books" });
    req.params = { id: secondCategory._id.toString() };
    req.body = { name: "Electronics" };

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Category with this name already exists",
      }),
    );
  }, 10000); // Add timeout for this test
});
