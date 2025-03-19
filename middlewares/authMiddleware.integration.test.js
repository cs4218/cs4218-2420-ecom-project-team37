import mongoose,  { Types } from "mongoose";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware.js";
import connectDB from "../config/db";
import dotenv from "dotenv";

dotenv.config();
console.log("ENV Loaded: ", process.env.BRAINTREE_PUBLIC_KEY); 
jest.spyOn(console, "log");
jest.spyOn(JWT, "verify");
jest.spyOn(userModel, "findById");

describe("Auth middleware integration tests ", () => {
    let mongoServer;
    let testUser, testAdmin;
    let req, res, next;
    const password = "password"
    
    beforeAll(async () => {
        // Start up in memory db
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URL = mongoServer.getUri();
        await connectDB();

        const hash_password = await hashPassword(password);

        testUser = await userModel.create({
            name: "Test User",
            email: "testuser@gmail.com",
            password: hash_password,
            phone: "1234567890",
            address: "123 Test Street",
            answer: "Test Answer",
            role: "0"
        });

        testAdmin = await userModel.create({
            name: "Test Admin",
            email: "testadmin@gmail.com",
            password: hash_password,
            phone: "1234567890",
            address: "123 Test Street",
            answer: "Test Answer",
            role: "1"
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            headers: { authorization: "" },
        }

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        next = jest.fn();
    });    
  
    afterAll(async () => {
        // drop db and close all connections
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });
 
    describe("requireSignIn integration Tests", () => {
        it("Should assign user when token is valid, and call next()", async () => {
            const validToken = JWT.sign({ _id: testUser._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            req.headers.authorization = validToken;

            await requireSignIn(req, res, next);
    
            expect(JWT.verify).toHaveBeenCalledWith(
                validToken,
                process.env.JWT_SECRET,
            );
            expect(req.user._id.toString()).toEqual(testUser._id.toString());
            expect(next).toHaveBeenCalled();
        });

        it("Should assign admin when token is valid, and call next()", async () => {
            const validToken = JWT.sign({ _id: testAdmin._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            req.headers.authorization = validToken;

            await requireSignIn(req, res, next);
    
            expect(JWT.verify).toHaveBeenCalledWith(
                validToken,
                process.env.JWT_SECRET,
            );
            expect(req.user._id.toString()).toEqual(testAdmin._id.toString());
            expect(next).toHaveBeenCalled();
        });
    
        it("Should have 400 res when no header in req, and next() shouldnt be called", async () => {
            delete req.headers;
    
            await requireSignIn(req, res, next);
    
            expect(JWT.verify).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "No Authorization in header",
            });
            expect(next).not.toHaveBeenCalled();
        });
    
        it("Should have 400 res when no authorization in req, and next() shouldnt be called", async () => {
            delete req.headers.authorization;
    
            await requireSignIn(req, res, next);
    
            expect(JWT.verify).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "No Authorization in header",
            });
            expect(next).not.toHaveBeenCalled();
        });
    
        it("Should log error when token is invalid, and next() shouldnt be called", async () => {
            const invalidToken = "invalid-token";
            req.headers.authorization = invalidToken;
    
            await requireSignIn(req, res, next);
    
            expect(JWT.verify).toHaveBeenCalledWith(
                invalidToken,
                process.env.JWT_SECRET,
            );
            expect(next).not.toHaveBeenCalled();
        });
    })

    describe("isAdmin Tests", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            req = {
                headers: { authorization: "" },
                user: { _id: testUser._id },
            };
            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };
            next = jest.fn();
        });
    
        it("Should call next() if user is admin", async () => {
            req.user._id = testAdmin._id;

            await isAdmin(req, res, next);
        
            expect(userModel.findById).toHaveBeenCalledWith(testAdmin._id);
            expect(next).toHaveBeenCalled();
        });
    
        it("Should have 401 res if user is not an admin, and next() shouldnt be called", async () => {
            req.user._id = testUser._id;
        
            await isAdmin(req, res, next);
        
            expect(userModel.findById).toHaveBeenCalledWith(testUser._id);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Unauthorized Access",
            });
            expect(next).not.toHaveBeenCalled();
        });
    
        it("Should have 401 res if user is not found, and next() shouldnt be called", async () => {
            req.user._id = new Types.ObjectId();

            await isAdmin(req, res, next);
        
            expect(userModel.findById).toHaveBeenCalledWith(req.user._id);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Unauthorized Access",
            });
            expect(next).not.toHaveBeenCalled();
        });
    
        it("Should have 500 res if no user id is found in req, and next() shouldnt be called", async () => {
            delete req.user;
        
            await isAdmin(req, res, next);
        
            expect(userModel.findById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: "Error in admin middleware",
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
})