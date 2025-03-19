import { expect, jest } from "@jest/globals";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Auth middleware Unit Tests", () => {
  let req, res, next;

  describe("requireSignIn Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        headers: { authorization: "" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      next = jest.fn();
    });

    it("Should assign user when token is valid, and call next()", async () => {
      const mockUser = { _id: "123" };
      const validToken = "valid-token";
      req.headers.authorization = validToken;
      JWT.verify.mockReturnValueOnce(mockUser);

      await requireSignIn(req, res, next);

      expect(JWT.verify).toHaveBeenCalledWith(
        validToken,
        process.env.JWT_SECRET,
      );
      expect(req.user).toEqual(mockUser);
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
      const error = new Error("Invalid token");
      req.headers.authorization = invalidToken;
      JWT.verify.mockImplementation(() => {
        throw error;
      });

      await requireSignIn(req, res, next);

      expect(JWT.verify).toHaveBeenCalledWith(
        invalidToken,
        process.env.JWT_SECRET,
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin Tests", () => {
    let user_id = "123";

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        headers: { authorization: "" },
        user: { _id: user_id },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      next = jest.fn();
    });

    it("Should call next() if user is an admin", async () => {
      userModel.findById.mockResolvedValueOnce({ _id: user_id, role: 1 });

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith(user_id);
      expect(next).toHaveBeenCalled();
    });

    it("Should have 401 res if user is not an admin, and next() shouldnt be called", async () => {
      userModel.findById.mockResolvedValueOnce({ _id: user_id, role: 0 });

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith(user_id);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized Access",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("Should have 401 res if user is not found, and next() shouldnt be called", async () => {
      userModel.findById.mockResolvedValueOnce(null);

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith(user_id);
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

    it("Should have 500 res on database error", async () => {
      const dbError = new Error("DB error");
      userModel.findById.mockRejectedValue(dbError);

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith(user_id);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: dbError,
        message: "Error in admin middleware",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
