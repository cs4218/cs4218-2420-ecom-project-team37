import { jest } from "@jest/globals";
import {
    createCategoryController,
    updateCategoryController,
    categoryController,
    singleCategoryController,
    deleteCategoryController,
} from "./categoryController";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");

describe("Category Controller Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    describe("createCategoryController", () => {
        test("should return 400 if name is not provided", async () => {
            req.body = {}; 
            await createCategoryController(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
        });

        test("should return 200 if category already exists", async () => {
            req.body = { name: "Electronics" };
            categoryModel.findOne = jest.fn().mockResolvedValue({ name: "Electronics" });

            await createCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category already exists",
            });
        });

        test("should create new category and return 201", async () => {
            req.body = { name: "Books" };
            categoryModel.findOne = jest.fn().mockResolvedValue(null);
            const savedCategory = { name: "Books", slug: slugify("Books"), _id: "123" };

            categoryModel.prototype.save = jest.fn().mockResolvedValue(savedCategory);

            await createCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Books" });
            expect(categoryModel.prototype.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "New category created",
                category: savedCategory,
            });
        });
    });

    describe("updateCategoryController", () => {
        test("should update category and return 200", async () => {
            req.params = { id: "123" };
            req.body = { name: "Updated Category" };
            const updatedCategory = {
                name: "Updated Category",
                slug: slugify("Updated Category"),
                _id: "123",
            };
            categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedCategory);

            await updateCategoryController(req, res);

            expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "123",
                { name: "Updated Category", slug: slugify("Updated Category") },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category updated successfully",
                category: updatedCategory,
            });
        });
    });

    describe("categoryController (get all categories)", () => {
        test("should return all categories", async () => {
            const categoriesList = [
                { name: "Cat1", slug: slugify("Cat1"), _id: "1" },
                { name: "Cat2", slug: slugify("Cat2"), _id: "2" },
            ];
            categoryModel.find = jest.fn().mockResolvedValue(categoriesList);

            await categoryController(req, res);

            expect(categoryModel.find).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "All Categories List",
                category: categoriesList,
            });
        });
    });

    describe("singleCategoryController", () => {
        test("should return a single category based on slug", async () => {
            req.params = { slug: "books" };
            const foundCategory = { name: "Books", slug: "books", _id: "123" };
            categoryModel.findOne = jest.fn().mockResolvedValue(foundCategory);

            await singleCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "books" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Get Single Category Successfully",
                category: foundCategory,
            });
        });
    });

    describe("deleteCategoryController", () => {
        test("should delete category and return 200", async () => {
            req.params = { id: "123" };
            categoryModel.findByIdAndDelete = jest.fn().mockResolvedValue({});

            await deleteCategoryController(req, res);

            expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category Deleted Successfully",
            });
        });
    });
});
