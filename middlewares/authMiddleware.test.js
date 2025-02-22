import { jest } from "@jest/globals";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Auth middleware Tests", () => {
  describe("Unit tests", () => {
    let req, res, next;
  
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, "log").mockImplementation(() => {}); 
      JWT.verify = jest.fn();
      userModel.findById = jest.fn();
      req = { headers: {} };
      res = { 
          status: jest.fn().mockReturnThis(), 
          send: jest.fn() 
      };
      next = jest.fn();
    });

    describe("requireSignIn Tests", () => {
      it("Should assign user when token is valid, and call next()", async () => {
        const mockUser = { _id: "123" };
        JWT.verify.mockReturnValueOnce(mockUser);

        req.headers.authorization = "valid-token";
        
        await requireSignIn(req, res, next);

        expect(JWT.verify).toHaveBeenCalledWith("valid-token", process.env.JWT_SECRET);
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled(); 
      });

      it("Should log error when token is invalid, and next() shouldnt be called", async () => {
        JWT.verify.mockImplementation(() => {
          throw new Error("Invalid token");
        });

        req.headers.authorization = "invalid-token";

        await requireSignIn(req, res, next);

        expect(JWT.verify).toHaveBeenCalledWith("invalid-token", process.env.JWT_SECRET);
        expect(console.log).toHaveBeenCalled(); 
        expect(next).not.toHaveBeenCalled();
      });
    })

    describe("isAdmin Tests", () => {

      it("Should call next() if user is an admin", async () => {
        req.user = { _id: "123" }; 
        userModel.findById.mockResolvedValueOnce({ _id: "123", role: 1 }); 

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith("123");
        expect(next).toHaveBeenCalled(); 
      });

      it("Should have 401 res if user is not an admin, and next() shouldnt be called", async () => {
        req.user = { _id: "123" };
        userModel.findById.mockResolvedValueOnce({ _id: "123", role: 0 });

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith("123");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "UnAuthorized Access",
        });
        expect(next).not.toHaveBeenCalled();
      });

      it("Should have 401 res on database error", async () => {
        req.user = { _id: "123" };
        const dbError = new Error("DB error");
        userModel.findById.mockRejectedValue(dbError);

        await isAdmin(req, res, next);

        expect(userModel.findById).toHaveBeenCalledWith("123");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error in admin middleware",
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
  
  
  // describe("Integration tests", () => {
  // })
});

